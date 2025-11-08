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
