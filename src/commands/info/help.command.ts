import { RichMessage, Select, Button, ButtonVariant, ComponentRegistry } from '@/core/components';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { HelpDefinition } from '@/definitions/help.definition';
import { CommandCategories, Category } from '@/utils/CommandCategories';
import { Times } from '@/utils/Times';
import { ICommandOptions } from '@/core/decorators/command.decorator';
import { IArgumentOptions } from '@/core/decorators/argument.decorator';
import { ISubcommandOptions } from '@/core/decorators/subcommand.decorator';
import { ISubcommandOptions as ISubcommandGroupOptions } from '@/core/decorators/subcommand-group.decorator';
import { EmbedBuilder, ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import type { CommandEntry } from '@/core/loaders/command.loader';
import { metadataHandler } from '@/core/metadata';

/**
 * Información mínima de un comando precomputada al ejecutar /help
 */
interface HelpCommandInfo {
    name: string;
    description: string;
}

/**
 * Payload del select de categorías. Contiene todo lo necesario para
 * re-renderizar el mensaje sin acceder al CommandLoader desde el handler
 * (los datos se precomputan en el momento en que se ejecuta el comando).
 */
interface HelpCategoryPayload {
    isInteraction: boolean;
    commandsByCategory: Record<string, HelpCommandInfo[]>;
    categoryTitleByTag: Record<string, string>;
}

/**
 * Payload de los botones de paginación. Extiende el del select agregando
 * la categoría seleccionada y la página objetivo.
 */
interface HelpPaginationPayload extends HelpCategoryPayload {
    selectedTag: string;
    targetPage: number;
    totalPages: number;
}

const COMMANDS_PER_PAGE = 10;
const HELP_COMMAND_KEY = 'help';
const INFO_EMBED_COLOR = '#5180d6';

function buildInfoEmbed(): EmbedBuilder {
    return new EmbedBuilder().setColor(INFO_EMBED_COLOR).setTimestamp();
}

function buildCategoryListPage(
    payload: HelpCategoryPayload,
    selectedTag: string,
    page: number,
    totalPages: number,
): EmbedBuilder {
    const prefix = payload.isInteraction ? '/' : '!';
    const commands = payload.commandsByCategory[selectedTag] ?? [];
    const start = page * COMMANDS_PER_PAGE;
    const pageCommands = commands.slice(start, start + COMMANDS_PER_PAGE);
    const title = payload.categoryTitleByTag[selectedTag] ?? 'Categoría';

    const embed = buildInfoEmbed()
        .setTitle(title)
        .setDescription(
            pageCommands.map((cmd) => `**${prefix}${cmd.name}** - ${cmd.description}`).join('\n'),
        );

    if (totalPages > 1) {
        embed.setFooter({ text: `Página ${page + 1} de ${totalPages}` });
    }

    return embed;
}

function buildPaginationButtons(payload: HelpPaginationPayload): Button[] {
    const basePayload: HelpCategoryPayload = {
        isInteraction: payload.isInteraction,
        commandsByCategory: payload.commandsByCategory,
        categoryTitleByTag: payload.categoryTitleByTag,
    };

    const prevBtn = new Button<HelpPaginationPayload>({
        label: 'Anterior',
        variant: ButtonVariant.Secondary,
        emoji: '⬅️',
        disabled: payload.targetPage === 0,
        command: HELP_COMMAND_KEY,
        method: 'buttonPage',
        payload: {
            ...basePayload,
            selectedTag: payload.selectedTag,
            totalPages: payload.totalPages,
            targetPage: payload.targetPage - 1,
        },
    });

    const nextBtn = new Button<HelpPaginationPayload>({
        label: 'Siguiente',
        variant: ButtonVariant.Secondary,
        emoji: '➡️',
        disabled: payload.targetPage === payload.totalPages - 1,
        command: HELP_COMMAND_KEY,
        method: 'buttonPage',
        payload: {
            ...basePayload,
            selectedTag: payload.selectedTag,
            totalPages: payload.totalPages,
            targetPage: payload.targetPage + 1,
        },
    });

    return [prevBtn, nextBtn];
}

export class HelpCommand extends HelpDefinition {
    // ──────────────────────────────────────────────────────────────────
    // Handlers estáticos. Viven en la clase del comando, son resueltos
    // por el dispatcher vía CommandLoader + lookup directo. No se
    // registran en runtime y no capturan estado.
    // ──────────────────────────────────────────────────────────────────

    public static async selectCategory(
        interaction: StringSelectMenuInteraction,
        values: string[],
        payload: HelpCategoryPayload | undefined,
    ): Promise<void> {
        if (payload === undefined) {
            await BaseCommand.replyEphemeral(interaction, 'Esta interacción ha expirado.');
            return;
        }

        const owner = ComponentRegistry.getOwner(interaction.customId);
        if (!(owner instanceof RichMessage)) {
            await BaseCommand.replyEphemeral(interaction, 'Esta interacción ha expirado.');
            return;
        }

        const selectedTag = values[0];
        const commands = payload.commandsByCategory[selectedTag] ?? [];
        const categoryTitle = payload.categoryTitleByTag[selectedTag] ?? 'Categoría';

        if (commands.length === 0) {
            const embed = buildInfoEmbed()
                .setTitle(categoryTitle)
                .setDescription('*Esta categoría no tiene comandos*');

            await owner.edit({ embeds: [embed], components: [] });
            await interaction.deferUpdate();
            return;
        }

        const totalPages = Math.ceil(commands.length / COMMANDS_PER_PAGE);

        if (totalPages === 1) {
            const embed = buildCategoryListPage(payload, selectedTag, 0, totalPages);
            await owner.edit({ embeds: [embed], components: [] });
            await interaction.deferUpdate();
            return;
        }

        const paginationPayload: HelpPaginationPayload = {
            ...payload,
            selectedTag,
            targetPage: 0,
            totalPages,
        };

        const embed = buildCategoryListPage(payload, selectedTag, 0, totalPages);
        await owner.edit({
            embeds: [embed],
            components: buildPaginationButtons(paginationPayload),
            timeout: Times.seconds(10),
        });
        await interaction.deferUpdate();
    }

    public static async buttonPage(
        interaction: ButtonInteraction,
        payload: HelpPaginationPayload | undefined,
    ): Promise<void> {
        if (payload === undefined) {
            await BaseCommand.replyEphemeral(interaction, 'Esta interacción ha expirado.');
            return;
        }

        const owner = ComponentRegistry.getOwner(interaction.customId);
        if (!(owner instanceof RichMessage)) {
            await BaseCommand.replyEphemeral(interaction, 'Esta interacción ha expirado.');
            return;
        }

        const embed = buildCategoryListPage(
            payload,
            payload.selectedTag,
            payload.targetPage,
            payload.totalPages,
        );

        await owner.edit({
            embeds: [embed],
            components: buildPaginationButtons(payload),
            timeout: Times.seconds(10),
        });
        await interaction.deferUpdate();
    }

    // ──────────────────────────────────────────────────────────────────
    // Lógica del comando
    // ──────────────────────────────────────────────────────────────────

    async run(): Promise<void> {
        const commandName = this.commandName?.toLowerCase();

        if (!commandName) {
            // Mostrar lista de categorías de comandos
            await this.showCategories();
        } else {
            // Mostrar ayuda de un comando específico
            await this.showCommandHelp(commandName);
        }
    }

    /**
     * Precomputa la metadata de los comandos de cada categoría para
     * empaquetarla en el payload del select. Así los handlers estáticos
     * no necesitan acceso al CommandLoader.
     */
    private buildCategoryPayload(): HelpCategoryPayload {
        const commandsByCategory: Record<string, HelpCommandInfo[]> = {};
        const categoryTitleByTag: Record<string, string> = {};

        for (const category of CommandCategories) {
            categoryTitleByTag[category.tag] = `${category.icon} ${category.name}`;

            const commands = this.loader.getCommandsByCategory(category.tag);
            commandsByCategory[category.tag] = commands.map((cmdClass) => {
                const commandMeta = metadataHandler.getCommand(cmdClass);

                if (commandMeta) {
                    return {
                        name: commandMeta.name,
                        description: commandMeta.description,
                    };
                }

                // Si no es comando base, buscar en los entries
                const entry = Array.from(this.loader.getAllCommandEntries().values()).find(
                    (e) => e.class === cmdClass,
                );

                if (entry) {
                    const meta = entry.metadata.meta as any;
                    let fullName = '';
                    if (entry.metadata.type === 'subcommand') {
                        fullName = `${meta.parent} ${meta.name}`;
                    } else if (entry.metadata.type === 'subcommand-group') {
                        fullName = `${meta.parent} ${meta.name} ${meta.subcommand}`;
                    }

                    return {
                        name: fullName,
                        description: meta.description,
                    };
                }

                return {
                    name: 'unknown',
                    description: 'Sin descripción',
                };
            });
        }

        return {
            isInteraction: this.ctx.isInteraction,
            commandsByCategory,
            categoryTitleByTag,
        };
    }

    private async showCategories(): Promise<void> {
        const options = CommandCategories.map((category) => ({
            label: category.name,
            description: category.description,
            value: category.tag as Category,
            emoji: category.icon,
        }));

        const payload = this.buildCategoryPayload();

        const select = new Select<HelpCategoryPayload>({
            placeholder: 'Selecciona una categoría',
            options,
            command: HELP_COMMAND_KEY,
            method: 'selectCategory',
            payload,
        });

        const embed = this.getEmbed('info')
            .setTitle('Ayuda de Comandos')
            .setDescription('Selecciona una categoría del menú desplegable para ver sus comandos.');

        const richMessage = new RichMessage({
            embeds: [embed],
            components: [select],
            timeout: Times.minutes(2),
        });

        await richMessage.send(this.ctx);
    }

    private async showCommandHelp(commandName: string): Promise<void> {
        // Normalizar el nombre: convertir espacios a guiones y lowercase
        const normalizedName = commandName.toLowerCase().replace(/\s+/g, '-');

        // Intentar obtener el comando directamente por key kebab-case
        const commandClass = this.loader.getCommand(normalizedName);

        if (!commandClass) {
            // Si no se encuentra, verificar si es un comando padre con subcomandos o grupos
            const parts = normalizedName.split('-');
            const parentName = parts[0];

            // Verificar si tiene grupos de subcomandos
            const groups = this.loader.getSubcommandGroups(parentName);
            if (groups.size > 0) {
                await this.showSubcommandGroupsList(parentName, groups);
                return;
            }

            // Verificar si tiene subcomandos simples
            const subcommands = this.loader.getSubcommands(parentName);
            if (subcommands.size > 0) {
                await this.showSubcommandsList(parentName, subcommands);
                return;
            }

            // No existe ni como comando, ni como grupo, ni como subcomando
            const embed = this.getEmbed('error')
                .setTitle('Comando no encontrado')
                .setDescription(`No se encontró el comando \`${commandName}\`.`);

            await this.reply({ embeds: [embed] });
            return;
        }

        // Obtener metadata según el tipo de comando
        const entry = this.loader.getCommandEntry(normalizedName);
        if (!entry) {
            const embed = this.getEmbed('error')
                .setTitle('Comando no encontrado')
                .setDescription(`No se encontró el comando \`${commandName}\`.`);
            await this.reply({ embeds: [embed] });
            return;
        }

        // Usar metadataHandler centralizado para obtener argumentos
        const argsMeta: IArgumentOptions[] = metadataHandler.getArguments(commandClass);

        // Construir información del comando según su tipo
        let commandTitle = '';
        let commandDescription = '';
        let usage = '';

        if (entry.metadata.type === 'command') {
            const meta = entry.metadata.meta as ICommandOptions;
            commandTitle = meta.name;
            commandDescription = meta.description;

            if (this.ctx.isInteraction) {
                usage = `/${meta.name}`;
            } else {
                usage = `${this.loader.prefix}${meta.name}`;
            }
        } else if (entry.metadata.type === 'subcommand') {
            const meta = entry.metadata.meta as ISubcommandOptions;
            commandTitle = `${meta.parent} ${meta.name}`;
            commandDescription = meta.description;

            if (this.ctx.isInteraction) {
                usage = `/${meta.parent} ${meta.name}`;
            } else {
                usage = `${this.loader.prefix}${meta.parent} ${meta.name}`;
            }
        } else if (entry.metadata.type === 'subcommand-group') {
            const meta = entry.metadata.meta as ISubcommandGroupOptions;
            commandTitle = `${meta.parent} ${meta.name} ${meta.subcommand}`;
            commandDescription = meta.description;

            if (this.ctx.isInteraction) {
                usage = `/${meta.parent} ${meta.name} ${meta.subcommand}`;
            } else {
                usage = `${this.loader.prefix}${meta.parent} ${meta.name} ${meta.subcommand}`;
            }
        }

        // Agregar argumentos al uso si existen
        if (!this.ctx.isInteraction && argsMeta.length > 0) {
            const argsText = argsMeta
                .sort((a, b) => a.index! - b.index!)
                .map((arg) => {
                    const bracket = arg.required ? '<>' : '[]';
                    return bracket[0] + arg.name + bracket[1];
                })
                .join(' ');
            usage += ` ${argsText}`;
        }

        const embed = this.getEmbed('info')
            .setTitle(`Ayuda: ${commandTitle}`)
            .setDescription(commandDescription || '*Sin descripción*')
            .addFields({ name: 'Uso', value: `\`${usage}\`` });

        // Agregar información de argumentos si existen
        if (argsMeta.length > 0) {
            const argsDescription = argsMeta
                .sort((a, b) => a.index! - b.index!)
                .map((arg) => {
                    return `**${arg.name}**: ${arg.description}`;
                })
                .join('\n\n');

            embed.addFields({ name: 'Argumentos', value: argsDescription });
        }

        // Agregar aliases si existen (solo para comandos base)
        if (entry.metadata.type === 'command') {
            const meta = entry.metadata.meta as ICommandOptions;
            if (meta.aliases && meta.aliases.length > 0) {
                embed.addFields({
                    name: 'Alias',
                    value: meta.aliases.map((a: string) => `\`${a}\``).join(', '),
                });
            }
        }
        if (!this.ctx.isInteraction) {
            embed.setFooter({ text: `<> = obligatorio, [] = opcional` });
        }
        await this.reply({ embeds: [embed] });
    }

    /**
     * Muestra la lista de grupos de subcomandos disponibles para un comando padre
     */
    private async showSubcommandGroupsList(
        parentName: string,
        groups: Map<string, Map<string, CommandEntry>>,
    ): Promise<void> {
        const prefix = this.ctx.isInteraction ? '/' : this.loader.prefix;

        let description = `El comando \`${parentName}\` tiene los siguientes grupos de subcomandos:\n\n`;

        for (const [groupName, subcommands] of groups) {
            const subcommandsList = Array.from(subcommands.values())
                .map((entry) => {
                    const meta = entry.metadata.meta as ISubcommandGroupOptions;
                    return `  • \`${prefix}${parentName} ${groupName} ${meta.subcommand}\` - ${meta.description}`;
                })
                .join('\n');

            description += `**${groupName}**\n${subcommandsList}\n\n`;
        }

        const embed = this.getEmbed('info')
            .setTitle(`📚 Ayuda: ${parentName}`)
            .setDescription(description.trim())
            .setFooter({
                text: `Usa ${prefix}help ${parentName} <grupo> <subcomando> para más información`,
            });

        await this.reply({ embeds: [embed] });
    }

    /**
     * Muestra la lista de subcomandos disponibles para un comando padre
     */
    private async showSubcommandsList(
        parentName: string,
        subcommands: Map<string, CommandEntry>,
    ): Promise<void> {
        const prefix = this.ctx.isInteraction ? '/' : this.loader.prefix;

        let description = `El comando \`${parentName}\` tiene los siguientes subcomandos:\n\n`;

        for (const [, entry] of subcommands) {
            const meta = entry.metadata.meta as ISubcommandOptions;
            description += `• \`${prefix}${parentName} ${meta.name}\` - ${meta.description}\n`;
        }

        const embed = this.getEmbed('info')
            .setTitle(`📚 Ayuda: ${parentName}`)
            .setDescription(description.trim())
            .setFooter({
                text: `Usa ${prefix}help ${parentName} <subcomando> para más información`,
            });

        await this.reply({ embeds: [embed] });
    }
}
