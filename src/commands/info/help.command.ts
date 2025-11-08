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
        const originalCommandName = commandName;
        const parts = originalCommandName.split(' ');

        // Intentar buscar el comando exacto primero (de más largo a más corto)
        // Esto permite: !help test alpha first → busca "test alpha first", luego "test alpha", luego "test"
        let commandClass = null;

        for (let wordCount = Math.min(parts.length, 3); wordCount > 0; wordCount--) {
            const tryName = parts.slice(0, wordCount).join(' ');
            const tryClass = this.loader.getCommand(tryName);

            if (tryClass) {
                commandClass = tryClass;
                commandName = tryName;
                break;
            }
        } // Si no se encuentra el comando, verificar si tiene subcomandos (patrón separated)
        if (!commandClass) {
            // Intentar con la primera palabra como prefijo
            const firstWord = commandName.split(' ')[0];
            const subcommands = this.loader.getSubcommandsByPrefix(firstWord);

            if (subcommands.length > 0) {
                // Es un comando padre sin archivo propio, pero con subcomandos
                const prefix = this.ctx.isInteraction ? '/' : this.loader.prefix;

                const subcommandList = subcommands
                    .map((cmd) => {
                        const subCommandClass = this.loader.getCommand(cmd);
                        if (subCommandClass) {
                            const subMeta: ICommandOptions = Reflect.getMetadata(
                                COMMAND_METADATA_KEY,
                                subCommandClass,
                            );
                            return `**${prefix}${cmd}** - ${subMeta.description}`;
                        }
                        return null;
                    })
                    .filter(Boolean)
                    .join('\n');

                const embed = this.getEmbed('info')
                    .setTitle(`Ayuda: ${firstWord}`)
                    .setDescription('Este comando tiene los siguientes subcomandos:')
                    .addFields({ name: 'Subcomandos', value: subcommandList });

                if (!this.ctx.isInteraction) {
                    embed.setFooter({
                        text: `Usa ${this.loader.prefix}help ${firstWord} <subcomando> para más información`,
                    });
                }

                await this.reply({ embeds: [embed] });
                return;
            }

            // No se encontró ni el comando ni subcomandos
            const embed = this.getEmbed('error')
                .setTitle('Comando no encontrado')
                .setDescription(`No se encontró el comando \`${commandName}\`.`);

            await this.reply({ embeds: [embed] });
            return;
        }

        const meta: ICommandOptions = Reflect.getMetadata(COMMAND_METADATA_KEY, commandClass);
        const argsMeta: IArgumentOptions[] =
            Reflect.getMetadata(ARGUMENT_METADATA_KEY, commandClass) || [];

        // Verificar si tiene subcomandos
        const hasSubcommands = meta.subcommands && meta.subcommands.length > 0;

        // Si el comando encontrado tiene subcomandos Y el usuario especificó más palabras,
        // intentar encontrar el subcomando específico o filtrar por grupo
        if (hasSubcommands && parts.length > commandName.split(' ').length) {
            // El usuario pidió algo más específico (ej: !help test alpha o !help test alpha first)
            // Extraer las palabras restantes
            const baseWordCount = commandName.split(' ').length;
            const remainingParts = parts.slice(baseWordCount);

            // Caso 1: El usuario especificó grupo + subcomando (2 palabras restantes)
            // Ejemplo: !help test alpha first
            if (remainingParts.length === 2) {
                const potentialGroupAndSub = remainingParts.join(' ');
                const matchingSubcommand = meta.subcommands!.find(
                    (sub) => sub.toLowerCase() === potentialGroupAndSub.toLowerCase(),
                );

                if (matchingSubcommand) {
                    // Es un subcomando con grupo
                    const fullSubcommandName = `${meta.name} ${matchingSubcommand}`;

                    // Intentar buscar archivo separado (patrón separated)
                    const subCommandClass = this.loader.getCommand(fullSubcommandName);

                    if (subCommandClass) {
                        // PATRÓN SEPARATED: Archivo separado encontrado
                        const subMeta: ICommandOptions = Reflect.getMetadata(
                            COMMAND_METADATA_KEY,
                            subCommandClass,
                        );
                        const subArgsMeta: IArgumentOptions[] =
                            Reflect.getMetadata(ARGUMENT_METADATA_KEY, subCommandClass) || [];

                        const subEmbed = this.getEmbed('info')
                            .setTitle(`Ayuda: ${subMeta.name}`)
                            .setDescription(subMeta.description || '*Sin descripción*');

                        const prefix = this.ctx.isInteraction ? '/' : this.loader.prefix;
                        let usage = `${prefix}${subMeta.name}`;

                        if (subArgsMeta.length > 0 && !this.ctx.isInteraction) {
                            const argsText = subArgsMeta
                                .sort((a, b) => a.index - b.index)
                                .map((arg) => {
                                    const bracket = arg.required ? '<>' : '[]';
                                    return bracket[0] + arg.name + bracket[1];
                                })
                                .join(' ');
                            usage += ` ${argsText}`;
                        }

                        subEmbed.addFields({ name: 'Uso', value: `\`${usage}\`` });

                        if (subArgsMeta.length > 0) {
                            const argsDescription = subArgsMeta
                                .sort((a, b) => a.index - b.index)
                                .map((arg) => `**${arg.name}**: ${arg.description}`)
                                .join('\n\n');

                            subEmbed.addFields({ name: 'Argumentos', value: argsDescription });
                        }

                        if (!this.ctx.isInteraction) {
                            subEmbed.setFooter({ text: `<> = obligatorio, [] = opcional` });
                        }

                        await this.reply({ embeds: [subEmbed] });
                        return;
                    } else {
                        // PATRÓN UNIFIED: No hay archivo separado, usar argumentos del comando base
                        // Filtrar argumentos que pertenecen a este subcomando
                        const subArgsMeta = argsMeta.filter((arg) => {
                            if (!arg.subcommands || arg.subcommands.length === 0) {
                                return true; // Argumentos sin subcommands están en todos
                            }
                            return arg.subcommands.includes(matchingSubcommand);
                        });

                        const subEmbed = this.getEmbed('info')
                            .setTitle(`Ayuda: ${meta.name} ${matchingSubcommand}`)
                            .setDescription(`Subcomando ${matchingSubcommand} de ${meta.name}`);

                        const prefix = this.ctx.isInteraction ? '/' : this.loader.prefix;
                        let usage = `${prefix}${meta.name} ${matchingSubcommand}`;

                        if (subArgsMeta.length > 0 && !this.ctx.isInteraction) {
                            const argsText = subArgsMeta
                                .sort((a, b) => a.index - b.index)
                                .map((arg) => {
                                    const bracket = arg.required ? '<>' : '[]';
                                    return bracket[0] + arg.name + bracket[1];
                                })
                                .join(' ');
                            usage += ` ${argsText}`;
                        }

                        subEmbed.addFields({ name: 'Uso', value: `\`${usage}\`` });

                        if (subArgsMeta.length > 0) {
                            const argsDescription = subArgsMeta
                                .sort((a, b) => a.index - b.index)
                                .map((arg) => `**${arg.name}**: ${arg.description}`)
                                .join('\n\n');

                            subEmbed.addFields({ name: 'Argumentos', value: argsDescription });
                        }

                        if (!this.ctx.isInteraction) {
                            subEmbed.setFooter({ text: `<> = obligatorio, [] = opcional` });
                        }

                        await this.reply({ embeds: [subEmbed] });
                        return;
                    }
                }
            } // Caso 2: El usuario especificó solo 1 palabra adicional
            // Puede ser: un grupo (alpha) o un subcomando directo (get)
            if (remainingParts.length === 1) {
                const singleWord = remainingParts[0].toLowerCase();

                // Primero verificar si es un subcomando directo (sin espacio)
                const directSubcommand = meta.subcommands!.find(
                    (sub) => sub.toLowerCase() === singleWord && !sub.includes(' '),
                );

                if (directSubcommand) {
                    // Es un subcomando directo (sin espacio)
                    const fullSubcommandName = `${meta.name} ${directSubcommand}`;
                    const subCommandClass = this.loader.getCommand(fullSubcommandName);

                    if (subCommandClass) {
                        // PATRÓN SEPARATED: Archivo separado encontrado
                        const subMeta: ICommandOptions = Reflect.getMetadata(
                            COMMAND_METADATA_KEY,
                            subCommandClass,
                        );
                        const subArgsMeta: IArgumentOptions[] =
                            Reflect.getMetadata(ARGUMENT_METADATA_KEY, subCommandClass) || [];

                        const subEmbed = this.getEmbed('info')
                            .setTitle(`Ayuda: ${subMeta.name}`)
                            .setDescription(subMeta.description || '*Sin descripción*');

                        const prefix = this.ctx.isInteraction ? '/' : this.loader.prefix;
                        let usage = `${prefix}${subMeta.name}`;

                        if (subArgsMeta.length > 0 && !this.ctx.isInteraction) {
                            const argsText = subArgsMeta
                                .sort((a, b) => a.index - b.index)
                                .map((arg) => {
                                    const bracket = arg.required ? '<>' : '[]';
                                    return bracket[0] + arg.name + bracket[1];
                                })
                                .join(' ');
                            usage += ` ${argsText}`;
                        }

                        subEmbed.addFields({ name: 'Uso', value: `\`${usage}\`` });

                        if (subArgsMeta.length > 0) {
                            const argsDescription = subArgsMeta
                                .sort((a, b) => a.index - b.index)
                                .map((arg) => `**${arg.name}**: ${arg.description}`)
                                .join('\n\n');

                            subEmbed.addFields({ name: 'Argumentos', value: argsDescription });
                        }

                        if (!this.ctx.isInteraction) {
                            subEmbed.setFooter({ text: `<> = obligatorio, [] = opcional` });
                        }

                        await this.reply({ embeds: [subEmbed] });
                        return;
                    } else {
                        // PATRÓN UNIFIED: No hay archivo separado, usar argumentos del comando base
                        const subArgsMeta = argsMeta.filter((arg) => {
                            if (!arg.subcommands || arg.subcommands.length === 0) {
                                return true; // Argumentos sin subcommands están en todos
                            }
                            return arg.subcommands.includes(directSubcommand);
                        });

                        const subEmbed = this.getEmbed('info')
                            .setTitle(`Ayuda: ${meta.name} ${directSubcommand}`)
                            .setDescription(`Subcomando ${directSubcommand} de ${meta.name}`);

                        const prefix = this.ctx.isInteraction ? '/' : this.loader.prefix;
                        let usage = `${prefix}${meta.name} ${directSubcommand}`;

                        if (subArgsMeta.length > 0 && !this.ctx.isInteraction) {
                            const argsText = subArgsMeta
                                .sort((a, b) => a.index - b.index)
                                .map((arg) => {
                                    const bracket = arg.required ? '<>' : '[]';
                                    return bracket[0] + arg.name + bracket[1];
                                })
                                .join(' ');
                            usage += ` ${argsText}`;
                        }

                        subEmbed.addFields({ name: 'Uso', value: `\`${usage}\`` });

                        if (subArgsMeta.length > 0) {
                            const argsDescription = subArgsMeta
                                .sort((a, b) => a.index - b.index)
                                .map((arg) => `**${arg.name}**: ${arg.description}`)
                                .join('\n\n');

                            subEmbed.addFields({ name: 'Argumentos', value: argsDescription });
                        }

                        if (!this.ctx.isInteraction) {
                            subEmbed.setFooter({ text: `<> = obligatorio, [] = opcional` });
                        }

                        await this.reply({ embeds: [subEmbed] });
                        return;
                    }
                }

                // Si no es subcomando directo, verificar si es un grupo
                const groupSubcommands = meta.subcommands!.filter((sub) => {
                    const subParts = sub.split(' ');
                    return subParts.length === 2 && subParts[0].toLowerCase() === singleWord;
                });

                if (groupSubcommands.length > 0) {
                    // Es un grupo, mostrar solo los subcomandos de ese grupo
                    const prefix = this.ctx.isInteraction ? '/' : this.loader.prefix;
                    const embed = this.getEmbed('info')
                        .setTitle(`Ayuda: ${meta.name} - Grupo ${singleWord}`)
                        .setDescription(`Subcomandos del grupo \`${singleWord}\`:`);

                    const groupText = groupSubcommands
                        .map((sub) => {
                            const subCommandName = `${meta.name} ${sub}`;
                            const subCommandClass = this.loader.getCommand(subCommandName);

                            let description = `Subcomando ${sub}`;
                            if (subCommandClass) {
                                const subMeta: ICommandOptions = Reflect.getMetadata(
                                    COMMAND_METADATA_KEY,
                                    subCommandClass,
                                );
                                description = subMeta.description;
                            }

                            return `**${prefix}${subCommandName}** - ${description}`;
                        })
                        .join('\n');

                    embed.addFields({ name: `Subcomandos`, value: groupText });

                    if (!this.ctx.isInteraction) {
                        embed.setFooter({
                            text: `Usa ${this.loader.prefix}help ${meta.name} ${singleWord} <subcomando> para más información`,
                        });
                    }

                    await this.reply({ embeds: [embed] });
                    return;
                }
            }
        }

        const embed = this.getEmbed('info')
            .setTitle(`Ayuda: ${meta.name}`)
            .setDescription(meta.description || '*Sin descripción*');

        if (hasSubcommands) {
            // Organizar subcomandos por grupos si tienen espacios
            const groups = new Map<string, Array<{ name: string; description: string }>>();
            const directSubcommands: Array<{ name: string; description: string }> = [];

            for (const sub of meta.subcommands!) {
                const parts = sub.split(' ');

                // Buscar si el subcomando está en archivo separado (patrón separated)
                const subCommandName = `${meta.name} ${sub}`;
                const subCommandClass = this.loader.getCommand(subCommandName);

                let description = `Subcomando ${sub}`;
                if (subCommandClass) {
                    const subMeta: ICommandOptions = Reflect.getMetadata(
                        COMMAND_METADATA_KEY,
                        subCommandClass,
                    );
                    description = subMeta.description;
                }

                if (parts.length === 2) {
                    // "alpha first" → grupo: "alpha", subcomando: "first"
                    const [groupName, subName] = parts;

                    if (!groups.has(groupName)) {
                        groups.set(groupName, []);
                    }

                    groups.get(groupName)!.push({ name: subName, description });
                } else {
                    // "get" → subcomando directo sin grupo
                    directSubcommands.push({ name: sub, description });
                }
            }

            const prefix = this.ctx.isInteraction ? '/' : this.loader.prefix;

            // Si hay grupos, mostrarlos separados
            if (groups.size > 0) {
                for (const [groupName, subs] of groups) {
                    const groupText = subs
                        .map(
                            (sub) =>
                                `**${prefix}${meta.name} ${groupName} ${sub.name}** - ${sub.description}`,
                        )
                        .join('\n');

                    embed.addFields({
                        name: `📁 Grupo: ${groupName}`,
                        value: groupText,
                    });
                }
            }

            // Mostrar subcomandos directos si existen
            if (directSubcommands.length > 0) {
                const directText = directSubcommands
                    .map((sub) => `**${prefix}${meta.name} ${sub.name}** - ${sub.description}`)
                    .join('\n');

                const fieldName = groups.size > 0 ? '📄 Subcomandos directos' : 'Subcomandos';
                embed.addFields({ name: fieldName, value: directText });
            }

            // Solo mostrar el footer para comandos de texto
            if (!this.ctx.isInteraction) {
                // Determinar si es patrón separated (subcomandos en archivos separados)
                // Si al menos uno de los subcomandos existe como comando separado, es patrón separated
                const isSeparatedPattern = meta.subcommands!.some((sub) => {
                    const subCommandName = `${meta.name} ${sub}`;
                    return this.loader.getCommand(subCommandName) !== undefined;
                });

                if (isSeparatedPattern) {
                    // Patrón separated: permite !help comando subcomando
                    embed.setFooter({
                        text: `Usa ${this.loader.prefix}help ${meta.name} <subcomando> para más información`,
                    });
                } else {
                    // Patrón unified: no permite ayuda individual por subcomando
                    embed.setFooter({
                        text: `Usa ${this.loader.prefix}${meta.name} <subcomando> para ejecutar el comando`,
                    });
                }
            }
        } else {
            // Comando sin subcomandos - mostrar uso normal
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

            embed.addFields({ name: 'Uso', value: `\`${usage}\`` });

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

            if (!this.ctx.isInteraction) {
                embed.setFooter({ text: `<> = obligatorio, [] = opcional` });
            }
        }

        // Agregar aliases si existen
        if (meta.aliases && meta.aliases.length > 0) {
            embed.addFields({
                name: 'Alias',
                value: meta.aliases.map((a) => `\`${a}\``).join(', '),
            });
        }

        await this.reply({ embeds: [embed] });
    }
}
