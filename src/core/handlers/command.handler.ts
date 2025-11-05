import { ChatInputCommandInteraction, Message, EmbedBuilder, ColorResolvable } from 'discord.js';

import { BaseCommand } from '@/core/structures/BaseCommand';
import { BasePlugin } from '@/core/structures/BasePlugin';
import { CommandContext } from '@/core/structures/CommandContext';
import { ARGUMENT_METADATA_KEY, IArgumentOptions } from '@/core/decorators/argument.decorator';
import { PLUGIN_METADATA_KEY } from '@/core/decorators/plugin.decorator';
import { ValidationError } from '@/error/ValidationError';
import { ReplyError } from '@/error/ReplyError';
import { ArgumentResolver } from '@/core/resolvers/argument.resolver';
import { PluginRegistry } from '@/config/plugin.registry';
import { CommandLoader } from '../loaders/command.loader';

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
            await command.run();

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
}
