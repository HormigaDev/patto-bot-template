import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { Category } from '@/utils/CommandCategories';
import { Button, ButtonVariant, Modal, RichMessage, TextInputStyle } from '@/core/components';
import { Times } from '@/utils/Times';
import { ButtonInteraction, EmbedBuilder, ModalSubmitInteraction } from 'discord.js';

/**
 * Payload del botón "Abrir formulario": guarda quién puede abrir el modal.
 *
 * Recordá que un modal sólo se puede mostrar como PRIMERA respuesta a una
 * interacción (no se puede mostrar tras `defer` o `reply`). Por eso este
 * ejemplo encadena: slash → botón → modal.
 */
interface OpenFormPayload {
    initiatorId: string;
}

/**
 * Payload del modal: información que el handler de submit necesita
 * además de los campos rellenados por el usuario.
 */
interface FeedbackPayload {
    initiatorId: string;
    openedAt: number;
}

const FEEDBACK_COMMAND_KEY = 'feedback';

/**
 * Comando de ejemplo: formulario de feedback con un Modal.
 *
 * Demuestra:
 * - Encadenamiento botón → modal (un modal sólo se puede mostrar como
 *   primera respuesta a una interacción).
 * - Dos handlers estáticos en la misma clase: uno `button*`, uno `modal*`.
 * - Persistencia explícita del payload con `modal.commit(ttl)` antes de
 *   `interaction.showModal(...)`.
 *
 * @example
 * ```
 * /feedback
 * ```
 */
@Command({
    name: FEEDBACK_COMMAND_KEY,
    description: 'Formulario de feedback de ejemplo usando un Modal.',
    category: Category.Other,
})
export class FeedbackCommand extends BaseCommand {
    // ──────────────────────────────────────────────────────────────────
    // Handlers estáticos
    // ──────────────────────────────────────────────────────────────────

    public static async buttonOpen(
        interaction: ButtonInteraction,
        payload: OpenFormPayload | undefined,
    ): Promise<void> {
        if (payload === undefined) {
            await BaseCommand.replyEphemeral(
                interaction,
                'Esta invitación ha expirado. Vuelve a ejecutar `/feedback`.',
            );
            return;
        }

        // Restringimos la apertura al autor del comando.
        if (interaction.user.id !== payload.initiatorId) {
            await BaseCommand.replyEphemeral(
                interaction,
                'Sólo quien invocó el comando puede abrir este formulario.',
            );
            return;
        }

        // Construir y mostrar el modal. El payload del modal debe persistirse
        // ANTES de showModal — no hay un RichMessage que lo haga por nosotros.
        const modal = new Modal<FeedbackPayload>({
            command: FEEDBACK_COMMAND_KEY,
            method: 'modalSubmit',
            title: 'Tu feedback',
            payload: {
                initiatorId: interaction.user.id,
                openedAt: Date.now(),
            },
            fields: [
                {
                    customId: 'subject',
                    label: 'Asunto',
                    style: TextInputStyle.Short,
                    placeholder: 'Resumen breve',
                    required: true,
                    minLength: 3,
                    maxLength: 80,
                },
                {
                    customId: 'message',
                    label: 'Mensaje',
                    style: TextInputStyle.Paragraph,
                    placeholder: 'Cuéntanos qué piensas…',
                    required: true,
                    minLength: 10,
                    maxLength: 1500,
                },
            ],
        });

        await modal.commit(Times.minutes(10));
        await interaction.showModal(modal.getBuilder());
    }

    public static async modalSubmit(
        interaction: ModalSubmitInteraction,
        payload: FeedbackPayload | undefined,
    ): Promise<void> {
        if (payload === undefined) {
            await BaseCommand.replyEphemeral(
                interaction,
                'El formulario expiró antes de enviarse.',
            );
            return;
        }

        const subject = interaction.fields.getTextInputValue('subject');
        const message = interaction.fields.getTextInputValue('message');
        const elapsedSec = Math.round((Date.now() - payload.openedAt) / 1000);

        const embed = new EmbedBuilder()
            .setColor('#6ec06c')
            .setTitle('✅ Feedback recibido')
            .addFields(
                { name: 'Asunto', value: subject },
                { name: 'Mensaje', value: message },
                {
                    name: 'Tiempo de respuesta',
                    value: `${elapsedSec}s`,
                    inline: true,
                },
            )
            .setFooter({ text: `Enviado por ${interaction.user.tag}` })
            .setTimestamp();

        await BaseCommand.replyEphemeral(interaction, { embeds: [embed] });
    }

    // ──────────────────────────────────────────────────────────────────
    // Lógica del comando
    // ──────────────────────────────────────────────────────────────────

    async run(): Promise<void> {
        const openButton = new Button<OpenFormPayload>({
            label: 'Abrir formulario',
            variant: ButtonVariant.Primary,
            emoji: '📝',
            command: FEEDBACK_COMMAND_KEY,
            method: 'buttonOpen',
            payload: { initiatorId: this.user.id },
        });

        const embed = this.getEmbed('info')
            .setTitle('💬 Comparte tu feedback')
            .setDescription(
                'Pulsa el botón para abrir un formulario donde podrás contarnos qué te parece.',
            );

        const richMessage = new RichMessage({
            embeds: [embed],
            components: [openButton],
            timeout: Times.minutes(2),
        });

        await richMessage.send(this.ctx);
    }
}
