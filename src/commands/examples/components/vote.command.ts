import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { Category } from '@/utils/CommandCategories';
import { Button, ButtonVariant, RichMessage, ComponentRegistry } from '@/core/components';
import { Times } from '@/utils/Times';
import { ButtonInteraction, EmbedBuilder } from 'discord.js';

const EXPIRED_MESSAGE = 'Esta encuesta ha expirado. Vuelve a ejecutar `/vote`.';

/**
 * Estado de la encuesta. Viaja en el payload de CADA botón. Cuando el
 * usuario hace click, el handler estático lee este payload, calcula el
 * nuevo estado y recrea los botones con el estado actualizado.
 *
 * Como sólo se serializa el payload (nunca closures), este patrón
 * funciona idéntico con un PayloadStore in-memory o uno en Redis/Mongo.
 */
interface VotePayload {
    yes: number;
    no: number;
    meh: number;
    question: string;
}

const VOTE_COMMAND_KEY = 'vote';

function buildVoteEmbed(payload: VotePayload): EmbedBuilder {
    const total = payload.yes + payload.no + payload.meh;
    const bar = (n: number) => '▰'.repeat(n) + '▱'.repeat(Math.max(0, 10 - n));

    return new EmbedBuilder()
        .setColor('#5180d6')
        .setTitle('🗳️ ' + payload.question)
        .setDescription(
            [
                `👍 \`${payload.yes}\` ${bar(payload.yes)}`,
                `👎 \`${payload.no}\` ${bar(payload.no)}`,
                `🤷 \`${payload.meh}\` ${bar(payload.meh)}`,
                '',
                `Total: **${total}** voto${total === 1 ? '' : 's'}`,
            ].join('\n'),
        )
        .setTimestamp();
}

function buildVoteButtons(payload: VotePayload): Button[] {
    return [
        new Button<VotePayload>({
            label: 'Sí',
            variant: ButtonVariant.Success,
            emoji: '👍',
            command: VOTE_COMMAND_KEY,
            method: 'buttonYes',
            payload,
        }),
        new Button<VotePayload>({
            label: 'No',
            variant: ButtonVariant.Danger,
            emoji: '👎',
            command: VOTE_COMMAND_KEY,
            method: 'buttonNo',
            payload,
        }),
        new Button<VotePayload>({
            label: 'Indiferente',
            variant: ButtonVariant.Secondary,
            emoji: '🤷',
            command: VOTE_COMMAND_KEY,
            method: 'buttonMeh',
            payload,
        }),
        new Button<VotePayload>({
            label: 'Reiniciar',
            variant: ButtonVariant.Secondary,
            emoji: '♻️',
            command: VOTE_COMMAND_KEY,
            method: 'buttonReset',
            payload,
        }),
    ];
}

async function applyVote(
    interaction: ButtonInteraction,
    payload: VotePayload | undefined,
    next: (current: VotePayload) => VotePayload,
): Promise<void> {
    if (payload === undefined) {
        await BaseCommand.replyEphemeral(interaction, EXPIRED_MESSAGE);
        return;
    }

    // El owner es el RichMessage que agrupa los botones. Lo recuperamos
    // por customId — un puntero, no una closure.
    const owner = ComponentRegistry.getOwner(interaction.customId);
    if (!(owner instanceof RichMessage)) {
        await BaseCommand.replyEphemeral(interaction, EXPIRED_MESSAGE);
        return;
    }

    const updated = next(payload);

    await owner.edit({
        embeds: [buildVoteEmbed(updated)],
        components: buildVoteButtons(updated),
        timeout: Times.minutes(2),
    });
    await interaction.deferUpdate();
}

/**
 * Comando de ejemplo: encuesta interactiva con botones.
 *
 * Demuestra:
 * - Múltiples handlers estáticos en una misma clase (`button*`).
 * - Estado mutable serializado en el payload (no en closures).
 * - Recuperación del `RichMessage` desde el handler vía `ComponentRegistry.getOwner`
 *   para llamar `edit()` con los nuevos componentes.
 *
 * @example
 * ```
 * /vote pregunta:¿Implementamos dark mode?
 * ```
 */
@Command({
    name: VOTE_COMMAND_KEY,
    description: 'Lanza una encuesta de ejemplo con botones interactivos.',
    category: Category.Other,
})
export class VoteCommand extends BaseCommand {
    // ──────────────────────────────────────────────────────────────────
    // Handlers estáticos. Resueltos por el dispatcher vía
    // CommandLoader.getCommand('vote') + lookup directo en la clase.
    // ──────────────────────────────────────────────────────────────────

    public static async buttonYes(
        interaction: ButtonInteraction,
        payload: VotePayload | undefined,
    ): Promise<void> {
        await applyVote(interaction, payload, (p) => ({ ...p, yes: p.yes + 1 }));
    }

    public static async buttonNo(
        interaction: ButtonInteraction,
        payload: VotePayload | undefined,
    ): Promise<void> {
        await applyVote(interaction, payload, (p) => ({ ...p, no: p.no + 1 }));
    }

    public static async buttonMeh(
        interaction: ButtonInteraction,
        payload: VotePayload | undefined,
    ): Promise<void> {
        await applyVote(interaction, payload, (p) => ({ ...p, meh: p.meh + 1 }));
    }

    public static async buttonReset(
        interaction: ButtonInteraction,
        payload: VotePayload | undefined,
    ): Promise<void> {
        await applyVote(interaction, payload, (p) => ({
            ...p,
            yes: 0,
            no: 0,
            meh: 0,
        }));
    }

    // ──────────────────────────────────────────────────────────────────
    // Lógica del comando
    // ──────────────────────────────────────────────────────────────────

    async run(): Promise<void> {
        const initial: VotePayload = {
            yes: 0,
            no: 0,
            meh: 0,
            question: '¿Te gusta esta plantilla?',
        };

        const richMessage = new RichMessage({
            embeds: [buildVoteEmbed(initial)],
            components: buildVoteButtons(initial),
            timeout: Times.minutes(2),
        });

        await richMessage.send(this.ctx);
    }
}
