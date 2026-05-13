import { RichMessage, Select, Button, ButtonVariant, ComponentRegistry } from '@/core/components';
import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { CommandCategories, Category } from '@/utils/CommandCategories';
import { Times } from '@/utils/Times';
import { ICommandOptions } from '@/core/decorators/command.decorator';
import { IArgumentOptions } from '@/core/decorators/argument.decorator';
import { ISubcommandOptions } from '@/core/decorators/subcommand.decorator';
import { ISubcommandOptions as ISubcommandGroupOptions } from '@/core/decorators/subcommand-group.decorator';
import { EmbedBuilder, ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import type { CommandEntry } from '@/core/loaders/command.loader';
import { metadataHandler } from '@/core/metadata';
import { i18n, type SupportedLocale, type TranslationKey } from '@/i18n';

/**
 * Información mínima de un comando precomputada al ejecutar /help.
 *
 * Las descripciones de comandos se muestran tal como están en sus
 * decoradores. Este comando solo traduce la UI/respuestas de ayuda.
 */
interface HelpCommandInfo {
    name: string;
    description: string;
}

/**
 * Payload del select de categorías. Lleva el locale resuelto al
 * invocar el comando, más la metadata pre-traducida. El locale viaja
 * en el payload para que los handlers re-traduzcan correctamente
 * cualquier mensaje pequeño (footers de paginación, label "vacío",
 * etc.) sin tener que hacer un nuevo lookup al store.
 */
interface HelpCategoryPayload {
    isInteraction: boolean;
    locale: SupportedLocale;
    commandsByCategory: Record<string, HelpCommandInfo[]>;
    categoryTitleByTag: Record<string, string>;
}

/**
 * Payload de los botones de paginación. Extiende el del select
 * agregando la categoría seleccionada y la página objetivo.
 */
interface HelpPaginationPayload extends HelpCategoryPayload {
    selectedTag: string;
    targetPage: number;
    totalPages: number;
}

const COMMANDS_PER_PAGE = 10;
const HELP_COMMAND_KEY = 'help-translated';
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
    const t = i18n.for(payload.locale);
    const prefix = payload.isInteraction ? '/' : '!';
    const commands = payload.commandsByCategory[selectedTag] ?? [];
    const start = page * COMMANDS_PER_PAGE;
    const pageCommands = commands.slice(start, start + COMMANDS_PER_PAGE);
    const title = payload.categoryTitleByTag[selectedTag] ?? '';

    const embed = buildInfoEmbed()
        .setTitle(title)
        .setDescription(
            pageCommands.map((cmd) => `**${prefix}${cmd.name}** - ${cmd.description}`).join('\n'),
        );

    if (totalPages > 1) {
        embed.setFooter({ text: t('help.page_of', page + 1, totalPages) });
    }

    return embed;
}

