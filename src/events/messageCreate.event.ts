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

            // Intentar ejecutar grupo de subcomandos (3 niveles)
            if (await tryExecuteSubcommand(args, 3, commandLoader, commandHandler, message)) return;

            // Intentar ejecutar subcomando (2 niveles)
            if (await tryExecuteSubcommand(args, 2, commandLoader, commandHandler, message)) return;

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
 * Intenta ejecutar un subcomando o grupo de subcomandos
 * @param args Array de argumentos del mensaje
 * @param levels Número de niveles a procesar (2 para subcomandos, 3 para grupos)
 * @param commandLoader Loader de comandos
 * @param commandHandler Handler de comandos
 * @param message Mensaje original
 * @returns true si se encontró y ejecutó el comando, false en caso contrario
 */
async function tryExecuteSubcommand(
    args: (string | number)[],
    levels: number,
    commandLoader: CommandLoader,
    commandHandler: CommandHandler,
    message: Message,
): Promise<boolean> {
    const key = args
        .slice(0, levels)
        .map((arg) => String(arg).toLowerCase())
        .join('-');
    const entry = commandLoader.getCommandEntry(key);

    if (entry) {
        const newArgs = parseTextArguments(args.slice(levels).join(' '));
        await commandHandler.executeCommand(
            message,
            entry.class,
            commandLoader,
            newArgs,
            entry.path,
        );
        return true;
    }
    return false;
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
