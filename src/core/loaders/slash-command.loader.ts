import { Client, REST, Routes, ApplicationCommandOptionType } from 'discord.js';
import { CommandLoader } from './command.loader';
import { COMMAND_METADATA_KEY, ICommandOptions } from '@/core/decorators/command.decorator';
import { ARGUMENT_METADATA_KEY, IArgumentOptions } from '@/core/decorators/argument.decorator';
import { PLUGIN_METADATA_KEY } from '@/core/decorators/plugin.decorator';
import { PluginRegistry } from '@/config/plugin.registry';
import { BasePlugin } from '@/core/structures/BasePlugin';
import { Env } from '@/utils/Env';

export class SlashCommandLoader {
    constructor(
        private client: Client,
        private commandLoader: CommandLoader,
    ) {}

    /**
     * Registra todos los slash commands en Discord
     */
    async registerSlashCommands(): Promise<void> {
        const config = Env.get();
        console.log('🔄 Registrando comandos Slash...');

        const rest = new REST({ version: '10' }).setToken(config.BOT_TOKEN);
        const slashCommandsJSON: any[] = [];

        // Primero, agrupar subcomandos por comando padre
        const commandGroups = new Map<string, string[]>();
        const standaloneCommands = new Set<string>();

        for (const [commandName] of this.commandLoader.getAllCommands()) {
            const nameParts = commandName.split(' ');

            if (nameParts.length > 1) {
                // Es un subcomando (ej: "user info" -> padre: "user", sub: "info")
                const parentName = nameParts[0];
                const subName = nameParts.slice(1).join(' ');

                if (!commandGroups.has(parentName)) {
                    commandGroups.set(parentName, []);
                }
                commandGroups.get(parentName)!.push(subName);
            } else {
                // Es un comando standalone
                standaloneCommands.add(commandName);
            }
        }

        // Procesar comandos
        for (const [commandName, commandClass] of this.commandLoader.getAllCommands()) {
            const cmdMeta: ICommandOptions = Reflect.getMetadata(
                COMMAND_METADATA_KEY,
                commandClass,
            );
            const argsMeta: IArgumentOptions[] =
                Reflect.getMetadata(ARGUMENT_METADATA_KEY, commandClass) || [];

            // Detectar si es un subcomando (nombre con espacio: "config get")
            const nameParts = cmdMeta.name.split(' ');
            const isSubcommand = nameParts.length > 1;

            if (isSubcommand) {
                // Si es un subcomando, verificar si hay un comando padre explícito
                const parentName = nameParts[0];
                const parentCommand = this.commandLoader.getCommand(parentName);

                // Si existe un comando padre con subcommands declarados, saltarlo (se procesa con el padre)
                if (parentCommand) {
                    const parentMeta: ICommandOptions = Reflect.getMetadata(
                        COMMAND_METADATA_KEY,
                        parentCommand,
                    );
                    if (parentMeta.subcommands && parentMeta.subcommands.length > 0) {
                        continue;
                    }
                }

                // Si llegamos aquí, es un subcomando sin padre explícito
                // Verificar si ya procesamos el grupo
                if (commandGroups.has(parentName)) {
                    const subcommandsInGroup = commandGroups.get(parentName)!;

                    // Solo el primer subcomando del grupo crea el comando padre
                    const firstSubName = subcommandsInGroup[0];
                    const firstSubFullName = `${parentName} ${firstSubName}`;

                    if (cmdMeta.name !== firstSubFullName) {
                        // No es el primero, ya fue procesado
                        continue;
                    }

                    // Crear comando agrupador con todos los subcomandos
                    const subcommandOptions = subcommandsInGroup.map((subName) => {
                        const subCommandName = `${parentName} ${subName}`;
                        const subCommandClass = this.commandLoader.getCommand(subCommandName)!;
                        const subMeta: ICommandOptions = Reflect.getMetadata(
                            COMMAND_METADATA_KEY,
                            subCommandClass,
                        );
                        const subArgs: IArgumentOptions[] =
                            Reflect.getMetadata(ARGUMENT_METADATA_KEY, subCommandClass) || [];

                        const options = subArgs.map((arg) => {
                            const propType = Reflect.getMetadata(
                                'design:type',
                                subCommandClass.prototype,
                                (arg as any).propertyName,
                            );

                            const optionType = this.getApplicationCommandOptionType(propType.name);

                            const option: any = {
                                name: arg.name,
                                description: arg.description,
                                type: optionType,
                                required: arg.required || false,
                            };

                            if (arg.options && arg.options.length > 0) {
                                option.choices = arg.options.map((opt) => ({
                                    name: opt.label,
                                    value: opt.value,
                                }));
                            }

                            return option;
                        });

                        return {
                            name: subName,
                            description: subMeta.description,
                            type: ApplicationCommandOptionType.Subcommand,
                            options,
                        };
                    });

                    const commandJson = {
                        name: parentName,
                        description: `Comandos de ${parentName}`,
                        options: subcommandOptions,
                    };

                    // Ejecutar plugins del primer subcomando (representativo del grupo)
                    const commandPath = this.commandLoader.getCommandPath(commandName) || '';
                    const plugins = this.getPluginsForCommand(commandClass, commandPath);

                    let shouldRegister = true;

                    for (const plugin of plugins) {
                        if (plugin.onBeforeRegisterCommand) {
                            const jsonCopy = JSON.parse(JSON.stringify(commandJson));
                            const result = await plugin.onBeforeRegisterCommand(
                                commandClass,
                                jsonCopy,
                            );

                            if (result === false) {
                                shouldRegister = false;
                                console.log(`⏭️  Comando "${parentName}" omitido por plugin`);
                                break;
                            } else if (result && typeof result === 'object') {
                                Object.assign(commandJson, result);
                            }
                        }
                    }

                    if (shouldRegister) {
                        slashCommandsJSON.push(commandJson);
                    }

                    continue;
                }
            }

            // Verificar si tiene subcomandos declarados explícitamente
            const hasSubcommands = cmdMeta.subcommands && cmdMeta.subcommands.length > 0;

            let commandJson: any;

            if (hasSubcommands) {
                // Comando con subcomandos: construir estructura de Discord
                const subcommandOptions = cmdMeta.subcommands!.map((subName) => {
                    // Buscar la clase del subcomando (puede estar en archivo separado)
                    const subCommandName = `${cmdMeta.name} ${subName}`;
                    const subCommandClass = this.commandLoader.getCommand(subCommandName);

                    let subArgs: IArgumentOptions[] = [];
                    let subDescription = `Subcomando ${subName}`;

                    if (subCommandClass) {
                        // Subcomando en archivo separado
                        const subMeta: ICommandOptions = Reflect.getMetadata(
                            COMMAND_METADATA_KEY,
                            subCommandClass,
                        );
                        subDescription = subMeta.description;
                        subArgs = Reflect.getMetadata(ARGUMENT_METADATA_KEY, subCommandClass) || [];
                    } else {
                        // Subcomando en mismo archivo, usar argumentos del comando padre
                        // Filtrar solo los argumentos que pertenecen a este subcomando
                        subArgs = argsMeta.filter((arg) => {
                            // Si el argumento no especifica subcommands, incluirlo en todos
                            if (!arg.subcommands || arg.subcommands.length === 0) {
                                return true;
                            }
                            // Si especifica subcommands, incluirlo solo si este subName está en la lista
                            return arg.subcommands.includes(subName);
                        });
                    }

                    const options = subArgs.map((arg) => {
                        const propType = Reflect.getMetadata(
                            'design:type',
                            (subCommandClass || commandClass).prototype,
                            (arg as any).propertyName,
                        );

                        const optionType = this.getApplicationCommandOptionType(propType.name);

                        const option: any = {
                            name: arg.name,
                            description: arg.description,
                            type: optionType,
                            required: arg.required || false,
                        };

                        if (arg.options && arg.options.length > 0) {
                            option.choices = arg.options.map((opt) => ({
                                name: opt.label,
                                value: opt.value,
                            }));
                        }

                        return option;
                    });

                    return {
                        name: subName,
                        description: subDescription,
                        type: ApplicationCommandOptionType.Subcommand,
                        options,
                    };
                });

                commandJson = {
                    name: cmdMeta.name,
                    description: cmdMeta.description,
                    options: subcommandOptions,
                };
            } else {
                // Comando normal sin subcomandos
                const options = argsMeta.map((arg) => {
                    const propType = Reflect.getMetadata(
                        'design:type',
                        commandClass.prototype,
                        (arg as any).propertyName,
                    );

                    const optionType = this.getApplicationCommandOptionType(propType.name);

                    const option: any = {
                        name: arg.name,
                        description: arg.description,
                        type: optionType,
                        required: arg.required || false,
                    };

                    // Agregar choices si existen opciones
                    if (arg.options && arg.options.length > 0) {
                        option.choices = arg.options.map((opt) => ({
                            name: opt.label,
                            value: opt.value,
                        }));
                    }

                    return option;
                });

                commandJson = {
                    name: cmdMeta.name,
                    description: cmdMeta.description,
                    options,
                };
            }

            // Ejecutar onBeforeRegisterCommand de plugins aplicables
            const commandPath = this.commandLoader.getCommandPath(commandName) || '';
            const plugins = this.getPluginsForCommand(commandClass, commandPath);

            let shouldRegister = true;

            for (const plugin of plugins) {
                if (plugin.onBeforeRegisterCommand) {
                    // Pasar una COPIA del JSON
                    const jsonCopy = JSON.parse(JSON.stringify(commandJson));
                    const result = await plugin.onBeforeRegisterCommand(commandClass, jsonCopy);

                    if (result === false) {
                        // Cancelar registro de este comando
                        shouldRegister = false;
                        console.log(`⏭️  Comando "${cmdMeta.name}" omitido por plugin`);
                        break;
                    } else if (result && typeof result === 'object') {
                        // Usar JSON modificado
                        commandJson = result;
                    }
                    // null/undefined = usar el original (no hacer nada)
                }
            }

            if (shouldRegister) {
                slashCommandsJSON.push(commandJson);
            }
        }

        try {
            const registeredCommands: any = await rest.put(
                Routes.applicationCommands(this.client.user!.id),
                {
                    body: slashCommandsJSON,
                },
            );

            console.log('✅ Comandos Slash registrados.');

            // Ejecutar onAfterRegisterCommand para cada comando registrado
            for (const registeredCommand of registeredCommands) {
                const commandClass = this.commandLoader.getCommand(registeredCommand.name);
                if (!commandClass) continue;

                const commandPath = this.commandLoader.getCommandPath(registeredCommand.name) || '';
                const plugins = this.getPluginsForCommand(commandClass, commandPath);

                for (const plugin of plugins) {
                    if (plugin.onAfterRegisterCommand) {
                        await plugin.onAfterRegisterCommand(commandClass, registeredCommand);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error al registrar comandos Slash:', error);
        }
    }

    /**
     * Obtiene todos los plugins aplicables a un comando
     * Prioridad: @UsePlugins primero, luego plugins de scope
     */
    private getPluginsForCommand(
        commandClass: new (...args: any[]) => any,
        commandPath: string,
    ): BasePlugin[] {
        const plugins: BasePlugin[] = [];

        // 1. Plugins de @UsePlugins (máxima prioridad)
        const decoratorPlugins: BasePlugin[] =
            Reflect.getMetadata(PLUGIN_METADATA_KEY, commandClass) || [];
        plugins.push(...decoratorPlugins);

        // 2. Plugins de scope (registry)
        const scopePlugins = PluginRegistry.getPluginsForCommand(commandClass, commandPath);
        plugins.push(...scopePlugins);

        return plugins;
    }

    /**
     * Mapea tipos de TypeScript a tipos de opciones de Discord
     */
    private getApplicationCommandOptionType(typeName: string): ApplicationCommandOptionType {
        switch (typeName) {
            case 'String':
                return ApplicationCommandOptionType.String;
            case 'Number':
                return ApplicationCommandOptionType.Number;
            case 'Boolean':
                return ApplicationCommandOptionType.Boolean;
            case 'User':
                return ApplicationCommandOptionType.User;
            case 'Channel':
                return ApplicationCommandOptionType.Channel;
            case 'Role':
                return ApplicationCommandOptionType.Role;
            case 'Attachment':
                return ApplicationCommandOptionType.Attachment;
            default:
                return ApplicationCommandOptionType.String;
        }
    }
}
