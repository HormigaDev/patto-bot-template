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

        // Estructura para organizar comandos multi-nivel
        // Nivel 1: comando (ej: "server")
        // Nivel 2: grupo de subcomandos (ej: "server config")
        // Nivel 3: subcomando (ej: "server config get")
        interface CommandStructure {
            name: string;
            description: string;
            groups: Map<
                string,
                {
                    description: string;
                    subcommands: Array<{ name: string; commandName: string }>;
                }
            >;
            directSubcommands: Array<{ name: string; commandName: string }>;
        }

        const commandStructures = new Map<string, CommandStructure>();

        // Analizar todos los comandos y organizarlos por niveles
        for (const [commandName] of this.commandLoader.getAllCommands()) {
            const nameParts = commandName.split(' ');

            if (nameParts.length === 2) {
                // Nivel 2: "user info" o "server config"
                const parentName = nameParts[0];
                const subName = nameParts[1];

                if (!commandStructures.has(parentName)) {
                    // Obtener descripción del primer subcomando para usarla en el comando padre
                    const cmdClass = this.commandLoader.getCommand(commandName);
                    const cmdMeta: ICommandOptions = Reflect.getMetadata(
                        COMMAND_METADATA_KEY,
                        cmdClass!,
                    );

                    commandStructures.set(parentName, {
                        name: parentName,
                        description: cmdMeta.description || `Comandos de ${parentName}`,
                        groups: new Map(),
                        directSubcommands: [],
                    });
                }

                commandStructures.get(parentName)!.directSubcommands.push({
                    name: subName,
                    commandName,
                });
            } else if (nameParts.length === 3) {
                // Nivel 3: "server config get"
                const parentName = nameParts[0]; // "server"
                const groupName = nameParts[1]; // "config"
                const subName = nameParts[2]; // "get"

                if (!commandStructures.has(parentName)) {
                    commandStructures.set(parentName, {
                        name: parentName,
                        description: `Comandos de ${parentName}`,
                        groups: new Map(),
                        directSubcommands: [],
                    });
                }

                const structure = commandStructures.get(parentName)!;

                if (!structure.groups.has(groupName)) {
                    // Obtener descripción del primer subcomando del grupo
                    const cmdClass = this.commandLoader.getCommand(commandName);
                    const cmdMeta: ICommandOptions = Reflect.getMetadata(
                        COMMAND_METADATA_KEY,
                        cmdClass!,
                    );

                    structure.groups.set(groupName, {
                        description: cmdMeta.description || `Comandos de ${groupName}`,
                        subcommands: [],
                    });
                }

                structure.groups.get(groupName)!.subcommands.push({
                    name: subName,
                    commandName,
                });
            } else if (nameParts.length > 3) {
                // Discord no soporta más de 3 niveles
                throw new Error(
                    `❌ El comando "${commandName}" tiene demasiados niveles (${nameParts.length}).\n` +
                        `Discord solo soporta hasta 3 niveles: comando → grupo → subcomando\n` +
                        `Ejemplos válidos:\n` +
                        `  • 1 nivel: "ping"\n` +
                        `  • 2 niveles: "user info"\n` +
                        `  • 3 niveles: "server config get"\n` +
                        `\nEjemplo inválido: "${commandName}" (${nameParts.length} niveles)`,
                );
            }
        }

        // Procesar comandos standalone y con subcommands explícitos
        for (const [commandName, commandClass] of this.commandLoader.getAllCommands()) {
            const cmdMeta: ICommandOptions = Reflect.getMetadata(
                COMMAND_METADATA_KEY,
                commandClass,
            );
            const argsMeta: IArgumentOptions[] =
                Reflect.getMetadata(ARGUMENT_METADATA_KEY, commandClass) || [];

            // Detectar si es un subcomando (nombre con espacio)
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

                // Si es parte de una estructura auto-detectada, saltarlo (se procesa después)
                if (commandStructures.has(parentName)) {
                    const structure = commandStructures.get(parentName)!;
                    const isFirstInStructure =
                        structure.directSubcommands[0]?.commandName === commandName ||
                        Array.from(structure.groups.values())[0]?.subcommands[0]?.commandName ===
                            commandName;

                    if (!isFirstInStructure) {
                        continue;
                    }

                    // Crear comando agrupador para esta estructura
                    const commandJson = this.buildCommandFromStructure(structure);

                    // Ejecutar plugins
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
                // Organizar por grupos si hay espacios en los nombres
                const groups = new Map<string, Array<{ name: string; fullName: string }>>();
                const directSubcommands: Array<{ name: string; fullName: string }> = [];

                for (const subName of cmdMeta.subcommands!) {
                    const parts = subName.split(' ');

                    if (parts.length > 2) {
                        throw new Error(
                            `Subcomando "${subName}" en comando "${cmdMeta.name}" tiene más de 2 palabras. Máximo permitido: "grupo subcomando"`,
                        );
                    }

                    if (parts.length === 2) {
                        // "alpha first" → grupo: "alpha", subcomando: "first"
                        const [groupName, subcommandName] = parts;

                        if (!groups.has(groupName)) {
                            groups.set(groupName, []);
                        }

                        groups.get(groupName)!.push({
                            name: subcommandName,
                            fullName: subName,
                        });
                    } else {
                        // "get" → subcomando directo sin grupo
                        directSubcommands.push({
                            name: subName,
                            fullName: subName,
                        });
                    }
                }

                const subcommandOptions: any[] = [];

                // Procesar grupos
                for (const [groupName, subs] of groups) {
                    const groupSubcommands = subs.map((sub) => {
                        // Buscar la clase del subcomando (puede estar en archivo separado)
                        const subCommandName = `${cmdMeta.name} ${sub.fullName}`;
                        const subCommandClass = this.commandLoader.getCommand(subCommandName);

                        let subArgs: IArgumentOptions[] = [];
                        let subDescription = `Subcomando ${sub.name}`;

                        if (subCommandClass) {
                            // Subcomando en archivo separado
                            const subMeta: ICommandOptions = Reflect.getMetadata(
                                COMMAND_METADATA_KEY,
                                subCommandClass,
                            );
                            subDescription = subMeta.description;
                            subArgs =
                                Reflect.getMetadata(ARGUMENT_METADATA_KEY, subCommandClass) || [];
                        } else {
                            // Subcomando en mismo archivo, usar argumentos del comando padre
                            subArgs = argsMeta.filter((arg) => {
                                if (!arg.subcommands || arg.subcommands.length === 0) {
                                    return true;
                                }
                                return arg.subcommands.includes(sub.fullName);
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
                            name: sub.name,
                            description: subDescription,
                            type: ApplicationCommandOptionType.Subcommand,
                            options,
                        };
                    });

                    subcommandOptions.push({
                        name: groupName,
                        description: `Grupo ${groupName}`,
                        type: ApplicationCommandOptionType.SubcommandGroup,
                        options: groupSubcommands,
                    });
                }

                // Procesar subcomandos directos (sin grupo)
                for (const sub of directSubcommands) {
                    const subCommandName = `${cmdMeta.name} ${sub.fullName}`;
                    const subCommandClass = this.commandLoader.getCommand(subCommandName);

                    let subArgs: IArgumentOptions[] = [];
                    let subDescription = `Subcomando ${sub.name}`;

                    if (subCommandClass) {
                        const subMeta: ICommandOptions = Reflect.getMetadata(
                            COMMAND_METADATA_KEY,
                            subCommandClass,
                        );
                        subDescription = subMeta.description;
                        subArgs = Reflect.getMetadata(ARGUMENT_METADATA_KEY, subCommandClass) || [];
                    } else {
                        subArgs = argsMeta.filter((arg) => {
                            if (!arg.subcommands || arg.subcommands.length === 0) {
                                return true;
                            }
                            return arg.subcommands.includes(sub.fullName);
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

                    subcommandOptions.push({
                        name: sub.name,
                        description: subDescription,
                        type: ApplicationCommandOptionType.Subcommand,
                        options,
                    });
                }

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
     * Construye el JSON de comando de Discord a partir de una estructura auto-detectada
     */
    private buildCommandFromStructure(structure: {
        name: string;
        description: string;
        groups: Map<
            string,
            {
                description: string;
                subcommands: Array<{ name: string; commandName: string }>;
            }
        >;
        directSubcommands: Array<{ name: string; commandName: string }>;
    }): any {
        const options: any[] = [];

        // Agregar subcommand groups (nivel 3: command → group → subcommand)
        for (const [groupName, groupData] of structure.groups) {
            const subcommands = groupData.subcommands.map((sub) => {
                const subCommandClass = this.commandLoader.getCommand(sub.commandName)!;
                const subMeta: ICommandOptions = Reflect.getMetadata(
                    COMMAND_METADATA_KEY,
                    subCommandClass,
                );
                const subArgs: IArgumentOptions[] =
                    Reflect.getMetadata(ARGUMENT_METADATA_KEY, subCommandClass) || [];

                const subOptions = subArgs.map((arg) => {
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
                    name: sub.name,
                    description: subMeta.description,
                    type: ApplicationCommandOptionType.Subcommand,
                    options: subOptions,
                };
            });

            options.push({
                name: groupName,
                description: groupData.description,
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: subcommands,
            });
        }

        // Agregar subcomandos directos (nivel 2: command → subcommand)
        for (const sub of structure.directSubcommands) {
            const subCommandClass = this.commandLoader.getCommand(sub.commandName)!;
            const subMeta: ICommandOptions = Reflect.getMetadata(
                COMMAND_METADATA_KEY,
                subCommandClass,
            );
            const subArgs: IArgumentOptions[] =
                Reflect.getMetadata(ARGUMENT_METADATA_KEY, subCommandClass) || [];

            const subOptions = subArgs.map((arg) => {
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

            options.push({
                name: sub.name,
                description: subMeta.description,
                type: ApplicationCommandOptionType.Subcommand,
                options: subOptions,
            });
        }

        return {
            name: structure.name,
            description: structure.description,
            options,
        };
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
