import { ChatInputCommandInteraction, Message, EmbedBuilder, ColorResolvable } from 'discord.js';

import { BaseCommand } from '@/core/structures/BaseCommand';
import { BasePlugin } from '@/core/structures/BasePlugin';
import { CommandContext } from '@/core/structures/CommandContext';
import { ARGUMENT_METADATA_KEY, IArgumentOptions } from '@/core/decorators/argument.decorator';
import { COMMAND_METADATA_KEY, ICommandOptions } from '@/core/decorators/command.decorator';
import { PLUGIN_METADATA_KEY } from '@/core/decorators/plugin.decorator';
import { ValidationError } from '@/error/ValidationError';
import { ReplyError } from '@/error/ReplyError';
import { ArgumentResolver } from '@/core/resolvers/argument.resolver';
import { PluginRegistry } from '@/config/plugin.registry';
import { CommandLoader } from '../loaders/command.loader';
import { createMissingSubcommandEmbed } from '@/utils/CommandUtils';

type CommandClass = new (...args: any[]) => BaseCommand;

export class CommandHandler {
    private colors = {
        error: '#ca5c5c' as ColorResolvable,
        success: '#6ec06c' as ColorResolvable,
        warning: '#d49954' as ColorResolvable,
        info: '#5180d6' as ColorResolvable,
    };

    /**
     * Ejecuta un comando con sus argumentos resueltos
     */
    async executeCommand(
        source: Message | ChatInputCommandInteraction,
        TCommandClass: CommandClass,
        commandLoader: CommandLoader,
        textArgs?: any[],
        commandPath?: string,
    ): Promise<void> {
        const command = new TCommandClass();
        const ctx = new CommandContext(source);

        // Inyectar contexto en el comando
        (command as any).ctx = ctx;
        (command as any).user = ctx.user;
        (command as any).channel = ctx.channel;
        (command as any).guild = ctx.guild;
        (command as any).client = ctx.client;
        (command as any).loader = commandLoader;

        // Obtener metadata del comando ANTES de resolver argumentos
        const cmdMeta: ICommandOptions = Reflect.getMetadata(COMMAND_METADATA_KEY, TCommandClass);

        // Verificar si el comando tiene subcomandos declarados explícitamente
        const hasExplicitSubcommands = cmdMeta.subcommands && cmdMeta.subcommands.length > 0;

        // Para comandos unificados (con subcommands definidos), validar el subcomando ANTES de resolver argumentos
        if (hasExplicitSubcommands && !ctx.isInteraction && (!textArgs || textArgs.length === 0)) {
            const embed = createMissingSubcommandEmbed(
                cmdMeta.name,
                cmdMeta.subcommands!,
                commandLoader.prefix,
            );
            await ctx.reply({ embeds: [embed] });
            return;
        }

        const argsMeta: IArgumentOptions[] =
            Reflect.getMetadata(ARGUMENT_METADATA_KEY, TCommandClass) || [];

        try {
            // Resolver todos los argumentos
            const resolvedArgs = await ArgumentResolver.resolveArguments(
                source,
                ctx,
                argsMeta,
                TCommandClass,
                textArgs,
            );

            // Inyectar argumentos resueltos en el comando
            for (const [propertyName, value] of resolvedArgs) {
                (command as any)[propertyName] = value;
            }
        } catch (error) {
            await this.handleValidationError(error, ctx);
            return;
        }

        // Obtener plugins
        const plugins = this.getPluginsForCommand(TCommandClass, commandPath || '');

        // Ejecutar el comando con plugins
        try {
            // Ejecutar onBeforeExecute de todos los plugins
            for (const plugin of plugins) {
                if (plugin.onBeforeExecute) {
                    const shouldContinue = await plugin.onBeforeExecute(command);
                    // Si el plugin retorna false, cancelar la ejecución silenciosamente
                    if (shouldContinue === false) {
                        return;
                    }
                }
            }

            // Ejecutar el comando
            // Determinar si tiene subcomandos y cuál ejecutar
            let subcommandName: string | undefined;

            if (hasExplicitSubcommands) {
                // Comando con subcomandos explícitos (ej: config con subcommands: ['get', 'set'])
                // Para slash commands, Discord.js maneja el subcomando automáticamente
                if (ctx.isInteraction && (source as ChatInputCommandInteraction).options) {
                    const interaction = source as ChatInputCommandInteraction;
                    const group = interaction.options.getSubcommandGroup(false);
                    const subcommand = interaction.options.getSubcommand(false);

                    // Si hay grupo, combinar "grupo subcomando"
                    if (group && subcommand) {
                        subcommandName = `${group} ${subcommand}`;
                    } else if (subcommand) {
                        subcommandName = subcommand;
                    }
                } else if (textArgs && textArgs.length > 0) {
                    // Para text commands, necesitamos determinar si es:
                    // - Nivel 2: "get" (1 palabra)
                    // - Nivel 3: "alpha first" (2 palabras - grupo + subcomando)

                    // Intentar con 2 palabras primero (grupo + subcomando)
                    if (
                        textArgs.length >= 2 &&
                        typeof textArgs[0] === 'string' &&
                        typeof textArgs[1] === 'string'
                    ) {
                        const potentialTwoWords = `${textArgs[0]} ${textArgs[1]}`.toLowerCase();

                        if (cmdMeta.subcommands!.includes(potentialTwoWords)) {
                            subcommandName = potentialTwoWords;
                        }
                    }

                    // Si no se encontró con 2 palabras, intentar con 1 palabra
                    if (!subcommandName && typeof textArgs[0] === 'string') {
                        const potentialOneWord = textArgs[0].toLowerCase();

                        if (cmdMeta.subcommands!.includes(potentialOneWord)) {
                            subcommandName = potentialOneWord;
                        }
                    }

                    // Si aún no se encontró, es inválido
                    if (!subcommandName) {
                        throw new ValidationError(
                            `Subcomando "${textArgs[0]}" no válido. Disponibles: ${cmdMeta.subcommands?.join(', ')}`,
                        );
                    }
                }

                if (subcommandName) {
                    // Convertir nombre de subcomando a nombre de método
                    // "get" → "subcommandGet"
                    // "delete-all" → "subcommandDeleteAll"
                    const methodName = this.getSubcommandMethodName(subcommandName);

                    if (typeof (command as any)[methodName] !== 'function') {
                        throw new Error(
                            `El método ${methodName}() no existe en el comando ${cmdMeta.name}`,
                        );
                    }

                    await (command as any)[methodName]();
                }
            } else {
                // Comando sin subcomandos explícitos o subcomando individual (ej: "user info")
                // Ejecutar run() normal
                await command.run();
            }

            // Ejecutar onAfterExecute en orden INVERSO
            for (let i = plugins.length - 1; i >= 0; i--) {
                const plugin = plugins[i];
                if (plugin.onAfterExecute) {
                    await plugin.onAfterExecute(command);
                }
            }
        } catch (error) {
            await this.handleExecutionError(error, ctx);
        }
    }

