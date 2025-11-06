import { Client, REST, Routes, ApplicationCommandOptionType } from 'discord.js';
import { CommandLoader } from './command.loader';
import { COMMAND_METADATA_KEY, ICommandOptions } from '@/core/decorators/command.decorator';
import { ARGUMENT_METADATA_KEY, IArgumentOptions } from '@/core/decorators/argument.decorator';
import { PLUGIN_METADATA_KEY } from '@/core/decorators/plugin.decorator';
import { PluginRegistry } from '@/config/plugin.registry';
import { BasePlugin } from '@/core/structures/BasePlugin';
import { Env } from '@/utils/Env';

export class SlashCommandLoader {
    constructor(private client: Client, private commandLoader: CommandLoader) {}

    /**
     * Registra todos los slash commands en Discord
     */
    async registerSlashCommands(): Promise<void> {
        const config = Env.get();
        console.log('🔄 Registrando comandos Slash...');

        const rest = new REST({ version: '10' }).setToken(config.BOT_TOKEN);
        const slashCommandsJSON: any[] = [];

        for (const [commandName, commandClass] of this.commandLoader.getAllCommands()) {
            const cmdMeta: ICommandOptions = Reflect.getMetadata(
                COMMAND_METADATA_KEY,
                commandClass,
            );
            const argsMeta: IArgumentOptions[] =
                Reflect.getMetadata(ARGUMENT_METADATA_KEY, commandClass) || [];

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

            let commandJson = {
                name: cmdMeta.name,
                description: cmdMeta.description,
                options,
            };

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
