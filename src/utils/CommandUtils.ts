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
    const words = subcommand
        .split(' ')
        .flatMap((part) => part.split('-'))
        .map((word) => {
            // Capitalizar primera letra de cada palabra
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');

    return `subcommand${words}`;
}