    /**
     * Obtiene todos los plugins aplicables a un comando
     * Prioridad: @UsePlugins primero, luego plugins de scope
     */
    private getPluginsForCommand(TCommandClass: CommandClass, commandPath: string): BasePlugin[] {
        const plugins: BasePlugin[] = [];

        // 1. Plugins de @UsePlugins (máxima prioridad)
        const decoratorPlugins: BasePlugin[] =
            Reflect.getMetadata(PLUGIN_METADATA_KEY, TCommandClass) || [];
        plugins.push(...decoratorPlugins);

        // 2. Plugins de scope (registry)
        const scopePlugins = PluginRegistry.getPluginsForCommand(TCommandClass, commandPath);
        plugins.push(...scopePlugins);

        return plugins;
    }

    /**
     * Maneja errores de validación de argumentos
     */
    private async handleValidationError(error: unknown, ctx: CommandContext): Promise<void> {
        if (error instanceof ValidationError) {
            const embed = new EmbedBuilder()
                .setTitle('Error de uso')
                .setDescription(error.message)
                .setColor(this.colors.error)
                .setFooter({
                    text: `${ctx.user.globalName}`,
                    iconURL: ctx.user.displayAvatarURL(),
                });
            await ctx.reply({ embeds: [embed] });
        } else {
            console.error('Ocurrió un error al validar el comando:', error);
            await ctx.reply('Ocurrió un error al procesar tus argumentos');
        }
    }

    /**
     * Maneja errores durante la ejecución del comando
     */
    private async handleExecutionError(error: unknown, ctx: CommandContext): Promise<void> {
        if (error instanceof ReplyError) {
            const embed = new EmbedBuilder()
                .setColor(this.colors.error)
                .setTitle('Error')
                .setDescription(error.message)
                .setFooter({
                    text: `Solicitado por: ${ctx.user.username}`,
                    iconURL: ctx.user.displayAvatarURL(),
                });

            await ctx.reply({ embeds: [embed] });
        } else if (error instanceof ValidationError) {
            // Tratar ValidationError como error esperado
            await this.handleValidationError(error, ctx);
        } else {
            console.error('Ocurrió un error al ejecutar el comando:', error);
            const embed = new EmbedBuilder()
                .setColor(this.colors.error)
                .setTitle('Error')
                .setDescription(
                    `Ocurrió un error inesperado al procesar el comando. Intenta nuevamente más tarde`,
                )
                .setFooter({
                    text: `Solicitado por: ${ctx.user.username}`,
                    iconURL: ctx.user.displayAvatarURL(),
                });

            await ctx.send({ embeds: [embed] });
        }
    }

    /**
     * Convierte un nombre de subcomando a nombre de método
     * @param subcommand - Nombre del subcomando (ej: "get", "delete-all", "config get")
     * @returns Nombre del método (ej: "subcommandGet", "subcommandDeleteAll", "subcommandConfigGet")
     */
    private getSubcommandMethodName(subcommand: string): string {
        // Primero separar por espacios (para 3 niveles como "config get")
        // Luego separar cada parte por guiones (para kebab-case como "delete-all")
        const words = subcommand
            .split(' ')
            .flatMap((part) => part.split('-'))
            .map((word) => {
                // Capitalizar primera letra de cada palabra
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join('');

        return `subcommand${words}`;
    }
}
