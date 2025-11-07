import { Events, Message } from 'discord.js';
import { CommandLoader } from '@/core/loaders/command.loader';
import { CommandHandler } from '@/core/handlers/command.handler';
import { getPrefix } from '@/core/resolvers/prefix.resolver';
import { Permissions } from '@/utils/Permissions';

const PREFIX = getPrefix();

export function registerMessageCreateEvent(
    commandLoader: CommandLoader,
    commandHandler: CommandHandler,
) {
    return {
        name: Events.MessageCreate,
        async execute(message: Message) {
            // Ignorar bots y mensajes fuera de servidores
            if (message.author.bot || !message.guild) return;
            // Verificar prefijo
            if (!message.content.startsWith(PREFIX)) return;
            const guild = message.guild;
            if (!guild.members.me?.permissions.has(Permissions.SendMessages)) return;

            // Parsear comando y argumentos
            let args: (string | number)[] = message.content
                .slice(PREFIX.length)
                .trim()
                .split(/ +/g);

            let commandName = (args.shift() as string)?.toLowerCase();
            if (!commandName) return;

            // Intentar detectar comandos con múltiples palabras (ej: "user info")
            let commandEntry = commandLoader.getCommandEntry(commandName);

            // Si no se encuentra el comando, intentar con 2 palabras
            if (!commandEntry && args.length > 0) {
                const secondWord = args[0];
                if (typeof secondWord === 'string') {
                    const twoWordCommand = `${commandName} ${secondWord.toLowerCase()}`;
                    const twoWordEntry = commandLoader.getCommandEntry(twoWordCommand);

                    if (twoWordEntry) {
                        // Encontrado comando de dos palabras, actualizar y remover segunda palabra de args
                        commandName = twoWordCommand;
                        commandEntry = twoWordEntry;
                        args.shift();
                    }
                }
            }

            // Si aún no se encuentra el comando, salir
            if (!commandEntry) return;

            // Parsear argumentos con soporte para strings entre comillas
            args = parseTextArguments(args.join(' '));

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
