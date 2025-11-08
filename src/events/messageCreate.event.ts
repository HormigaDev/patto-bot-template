import { Events, Message } from 'discord.js';
import { CommandLoader } from '@/core/loaders/command.loader';
import { CommandHandler } from '@/core/handlers/command.handler';
import { getPrefix } from '@/core/resolvers/prefix.resolver';
import { Permissions } from '@/utils/Permissions';
import { createMissingSubcommandEmbed } from '@/utils/CommandUtils';

const PREFIX = getPrefix();

export function registerMessageCreateEvent(
    commandLoader: CommandLoader,
    commandHandler: CommandHandler,
) {
    return {
        name: Events.MessageCreate,
        async execute(message: Message) {
            if (message.author.bot || !message.guild) return;
            if (!message.content.startsWith(PREFIX)) return;
            const guild = message.guild;
            if (!guild.members.me?.permissions.has(Permissions.SendMessages)) return;

            const parts = message.content.slice(PREFIX.length).trim().split(/ +/g);
            if (parts.length === 0) return;

            // Intentar detectar comandos con múltiples palabras (máximo 3 para Discord)
            // Ejemplos: "ping", "user info", "server config get"
            let commandName: string | undefined;
            let commandEntry: ReturnType<typeof commandLoader.getCommandEntry> | undefined;
            let remainingArgs: (string | number)[] = [];

            // Intentar de más largo a más corto (3 palabras → 2 palabras → 1 palabra)
            for (let wordCount = Math.min(parts.length, 3); wordCount > 0; wordCount--) {
                const potentialCommand = parts.slice(0, wordCount).join(' ').toLowerCase();
                const entry = commandLoader.getCommandEntry(potentialCommand);

                if (entry) {
                    commandName = potentialCommand;
                    commandEntry = entry;
                    // Los argumentos son todo después del comando
                    remainingArgs = parts.slice(wordCount);
                    break;
                }
            }

            // Si no se encontró el comando, verificar si existe como prefijo de subcomandos
            if (!commandEntry || !commandName) {
                // Intentar con la primera palabra como prefijo
                if (parts.length > 0) {
                    const prefix = parts[0].toLowerCase();
                    const subcommands = commandLoader.getSubcommandsByPrefix(prefix);

                    if (subcommands.length > 0) {
                        // Hay subcomandos disponibles con este prefijo - usar función centralizada
                        // Extraer solo los subcomandos (eliminar el prefijo del nombre completo)
                        const subcommandNames = subcommands.map((fullName) => {
                            const nameParts = fullName.split(' ');
                            return nameParts.slice(1).join(' '); // Eliminar primera palabra (prefijo)
                        });

                        const embed = createMissingSubcommandEmbed(
                            prefix,
                            subcommandNames,
                            commandLoader.prefix,
                        );

                        await message.reply({ embeds: [embed] });
                        return;
                    }
                }

                // No se encontró comando ni subcomandos
                return;
            }

            // Parsear argumentos con soporte para strings entre comillas
            const args = parseTextArguments(remainingArgs.join(' '));

            // Ejecutar comando con su ruta
            await commandHandler.executeCommand(
                message,
                commandEntry.class,
                commandLoader,
                args,
                commandEntry.path,
            );
        },
    };
}

/**
 * Parsea argumentos de texto con soporte para strings entre comillas
 * y conversión automática a números
 */
function parseTextArguments(input: string): (string | number)[] {
    const parts: (string | number)[] = [];
    const regex = /("([^"]+)"|'([^']+)')|(\S+)/g;
    let match;

    while ((match = regex.exec(input)) !== null) {
        let value: string | number = match[2] ?? match[3] ?? match[4];

        // Convertir a número si es posible
        if (/^-?\d+$/.test(value)) {
            value = parseInt(value, 10);
        } else if (/^-?\d+\.\d+$/.test(value)) {
            value = parseFloat(value);
        }

        parts.push(value);
    }

    return parts;
}
