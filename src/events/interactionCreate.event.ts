import { Events, Interaction } from 'discord.js';
import { CommandLoader } from '@/core/loaders/command.loader';
import { CommandHandler } from '@/core/handlers/command.handler';
import { ComponentRegistry } from '@/core/registry/component.registry';
import { Permissions } from '@/utils/Permissions';

export function registerInteractionCreateEvent(
    commandLoader: CommandLoader,
    commandHandler: CommandHandler,
) {
    return {
        name: Events.InteractionCreate,
        async execute(interaction: Interaction) {
            const guild = interaction.guild;
            if (!guild) return;
            if (!guild.members.me?.permissions.has(Permissions.SendMessages)) return;

            try {
                // Manejar slash commands
                if (interaction.isChatInputCommand()) {
                    const subcommandGroup = interaction.options.getSubcommandGroup(false);
                    const subcommand = interaction.options.getSubcommand(false);
                    let key: string = interaction.commandName;

                    if (subcommand && subcommandGroup) {
                        key = `${interaction.commandName}-${subcommandGroup}-${subcommand}`;
                    }
                    if (subcommand && !subcommandGroup) {
                        key = `${interaction.commandName}-${subcommand}`;
                    }

                    const commandEntry = commandLoader.getCommandEntry(key);
                    if (!commandEntry) return;

                    await commandHandler.executeCommand(
                        interaction,
                        commandEntry.class,
                        commandLoader,
                        undefined,
                        commandEntry.path,
                    );
                    return;
                }

                // Manejar botones
                if (interaction.isButton()) {
                    const callback = ComponentRegistry.getButton(interaction.customId);

                    if (callback) {
                        await callback(interaction);
                    } else {
                        console.warn(
                            `⚠️ No se encontró callback para el botón: ${interaction.customId}`,
                        );
                    }
                    return;
                }

                // Manejar selects
                if (interaction.isStringSelectMenu()) {
                    const callback = ComponentRegistry.getSelect(interaction.customId);

                    if (callback) {
                        await callback(interaction, interaction.values);
                    } else {
                        console.warn(
                            `⚠️ No se encontró callback para el select: ${interaction.customId}`,
                        );
                    }
                    return;
                }

                // Manejar modales
                if (interaction.isModalSubmit()) {
                    const callback = ComponentRegistry.getModal(interaction.customId);

                    if (callback) {
                        await callback(interaction);
                    } else {
                        console.warn(
                            `⚠️ No se encontró callback para el modal: ${interaction.customId}`,
                        );
                    }
                    return;
                }
            } catch (error) {
                console.error('❌ Error al manejar interacción:', error);

                // Intentar responder con error si es posible
                try {
                    if (interaction.isRepliable()) {
                        const content = '❌ Ocurrió un error al procesar esta acción.';

                        if (interaction.replied || interaction.deferred) {
                            await interaction.followUp({ content, ephemeral: true });
                        } else {
                            await interaction.reply({ content, ephemeral: true });
                        }
                    }
                } catch (replyError) {
                    console.error('❌ Error al enviar mensaje de error:', replyError);
                }
            }
        },
    };
}
