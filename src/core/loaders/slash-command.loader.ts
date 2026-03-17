import {
    Client,
    REST,
    Routes,
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
    SlashCommandSubcommandGroupBuilder,
    SlashCommandStringOption,
    SlashCommandIntegerOption,
    SlashCommandNumberOption,
    SlashCommandBooleanOption,
    SlashCommandUserOption,
    SlashCommandChannelOption,
    SlashCommandRoleOption,
    SlashCommandAttachmentOption,
    SlashCommandMentionableOption,
} from 'discord.js';
import { CommandLoader } from './command.loader';
import { ICommandOptions } from '@/core/decorators/command.decorator';
import { IArgumentOptions } from '@/core/decorators/argument.decorator';
import { PluginRegistry } from '@/config/plugin.registry';
import { Env } from '@/utils/Env';
import { metadataHandler } from '@/core/metadata';

type SlashCommandOptionBuilder =
    | SlashCommandStringOption
    | SlashCommandIntegerOption
    | SlashCommandNumberOption
    | SlashCommandBooleanOption
    | SlashCommandUserOption
    | SlashCommandChannelOption
    | SlashCommandRoleOption
    | SlashCommandAttachmentOption
    | SlashCommandMentionableOption;

export class SlashCommandLoader {
    constructor(
        private client: Client,
        private commandLoader: CommandLoader,
    ) {}

    /**
     * Agrega opciones a un SlashCommandBuilder o SlashCommandSubcommandBuilder
     */
    private addOptionsToBuilder(
        builder: SlashCommandBuilder | SlashCommandSubcommandBuilder,
        commandClass: new (...args: any[]) => any,
    ): void {
        // Usar metadataHandler centralizado
        const argsMeta: IArgumentOptions[] = metadataHandler.getArguments(commandClass);

        for (const arg of argsMeta) {
            // El designType ya está almacenado en la metadata del argumento
            const typeName = (arg as any).designType?.name || 'String';
            this.addOptionByType(builder, arg, typeName);
        }
    }

    /**
     * Agrega una opción específica según su tipo
     */
    private addOptionByType(
        builder: SlashCommandBuilder | SlashCommandSubcommandBuilder,
        arg: IArgumentOptions,
        typeName: string,
    ): void {
        const configureBaseOption = <T extends SlashCommandOptionBuilder>(option: T): T => {
            option.setName(arg.name).setDescription(arg.description);
            if ('setRequired' in option) {
                (option as any).setRequired(arg.required || false);
            }
            return option;
        };

        switch (typeName) {
            case 'String':
                builder.addStringOption((option) => {
                    configureBaseOption(option);
                    if (arg.options && arg.options.length > 0) {
                        option.addChoices(
                            ...arg.options.map((opt) => ({
                                name: opt.label,
                                value: String(opt.value),
                            })),
                        );
                    }
                    return option;
                });
                break;

            case 'Number':
                builder.addNumberOption((option) => {
                    configureBaseOption(option);
                    if (arg.options && arg.options.length > 0) {
                        option.addChoices(
                            ...arg.options.map((opt) => ({
                                name: opt.label,
                                value: Number(opt.value),
                            })),
                        );
                    }
                    return option;
                });
                break;

            case 'BigInt':
            case 'Integer':
                builder.addIntegerOption((option) => {
                    configureBaseOption(option);
                    if (arg.options && arg.options.length > 0) {
                        option.addChoices(
                            ...arg.options.map((opt) => ({
                                name: opt.label,
                                value: Number(opt.value),
                            })),
                        );
                    }
                    return option;
                });
                break;

            case 'Boolean':
                builder.addBooleanOption((option) => {
                    configureBaseOption(option);
                    return option;
                });
                break;

            case 'User':
                builder.addUserOption((option) => {
                    configureBaseOption(option);
                    return option;
                });
                break;

            case 'Channel':
                builder.addChannelOption((option) => {
                    configureBaseOption(option);
                    return option;
                });
                break;

            case 'Role':
                builder.addRoleOption((option) => {
                    configureBaseOption(option);
                    return option;
                });
                break;

            case 'Attachment':
                builder.addAttachmentOption((option) => {
                    configureBaseOption(option);
                    return option;
                });
                break;

            case 'Mentionable':
                builder.addMentionableOption((option) => {
                    configureBaseOption(option);
                    return option;
                });
                break;

            default:
                // Por defecto, usar String
                builder.addStringOption((option) => {
                    configureBaseOption(option);
                    if (arg.options && arg.options.length > 0) {
                        option.addChoices(
                            ...arg.options.map((opt) => ({
                                name: opt.label,
                                value: String(opt.value),
                            })),
                        );
                    }
                    return option;
                });
                break;
        }
    }

