import { Events, Interaction, MessageFlags } from 'discord.js';
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
                        key,
                        undefined,
                        commandEntry.path,
                    );
                    return;
                }

                // Manejar componentes interactivos: el customId tiene formato
                // `<commandKey>:<methodName>:<id>`. El handler es un método
                // ESTÁTICO de la clase del comando (resolución vía
                // CommandLoader, no se registra nada en runtime).
                if (
                    interaction.isButton() ||
                    interaction.isStringSelectMenu() ||
                    interaction.isModalSubmit()
                ) {
                    const parsed = ComponentRegistry.parseCustomId(interaction.customId);
                    if (!parsed) {
                        console.warn(`⚠️ customId con formato inválido: ${interaction.customId}`);
                        return;
                    }

                    // Validar consistencia entre tipo de interacción y prefijo del método
                    const expectedType = ComponentRegistry.methodType(parsed.methodName);
                    const interactionType = interaction.isButton()
                        ? 'button'
                        : interaction.isStringSelectMenu()
                          ? 'select'
                          : 'modal';

                    if (expectedType !== interactionType) {
                        console.warn(
                            `⚠️ Tipo de método "${parsed.methodName}" no coincide con interacción ${interactionType} (customId: ${parsed.raw})`,
                        );
                        return;
                    }

                    // Resolver clase del comando
                    const commandClass = commandLoader.getCommand(parsed.commandKey);
                    if (!commandClass) {
                        console.warn(
                            `⚠️ No se encontró el comando "${parsed.commandKey}" para el customId ${parsed.raw}`,
                        );
                        return;
                    }

                    // Resolver método estático
                    const handler = (commandClass as unknown as Record<string, unknown>)[
                        parsed.methodName
                    ];
                    if (typeof handler !== 'function') {
                        console.warn(
                            `⚠️ El comando "${parsed.commandKey}" no expone el método estático "${parsed.methodName}"`,
                        );
                        return;
                    }

                    // Notificar al owner (ej. RichMessage) para que pueda
                    // resetear su timeout sin envolver callbacks por instancia.
                    const owner = ComponentRegistry.getOwner(parsed.raw);
                    if (owner) {
                        await owner.onComponentInteraction(parsed.raw);
                    }

                    // Recuperar payload. `undefined` indica que no existe
                    // (expirado o nunca creado). `null`/`false`/`0`/`''` son
                    // valores válidos.
                    const payload = await ComponentRegistry.getPayload(parsed.raw);

                    if (interaction.isButton()) {
                        await (handler as (...args: unknown[]) => unknown).call(
                            commandClass,
                            interaction,
                            payload,
                        );
                        return;
                    }

                    if (interaction.isStringSelectMenu()) {
                        await (handler as (...args: unknown[]) => unknown).call(
                            commandClass,
                            interaction,
                            interaction.values,
                            payload,
                        );
                        return;
                    }

                    if (interaction.isModalSubmit()) {
                        await (handler as (...args: unknown[]) => unknown).call(
                            commandClass,
                            interaction,
                            payload,
                        );
                        return;
                    }
                }
            } catch (error) {
                console.error('❌ Error al manejar interacción:', error);

                // Intentar responder con error si es posible
                try {
                    if (interaction.isRepliable()) {
                        const content = '❌ Ocurrió un error al procesar esta acción.';
                        const payload = { content, flags: [MessageFlags.Ephemeral] as const };

                        if (interaction.replied || interaction.deferred) {
                            await interaction.followUp(payload);
                        } else {
                            await interaction.reply(payload);
                        }
                    }
                } catch (replyError) {
                    console.error('❌ Error al enviar mensaje de error:', replyError);
                }
            }
        },
    };
}
