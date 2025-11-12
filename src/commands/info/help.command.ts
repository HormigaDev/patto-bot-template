import { RichMessage, Select, Button, ButtonVariant } from '@/core/components';
import { HelpDefinition } from '@/definition/help.definition';
import { CommandCategories, CommandCategoryTag } from '@/utils/CommandCategories';
import { Times } from '@/utils/Times';
import { COMMAND_METADATA_KEY, ICommandOptions } from '@/core/decorators/command.decorator';
import { ARGUMENT_METADATA_KEY, IArgumentOptions } from '@/core/decorators/argument.decorator';
import { ISubcommandOptions } from '@/core/decorators/subcommand.decorator';
import { ISubcommandOptions as ISubcommandGroupOptions } from '@/core/decorators/subcommand-group.decorator';
import { EmbedBuilder } from 'discord.js';
import type { CommandEntry } from '@/core/loaders/command.loader';

export class HelpCommand extends HelpDefinition {
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

    private async showCategories(): Promise<void> {
        const options = CommandCategories.map((category) => ({
            label: category.name,
            description: category.description,
            value: category.tag,
            emoji: category.icon,
        }));

        const select = new Select({
            placeholder: 'Selecciona una categoría',
            options,
        }).onChange(async (interaction, values) => {
            const selectedTag = values[0] as CommandCategoryTag;
            const commands = this.loader.getCommandsByCategory(selectedTag);
            const category = CommandCategories.find((cat) => cat.tag === selectedTag);
            const categoryName = `${category?.icon || '❓'} ${category?.name || 'Categoría'}`;

            // Verificar si la categoría tiene comandos
            if (commands.length === 0) {
                const embed = this.getEmbed('info')
                    .setTitle(categoryName)
                    .setDescription('*Esta categoría no tiene comandos*');

                await richMessage.edit({
                    embeds: [embed],
                    components: [],
                });
                await interaction.deferUpdate();
                return;
            }

            // Obtener metadatos de los comandos
            const commandsInfo = commands.map((cmdClass) => {
                // Intentar obtener metadata de cualquier tipo de comando
                const commandMeta = Reflect.getMetadata(
                    COMMAND_METADATA_KEY,
                    cmdClass,
                ) as ICommandOptions;

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
                    // Construir el nombre completo basado en el tipo
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

            const commandsPerPage = 10;
            const totalPages = Math.ceil(commandsInfo.length / commandsPerPage);

            // Si solo hay una página, mostrar mensaje fijo
            if (totalPages === 1) {
                const prefix = this.ctx.isInteraction ? '/' : '!';
                const embed = this.getEmbed('info')
                    .setTitle(categoryName)
                    .setDescription(
                        commandsInfo
                            .map((cmd) => `**${prefix}${cmd.name}** - ${cmd.description}`)
                            .join('\n'),
                    );

                await richMessage.edit({
                    embeds: [embed],
                    components: [],
                });
                await interaction.deferUpdate();
                return;
            }

            // Si hay múltiples páginas, crear RichMessage con paginación
            let currentPage = 0;

            const createPageEmbed = (page: number): EmbedBuilder => {
                const prefix = this.ctx.isInteraction ? '/' : '!';
                const start = page * commandsPerPage;
                const end = start + commandsPerPage;
                const pageCommands = commandsInfo.slice(start, end);

                return this.getEmbed('info')
                    .setTitle(categoryName)
                    .setDescription(
                        pageCommands
                            .map((cmd) => `**${prefix}${cmd.name}** - ${cmd.description}`)
                            .join('\n'),
                    )
                    .setFooter({ text: `Página ${page + 1} de ${totalPages}` });
            };

            const renderPage = async (page: number) => {
                currentPage = page;

                const prevBtn = new Button({
                    label: 'Anterior',
                    variant: ButtonVariant.Secondary,
                    emoji: '⬅️',
                    disabled: currentPage === 0,
                }).onClick(async (btnInteraction) => {
                    await renderPage(currentPage - 1);
                    await btnInteraction.deferUpdate();
                });

                const nextBtn = new Button({
                    label: 'Siguiente',
                    variant: ButtonVariant.Secondary,
                    emoji: '➡️',
                    disabled: currentPage === totalPages - 1,
                }).onClick(async (btnInteraction) => {
                    await renderPage(currentPage + 1);
                    await btnInteraction.deferUpdate();
                });

                await richMessage.edit({
                    embeds: [createPageEmbed(currentPage)],
                    components: [prevBtn, nextBtn],
                    timeout: Times.seconds(10),
                });
            };

            // Renderizar primera página
            await renderPage(0);
            await interaction.deferUpdate();
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

        const argsMeta: IArgumentOptions[] =
            Reflect.getMetadata(ARGUMENT_METADATA_KEY, commandClass) || [];

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