function buildPaginationButtons(payload: HelpPaginationPayload): Button[] {
    const t = i18n.for(payload.locale);

    const basePayload: HelpCategoryPayload = {
        isInteraction: payload.isInteraction,
        locale: payload.locale,
        commandsByCategory: payload.commandsByCategory,
        categoryTitleByTag: payload.categoryTitleByTag,
    };

    const prevBtn = new Button<HelpPaginationPayload>({
        label: t('help.previous_button'),
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
        label: t('help.next_button'),
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

function categoryKey(tag: Category, field: 'name' | 'description'): TranslationKey {
    return `category.${tag}.${field}` as TranslationKey;
}

@Command({
    name: HELP_COMMAND_KEY,
    description: 'Muestra la ayuda traducida de los comandos disponibles',
    aliases: ['ayuda-traducida'],
    category: Category.Info,
})
export class HelpTranslatedCommand extends BaseCommand {
    @Arg({
        name: 'comando',
        description: 'El nombre del comando para obtener ayuda',
        rawText: true,
    })
    commandName!: string;

    // Handlers estáticos. Trabajan con el payload pre-rellenado al
    // invocar el comando: `payload.locale` define el idioma de toda
    // la interacción, garantizando que los botones de paginación
    // sigan en el idioma con el que se generaron originalmente.

    public static async selectCategory(
        interaction: StringSelectMenuInteraction,
        values: string[],
        payload: HelpCategoryPayload | undefined,
    ): Promise<void> {
        if (payload === undefined) {
            // Sin payload no sabemos el locale original; resolvemos como
            // mejor esfuerzo desde la interacción.
            const { resolveLocaleFromInteraction } = await import('@/i18n');
            const t = i18n.for(await resolveLocaleFromInteraction(interaction));
            await BaseCommand.replyEphemeral(interaction, t('help.expired'));
            return;
        }

        const t = i18n.for(payload.locale);
        const owner = ComponentRegistry.getOwner(interaction.customId);
        if (!(owner instanceof RichMessage)) {
            await BaseCommand.replyEphemeral(interaction, t('help.expired'));
            return;
        }

        const selectedTag = values[0];
        const commands = payload.commandsByCategory[selectedTag] ?? [];
        const categoryTitle = payload.categoryTitleByTag[selectedTag] ?? '';

        if (commands.length === 0) {
            const embed = buildInfoEmbed()
                .setTitle(categoryTitle)
                .setDescription(t('help.category_empty'));

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
            const { resolveLocaleFromInteraction } = await import('@/i18n');
            const t = i18n.for(await resolveLocaleFromInteraction(interaction));
            await BaseCommand.replyEphemeral(interaction, t('help.expired'));
            return;
        }

        const t = i18n.for(payload.locale);
        const owner = ComponentRegistry.getOwner(interaction.customId);
        if (!(owner instanceof RichMessage)) {
            await BaseCommand.replyEphemeral(interaction, t('help.expired'));
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

    // Lógica del comando

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
     * empaquetarla en el payload del select. Así los handlers de los
     * botones no necesitan acceso al CommandLoader: pueden re-renderizar
     * páginas únicamente con los datos del payload.
     */
    private buildCategoryPayload(): HelpCategoryPayload {
        const t = this.t;
        const commandsByCategory: Record<string, HelpCommandInfo[]> = {};
        const categoryTitleByTag: Record<string, string> = {};

        for (const category of CommandCategories) {
            const icon = category.icon ? `${category.icon} ` : '';
            categoryTitleByTag[category.tag] = `${icon}${t(categoryKey(category.tag, 'name'))}`;

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
                    description: t('help.command_help.empty_description'),
                };
            });
        }

        return {
            isInteraction: this.ctx.isInteraction,
            locale: this.locale,
            commandsByCategory,
            categoryTitleByTag,
        };
    }

    private async showCategories(): Promise<void> {
        const options = CommandCategories.map((category) => ({
            label: this.t(categoryKey(category.tag, 'name')),
            description: this.t(categoryKey(category.tag, 'description')),
            value: category.tag as Category,
            emoji: category.icon,
        }));

        const payload = this.buildCategoryPayload();

        const select = new Select<HelpCategoryPayload>({
            placeholder: this.t('help.select.category_placeholder'),
            options,
            command: HELP_COMMAND_KEY,
            method: 'selectCategory',
            payload,
        });

        const embed = this.getEmbed('info')
            .setTitle(this.t('help.root.title'))
            .setDescription(this.t('help.root.description'));

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
                .setTitle(this.t('help.not_found.title'))
                .setDescription(this.t('help.not_found.description', commandName));

            await this.reply({ embeds: [embed] });
            return;
        }

        // Obtener metadata según el tipo de comando
        const entry = this.loader.getCommandEntry(normalizedName);
        if (!entry) {
            const embed = this.getEmbed('error')
                .setTitle(this.t('help.not_found.title'))
                .setDescription(this.t('help.not_found.description', commandName));
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
            .setTitle(this.t('help.command_help.title', commandTitle))
            .setDescription(commandDescription || this.t('help.command_help.empty_description'))
            .addFields({ name: this.t('help.command_help.usage_label'), value: `\`${usage}\`` });

        // Agregar información de argumentos si existen
        if (argsMeta.length > 0) {
            const argsDescription = argsMeta
                .sort((a, b) => a.index! - b.index!)
                .map((arg) => {
                    return `**${arg.name}**: ${arg.description}`;
                })
                .join('\n\n');

            embed.addFields({
                name: this.t('help.command_help.arguments_label'),
                value: argsDescription,
            });
        }

        // Agregar aliases si existen (solo para comandos base)
        if (entry.metadata.type === 'command') {
            const meta = entry.metadata.meta as ICommandOptions;
            if (meta.aliases && meta.aliases.length > 0) {
                embed.addFields({
                    name: this.t('help.command_help.aliases_label'),
                    value: meta.aliases.map((a: string) => `\`${a}\``).join(', '),
                });
            }
        }
        if (!this.ctx.isInteraction) {
            embed.setFooter({ text: this.t('help.command_help.footer_args_legend') });
        }
        await this.reply({ embeds: [embed] });
    }

    /**
     * Muestra la lista de grupos de subcomandos disponibles para un
     * comando padre.
     */
    private async showSubcommandGroupsList(
        parentName: string,
        groups: Map<string, Map<string, CommandEntry>>,
    ): Promise<void> {
        const prefix = this.ctx.isInteraction ? '/' : this.loader.prefix;

        let description = `${this.t('help.subcommand_groups.intro', parentName)}\n\n`;

        for (const [groupName, subcommands] of groups) {
            const subcommandsList = Array.from(subcommands.values())
                .map((entry) => {
                    const meta = entry.metadata.meta as ISubcommandGroupOptions;
                    return this.t(
                        'help.subcommand_groups.entry',
                        prefix,
                        parentName,
                        groupName,
                        meta.subcommand,
                        meta.description,
                    );
                })
                .join('\n');

            description += `**${groupName}**\n${subcommandsList}\n\n`;
        }

        const embed = this.getEmbed('info')
            .setTitle(this.t('help.subcommand_groups.title', parentName))
            .setDescription(description.trim())
            .setFooter({
                text: this.t('help.subcommand_groups.footer', prefix, HELP_COMMAND_KEY, parentName),
            });

        await this.reply({ embeds: [embed] });
    }

    /**
     * Muestra la lista de subcomandos disponibles para un comando padre.
     */
    private async showSubcommandsList(
        parentName: string,
        subcommands: Map<string, CommandEntry>,
    ): Promise<void> {
        const prefix = this.ctx.isInteraction ? '/' : this.loader.prefix;

        let description = `${this.t('help.subcommands.intro', parentName)}\n\n`;

        for (const [, entry] of subcommands) {
            const meta = entry.metadata.meta as ISubcommandOptions;
            description += `${this.t('help.subcommands.entry', prefix, parentName, meta.name, meta.description)}\n`;
        }

        const embed = this.getEmbed('info')
            .setTitle(this.t('help.subcommands.title', parentName))
            .setDescription(description.trim())
            .setFooter({
                text: this.t('help.subcommands.footer', prefix, HELP_COMMAND_KEY, parentName),
            });

        await this.reply({ embeds: [embed] });
    }
}
