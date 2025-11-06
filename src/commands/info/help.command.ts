import { RichMessage, Select, Button, ButtonVariant } from '@/core/components';
import { HelpDefinition } from '@/definition/help.definition';
import { CommandCategories, CommandCategoryTag } from '@/utils/CommandCategories';
import { Times } from '@/utils/Times';
import { COMMAND_METADATA_KEY, ICommandOptions } from '@/core/decorators/command.decorator';
import { ARGUMENT_METADATA_KEY, IArgumentOptions } from '@/core/decorators/argument.decorator';
import { EmbedBuilder } from 'discord.js';

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
                const meta = Reflect.getMetadata(COMMAND_METADATA_KEY, cmdClass) as ICommandOptions;
                return {
                    name: meta.name,
                    description: meta.description,
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
        const commandClass = this.loader.getCommand(commandName);
        if (!commandClass) {
            const embed = this.getEmbed('error')
                .setTitle('Comando no encontrado')
                .setDescription(`No se encontró el comando \`${commandName}\`.`);

            await this.reply({ embeds: [embed] });
            return;
        }

        const meta: ICommandOptions = Reflect.getMetadata(COMMAND_METADATA_KEY, commandClass);
        const argsMeta: IArgumentOptions[] =
            Reflect.getMetadata(ARGUMENT_METADATA_KEY, commandClass) || [];

        // Construir el uso del comando
        let usage = '';
        if (this.ctx.isInteraction) {
            // Slash command: /comando
            usage = `/${meta.name}`;
        } else {
            // Text command: !comando <arg1> <arg2>
            usage = `${this.loader.prefix}${meta.name}`;
            if (argsMeta.length > 0) {
                const argsText = argsMeta
                    .sort((a, b) => a.index - b.index)
                    .map((arg) => {
                        const bracket = arg.required ? '<>' : '[]';
                        return bracket[0] + arg.name + bracket[1];
                    })
                    .join(' ');
                usage += ` ${argsText}`;
            }
        }

        const embed = this.getEmbed('info')
            .setTitle(`Ayuda: ${meta.name}`)
            .setDescription(meta.description || '*Sin descripción*')
            .addFields({ name: 'Uso', value: `\`${usage}\`` });

        // Agregar información de argumentos si existen
        if (argsMeta.length > 0) {
            const argsDescription = argsMeta
                .sort((a, b) => a.index - b.index)
                .map((arg) => {
                    return `**${arg.name}**: ${arg.description}`;
                })
                .join('\n\n');

            embed.addFields({ name: 'Argumentos', value: argsDescription });
        }

        // Agregar aliases si existen
        if (meta.aliases && meta.aliases.length > 0) {
            embed.addFields({
                name: 'Alias',
                value: meta.aliases.map((a) => `\`${a}\``).join(', '),
            });
        }
        if (!this.ctx.isInteraction) {
            embed.setFooter({ text: `<> = obligatorio, [] = opcional` });
        }
        await this.reply({ embeds: [embed] });
    }
}
