import { Client, REST, Routes, ApplicationCommandOptionType } from 'discord.js';
import { CommandLoader } from './command.loader';
import { COMMAND_METADATA_KEY, ICommandOptions } from '@/core/decorators/command.decorator';
import { ARGUMENT_METADATA_KEY, IArgumentOptions } from '@/core/decorators/argument.decorator';

export class SlashCommandLoader {
    constructor(private client: Client, private commandLoader: CommandLoader) {}

    /**
     * Registra todos los slash commands en Discord
     */
    async registerSlashCommands(): Promise<void> {
        console.log('🔄 Registrando comandos Slash...');

        const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);
        const slashCommandsJSON: any[] = [];

        for (const commandClass of this.commandLoader.getAllCommands().values()) {
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

            slashCommandsJSON.push({
                name: cmdMeta.name,
                description: cmdMeta.description,
                options,
            });
        }

        try {
            await rest.put(Routes.applicationCommands(this.client.user!.id), {
                body: slashCommandsJSON,
            });

            console.log('✅ Comandos Slash registrados.');
        } catch (error) {
            console.error('❌ Error al registrar comandos Slash:', error);
        }
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
