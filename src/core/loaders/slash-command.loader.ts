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
     * Crea las opciones de un comando a partir de sus argumentos
     */
    private buildCommandOptions(commandClass: new (...args: any[]) => any): any[] {
        const argsMeta: IArgumentOptions[] =
            Reflect.getMetadata(ARGUMENT_METADATA_KEY, commandClass) || [];

        return argsMeta.map((arg) => {
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
    }

    /**
     * Registra todos los slash commands en Discord
     */
    async registerSlashCommands(): Promise<void> {
        const config = Env.get();
        console.log('🔄 Registrando comandos Slash...');

        const rest = new REST({ version: '10' }).setToken(config.BOT_TOKEN);
        const slashCommandsJSON: any[] = [];

        // Agrupar comandos por padre
        const commandStructure = new Map<string, any>();

        // Paso 1: Detectar todos los padres únicos de subcomandos y grupos
        const parentNames = new Set<string>();

        for (const [_key, entry] of this.commandLoader['commands']) {
            if (entry.metadata.type === 'subcommand') {
                parentNames.add(entry.metadata.meta.parent.toLowerCase());
            } else if (entry.metadata.type === 'subcommand-group') {
                parentNames.add(entry.metadata.meta.parent.toLowerCase());
            }
        }

        // Paso 2: Procesar comandos base existentes
        for (const [commandName, commandClass] of this.commandLoader.getAllCommands()) {
            const cmdMeta: ICommandOptions = Reflect.getMetadata(
                COMMAND_METADATA_KEY,
                commandClass,
            );

            parentNames.delete(cmdMeta.name.toLowerCase()); // Ya existe, no es fantasma

            const commandJson: any = {
                name: cmdMeta.name,
                description: cmdMeta.description,
                options: [],
            };

            // Agregar subcomandos simples
            const subcommands = this.commandLoader.getSubcommands(cmdMeta.name);
            for (const [_key, subEntry] of subcommands) {
                if (subEntry.metadata.type === 'subcommand') {
                    const subOptions = this.buildCommandOptions(subEntry.class);
                    commandJson.options.push({
                        type: ApplicationCommandOptionType.Subcommand,
                        name: subEntry.metadata.meta.name,
                        description: subEntry.metadata.meta.description,
                        options: subOptions,
                    });
                }
            }

            // Agregar grupos de subcomandos
            const subcommandGroups = this.commandLoader.getSubcommandGroups(cmdMeta.name);
            for (const [groupName, groupCommands] of subcommandGroups) {
                const groupOption: any = {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: groupName,
                    description: `Comandos de ${groupName}`,
                    options: [],
                };

                for (const [_key, groupEntry] of groupCommands) {
                    if (groupEntry.metadata.type === 'subcommand-group') {
                        const subOptions = this.buildCommandOptions(groupEntry.class);
                        groupOption.options.push({
                            type: ApplicationCommandOptionType.Subcommand,
                            name: groupEntry.metadata.meta.subcommand,
                            description: groupEntry.metadata.meta.description,
                            options: subOptions,
                        });
                    }
                }

                commandJson.options.push(groupOption);
            }

            // Si no hay subcomandos, agregar opciones directamente
            if (commandJson.options.length === 0) {
                commandJson.options = this.buildCommandOptions(commandClass);
            }

            commandStructure.set(cmdMeta.name, {
                json: commandJson,
                class: commandClass,
                path: this.commandLoader.getCommandPath(commandName) || '',
            });
        }

        // Paso 3: Crear comandos "fantasma" para padres sin comando base
        for (const parentName of parentNames) {
            const commandJson: any = {
                name: parentName,
                description: `Comandos de ${parentName}`,
                options: [],
            };

            // Agregar subcomandos simples
            const subcommands = this.commandLoader.getSubcommands(parentName);
            for (const [_key, subEntry] of subcommands) {
                if (subEntry.metadata.type === 'subcommand') {
                    const subOptions = this.buildCommandOptions(subEntry.class);
                    commandJson.options.push({
                        type: ApplicationCommandOptionType.Subcommand,
                        name: subEntry.metadata.meta.name,
                        description: subEntry.metadata.meta.description,
                        options: subOptions,
                    });
                }
            }

            // Agregar grupos de subcomandos
            const subcommandGroups = this.commandLoader.getSubcommandGroups(parentName);
            for (const [groupName, groupCommands] of subcommandGroups) {
                const groupOption: any = {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: groupName,
                    description: `Comandos de ${groupName}`,
                    options: [],
                };

                for (const [_key, groupEntry] of groupCommands) {
                    if (groupEntry.metadata.type === 'subcommand-group') {
                        const subOptions = this.buildCommandOptions(groupEntry.class);
                        groupOption.options.push({
                            type: ApplicationCommandOptionType.Subcommand,
                            name: groupEntry.metadata.meta.subcommand,
                            description: groupEntry.metadata.meta.description,
                            options: subOptions,
                        });
                    }
                }

                commandJson.options.push(groupOption);
            }

            // Los comandos fantasma SIEMPRE tienen subcomandos/grupos
            commandStructure.set(parentName, {
                json: commandJson,
                class: null, // No hay clase para comandos fantasma
                path: '',
                isGhost: true, // Marcar como fantasma
            });

            console.log(
                `👻 Comando fantasma creado: "${parentName}" (solo contenedor de subcomandos)`,
            );
        }

        // Paso 4: Procesar con plugins y agregar a la lista final
        for (const [commandName, data] of commandStructure) {
            let commandJson = data.json;
            const commandClass = data.class;
            const commandPath = data.path;
            const isGhost = data.isGhost || false;

            // Los comandos fantasma se registran directamente sin plugins
            if (isGhost) {
                slashCommandsJSON.push(commandJson);
                continue;
            }

            const plugins = this.getPluginsForCommand(commandClass, commandPath);
            let shouldRegister = true;

            for (const plugin of plugins) {
                if (plugin.onBeforeRegisterCommand) {
                    const jsonCopy = JSON.parse(JSON.stringify(commandJson));
                    const result = await plugin.onBeforeRegisterCommand(commandClass, jsonCopy);

                    if (result === false) {
                        shouldRegister = false;
                        console.log(`⏭️  Comando "${commandName}" omitido por plugin`);
                        break;
                    } else if (result && typeof result === 'object') {
                        commandJson = result;
                    }
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

            // Ejecutar onAfterRegisterCommand (solo para comandos reales, no fantasma)
            for (const registeredCommand of registeredCommands) {
                const commandData = commandStructure.get(registeredCommand.name);
                if (!commandData || commandData.isGhost) continue;

                const plugins = this.getPluginsForCommand(commandData.class, commandData.path);

                for (const plugin of plugins) {
                    if (plugin.onAfterRegisterCommand) {
                        await plugin.onAfterRegisterCommand(commandData.class, registeredCommand);
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
