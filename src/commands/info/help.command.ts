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

interface HelpCommandInfo {
    name: string;
    description: string;
}

interface HelpCategoryPayload {
    isInteraction: boolean;
    prefix: string;
    commandsByCategory: Record<string, HelpCommandInfo[]>;
    categoryTitleByTag: Record<string, string>;
}

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
    const prefix = payload.prefix;
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
        prefix: payload.prefix,
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

    async run(): Promise<void> {
        const commandName = this.commandName?.toLowerCase();

        if (!commandName) {
            await this.showCategories();
        } else {
            await this.showCommandHelp(commandName);
        }
    }

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
            prefix: this.ctx.isInteraction ? '/' : this.loader.prefix,
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
        const normalizedName = commandName.toLowerCase().replace(/\s+/g, '-');
        const commandClass = this.loader.getCommand(normalizedName);

        if (!commandClass) {
            const parts = normalizedName.split('-');
            const parentName = parts[0];

            const groups = this.loader.getSubcommandGroups(parentName);
            if (groups.size > 0) {
                await this.showSubcommandGroupsList(parentName, groups);
                return;
            }

            const subcommands = this.loader.getSubcommands(parentName);
            if (subcommands.size > 0) {
                await this.showSubcommandsList(parentName, subcommands);
                return;
            }

            const embed = this.getEmbed('error')
                .setTitle('Comando no encontrado')
                .setDescription(`No se encontró el comando \`${commandName}\`.`);

            await this.reply({ embeds: [embed] });
            return;
        }

        const entry = this.loader.getCommandEntry(normalizedName);
        if (!entry) {
            const embed = this.getEmbed('error')
                .setTitle('Comando no encontrado')
                .setDescription(`No se encontró el comando \`${commandName}\`.`);
            await this.reply({ embeds: [embed] });
            return;
        }

        const argsMeta: IArgumentOptions[] = metadataHandler.getArguments(commandClass);

        let commandTitle = '';
        let commandDescription = '';
        let usage = '';

        if (entry.metadata.type === 'command') {
            const meta = entry.metadata.meta as ICommandOptions;
            commandTitle = meta.name;
            commandDescription = meta.description;
            usage = this.ctx.isInteraction ? `/${meta.name}` : `${this.loader.prefix}${meta.name}`;
        } else if (entry.metadata.type === 'subcommand') {
            const meta = entry.metadata.meta as ISubcommandOptions;
            commandTitle = `${meta.parent} ${meta.name}`;
            commandDescription = meta.description;
            usage = this.ctx.isInteraction
                ? `/${meta.parent} ${meta.name}`
                : `${this.loader.prefix}${meta.parent} ${meta.name}`;
        } else if (entry.metadata.type === 'subcommand-group') {
            const meta = entry.metadata.meta as ISubcommandGroupOptions;
            commandTitle = `${meta.parent} ${meta.name} ${meta.subcommand}`;
            commandDescription = meta.description;
            usage = this.ctx.isInteraction
                ? `/${meta.parent} ${meta.name} ${meta.subcommand}`
                : `${this.loader.prefix}${meta.parent} ${meta.name} ${meta.subcommand}`;
        }

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

        if (argsMeta.length > 0) {
            const argsDescription = argsMeta
                .sort((a, b) => a.index! - b.index!)
                .map((arg) => `**${arg.name}**: ${arg.description}`)
                .join('\n\n');

            embed.addFields({ name: 'Argumentos', value: argsDescription });
        }

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
