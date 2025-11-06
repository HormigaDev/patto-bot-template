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

            const commandName = (args.shift() as string)?.toLowerCase();
            if (!commandName) return;

            // Parsear argumentos con soporte para strings entre comillas
            args = parseTextArguments(args.join(' '));

            // Buscar comando
            const commandEntry = commandLoader.getCommandEntry(commandName);
            if (!commandEntry) return;

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