    /**
     * Crea un subcomando usando SlashCommandSubcommandBuilder
     */
    private createSubcommand(
        name: string,
        description: string,
        commandClass: new (...args: any[]) => any,
    ): SlashCommandSubcommandBuilder {
        const subcommand = new SlashCommandSubcommandBuilder()
            .setName(name)
            .setDescription(description);

        this.addOptionsToBuilder(subcommand, commandClass);
        return subcommand;
    }

    /**
     * Agrega subcomandos simples a un SlashCommandBuilder
     */
    private addSubcommandsToBuilder(builder: SlashCommandBuilder, parentName: string): void {
        const subcommands = this.commandLoader.getSubcommands(parentName);
        for (const [_key, subEntry] of subcommands) {
            if (subEntry.metadata.type === 'subcommand') {
                const subcommand = this.createSubcommand(
                    subEntry.metadata.meta.name,
                    subEntry.metadata.meta.description,
                    subEntry.class,
                );
                builder.addSubcommand(subcommand);
            }
        }
    }

    /**
     * Agrega grupos de subcomandos a un SlashCommandBuilder
     */
    private addSubcommandGroupsToBuilder(builder: SlashCommandBuilder, parentName: string): void {
        const subcommandGroups = this.commandLoader.getSubcommandGroups(parentName);
        for (const [groupName, groupCommands] of subcommandGroups) {
            const groupBuilder = new SlashCommandSubcommandGroupBuilder()
                .setName(groupName)
                .setDescription(`Comandos de ${groupName}`);

            for (const [_key, groupEntry] of groupCommands) {
                if (groupEntry.metadata.type === 'subcommand-group') {
                    const subcommand = this.createSubcommand(
                        groupEntry.metadata.meta.subcommand,
                        groupEntry.metadata.meta.description,
                        groupEntry.class,
                    );
                    groupBuilder.addSubcommand(subcommand);
                }
            }

            builder.addSubcommandGroup(groupBuilder);
        }
    }

    /**
     * Construye la estructura de un comando (real o fantasma) usando SlashCommandBuilder
     */
    private buildCommandStructure(
        commandName: string,
        commandClass: (new (...args: any[]) => any) | null,
        commandPath: string,
    ): { json: any; class: (new (...args: any[]) => any) | null; path: string; isGhost: boolean } {
        // Usar metadataHandler centralizado
        const description = commandClass
            ? metadataHandler.getCommand(commandClass)?.description || `Comandos de ${commandName}`
            : `Comandos de ${commandName}`;

        const builder = new SlashCommandBuilder().setName(commandName).setDescription(description);

        // Verificar si tiene subcomandos o grupos
        const hasSubcommands = this.commandLoader.getSubcommands(commandName).size > 0;
        const hasSubcommandGroups = this.commandLoader.getSubcommandGroups(commandName).size > 0;

        if (hasSubcommands || hasSubcommandGroups) {
            // Agregar subcomandos simples
            this.addSubcommandsToBuilder(builder, commandName);

            // Agregar grupos de subcomandos
            this.addSubcommandGroupsToBuilder(builder, commandName);
        } else if (commandClass) {
            // Si es un comando real sin subcomandos, agregar opciones directamente
            this.addOptionsToBuilder(builder, commandClass);
        }

        return {
            json: builder.toJSON(),
            class: commandClass,
            path: commandPath,
            isGhost: !commandClass,
        };
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
            // Usar metadataHandler centralizado
            const cmdMeta = metadataHandler.getCommand(commandClass);
            if (!cmdMeta) continue;

            parentNames.delete(cmdMeta.name.toLowerCase()); // Ya existe, no es fantasma

            const commandData = this.buildCommandStructure(
                cmdMeta.name,
                commandClass,
                this.commandLoader.getCommandPath(commandName) || '',
            );

            commandStructure.set(cmdMeta.name, commandData);
        }

        // Paso 3: Crear comandos "fantasma" para padres sin comando base
        for (const parentName of parentNames) {
            const commandData = this.buildCommandStructure(parentName, null, '');

            commandStructure.set(parentName, commandData);

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

            const plugins = PluginRegistry.getPluginsForCommand(commandClass, commandPath);
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

                const plugins = PluginRegistry.getPluginsForCommand(
                    commandData.class,
                    commandData.path,
                );

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
}
