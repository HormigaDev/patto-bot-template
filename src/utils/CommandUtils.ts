import { EmbedBuilder } from 'discord.js';

/**
 * FUNCIÓN CENTRALIZADA para crear el embed de subcomando faltante
 * Usado tanto en command.handler como en messageCreate.event
 */
export function createMissingSubcommandEmbed(
    commandName: string,
    subcommands: string[],
    prefix: string,
): EmbedBuilder {
    const subcommandList = subcommands
        .map((sub) => `• \`${prefix}${commandName} ${sub}\``)
        .join('\n');

    return new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle(`Comando \`${commandName}\``)
        .setDescription(
            `Este comando requiere un subcomando. Usa uno de los siguientes:\n\n${subcommandList}`,
        )
        .setFooter({
            text: `Usa ${prefix}help ${commandName} para más información`,
        });
}

/**
 * Valida que un nombre de comando no exceda los 3 niveles permitidos por Discord
 * @param commandName - Nombre del comando a validar
 * @param context - Contexto adicional para el mensaje de error (ej: nombre de archivo)
 * @throws Error si el comando tiene más de 3 niveles
 */
export function validateCommandLevels(commandName: string, context?: string): void {
    const nameParts = commandName.split(' ');

    if (nameParts.length > 3) {
        const contextInfo = context ? ` (${context})` : '';
        throw new Error(
            `❌ El comando "${commandName}"${contextInfo} tiene demasiados niveles (${nameParts.length}).\n` +
                `Discord solo soporta hasta 3 niveles: comando → grupo → subcomando\n` +
                `Ejemplos válidos:\n` +
                `  • 1 nivel: "ping"\n` +
                `  • 2 niveles: "user info"\n` +
                `  • 3 niveles: "server config get"`,
        );
    }
}

/**
 * Detecta el subcomando desde los argumentos de texto
 * Soporta subcomandos de 1 palabra ("get") y 2 palabras ("alpha first")
 *
 * @param textArgs - Argumentos de texto del comando
 * @param availableSubcommands - Lista de subcomandos disponibles
 * @returns Objeto con el subcomando encontrado y el número de palabras consumidas, o null si no se encontró
 *
 * @example
 * detectSubcommandFromArgs(["alpha", "first", "arg1"], ["alpha first", "beta"])
 * // returns { subcommand: "alpha first", wordsConsumed: 2 }
 *
 * detectSubcommandFromArgs(["get", "arg1"], ["get", "set"])
 * // returns { subcommand: "get", wordsConsumed: 1 }
 */
export function detectSubcommandFromArgs(
    textArgs: (string | number)[],
    availableSubcommands: string[],
): { subcommand: string; wordsConsumed: number } | null {
    if (!textArgs || textArgs.length === 0) {
        return null;
    }

    // Intentar con 2 palabras primero (grupo + subcomando)
    if (
        textArgs.length >= 2 &&
        typeof textArgs[0] === 'string' &&
        typeof textArgs[1] === 'string'
    ) {
        const twoWordSubcommand = `${textArgs[0]} ${textArgs[1]}`.toLowerCase();

        if (availableSubcommands.some((sub) => sub.toLowerCase() === twoWordSubcommand)) {
            return { subcommand: twoWordSubcommand, wordsConsumed: 2 };
        }
    }

    // Si no se encontró con 2 palabras, intentar con 1 palabra
    if (textArgs.length >= 1 && typeof textArgs[0] === 'string') {
        const oneWordSubcommand = textArgs[0].toLowerCase();

        if (availableSubcommands.some((sub) => sub.toLowerCase() === oneWordSubcommand)) {
            return { subcommand: oneWordSubcommand, wordsConsumed: 1 };
        }
    }

    return null;
}

/**
 * Convierte un nombre de subcomando a nombre de método
 * @param subcommand - Nombre del subcomando (ej: "get", "delete-all", "alpha first")
 * @returns Nombre del método (ej: "subcommandGet", "subcommandDeleteAll", "subcommandAlphaFirst")
 *
 * @example
 * getSubcommandMethodName("get") // "subcommandGet"
 * getSubcommandMethodName("delete-all") // "subcommandDeleteAll"
 * getSubcommandMethodName("alpha first") // "subcommandAlphaFirst"
 */
export function getSubcommandMethodName(subcommand: string): string {
    // Primero separar por espacios (para 3 niveles como "alpha first")
    // Luego separar cada parte por guiones (para kebab-case como "delete-all")
    // Filtrar strings vacíos que puedan resultar de delimitadores consecutivos
    const words = subcommand
        .split(' ')
        .flatMap((part) => part.split('-'))
        .filter((word) => word.length > 0)
        .map((word) => {
            // Capitalizar primera letra de cada palabra
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');

    return `subcommand${words}`;
}
