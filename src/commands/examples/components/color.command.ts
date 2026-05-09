import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { Category } from '@/utils/CommandCategories';
import { Select, RichMessage, ComponentRegistry, type SelectOption } from '@/core/components';
import { Times } from '@/utils/Times';
import { ColorResolvable, EmbedBuilder, StringSelectMenuInteraction } from 'discord.js';

/**
 * El payload del select indica quién originó el comando. Lo usamos para
 * impedir que terceros interactúen con un select que no es suyo.
 *
 * Cualquier dato auxiliar va en el payload — nunca en una closure.
 */
interface ColorPayload {
    initiatorId: string;
}

const COLOR_COMMAND_KEY = 'color';

interface ColorChoice {
    label: string;
    value: string;
    emoji: string;
    hex: ColorResolvable;
    description: string;
}

const COLORS: ColorChoice[] = [
    { label: 'Rojo', value: 'red', emoji: '🔴', hex: '#ca5c5c', description: 'Cálido e intenso' },
    {
        label: 'Verde',
        value: 'green',
        emoji: '🟢',
        hex: '#6ec06c',
        description: 'Naturaleza y calma',
    },
    { label: 'Azul', value: 'blue', emoji: '🔵', hex: '#5180d6', description: 'Sereno y profundo' },
    {
        label: 'Amarillo',
        value: 'yellow',
        emoji: '🟡',
        hex: '#d4b454',
        description: 'Vibrante y luminoso',
    },
    {
        label: 'Morado',
        value: 'purple',
        emoji: '🟣',
        hex: '#9b6bd6',
        description: 'Místico y elegante',
    },
];

const COLOR_SELECT_OPTIONS: SelectOption[] = COLORS.map((c) => ({
    label: c.label,
    value: c.value,
    emoji: c.emoji,
    description: c.description,
}));

function buildPromptEmbed(): EmbedBuilder {
    return new EmbedBuilder()
        .setColor('#5180d6')
        .setTitle('🎨 Selector de color')
        .setDescription('Elige un color del menú para verlo aplicado al embed.')
        .setTimestamp();
}

function buildColorEmbed(choice: ColorChoice): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(choice.hex)
        .setTitle(`${choice.emoji} ${choice.label}`)
        .setDescription(choice.description)
        .addFields({ name: 'Hex', value: `\`${choice.hex}\``, inline: true })
        .setTimestamp();
}

/**
 * Comando de ejemplo: selector de color con un Select menu.
 *
 * Demuestra:
 * - Handler estático con prefijo `select*`.
 * - Validación con el payload de quién puede interactuar.
 * - Edición del mensaje vía `RichMessage.edit()` recuperado por owner.
 *
 * @example
 * ```
 * /color
 * ```
 */
@Command({
    name: COLOR_COMMAND_KEY,
    description: 'Selector de color de ejemplo usando un Select menu.',
    category: Category.Other,
})
export class ColorCommand extends BaseCommand {
    // ──────────────────────────────────────────────────────────────────
    // Handler estático
    // ──────────────────────────────────────────────────────────────────

    public static async selectPick(
        interaction: StringSelectMenuInteraction,
        values: string[],
        payload: ColorPayload | undefined,
    ): Promise<void> {
        if (payload === undefined) {
            await BaseCommand.replyEphemeral(interaction, 'Esta interacción ha expirado.');
            return;
        }

        // Restringimos la interacción al usuario que invocó el comando.
        // El `initiatorId` viene del payload, no de un estado en memoria.
        if (interaction.user.id !== payload.initiatorId) {
            await BaseCommand.replyEphemeral(
                interaction,
                'Sólo quien invocó el comando puede usar este menú.',
            );
            return;
        }

        const owner = ComponentRegistry.getOwner(interaction.customId);
        if (!(owner instanceof RichMessage)) {
            await BaseCommand.replyEphemeral(interaction, 'Esta interacción ha expirado.');
            return;
        }

        const choice = COLORS.find((c) => c.value === values[0]);
        if (!choice) {
            await BaseCommand.replyEphemeral(interaction, 'Color desconocido.');
            return;
        }

        await owner.edit({
            embeds: [buildColorEmbed(choice)],
            // Mantenemos el select para permitir nuevas elecciones.
            components: [ColorCommand.buildSelect(payload)],
            timeout: Times.minutes(1),
        });
        await interaction.deferUpdate();
    }

    // ──────────────────────────────────────────────────────────────────
    // Lógica del comando
    // ──────────────────────────────────────────────────────────────────

    private static buildSelect(payload: ColorPayload): Select<ColorPayload> {
        return new Select<ColorPayload>({
            command: COLOR_COMMAND_KEY,
            method: 'selectPick',
            payload,
            placeholder: 'Selecciona un color',
            options: COLOR_SELECT_OPTIONS,
        });
    }

    async run(): Promise<void> {
        const payload: ColorPayload = { initiatorId: this.user.id };

        const richMessage = new RichMessage({
            embeds: [buildPromptEmbed()],
            components: [ColorCommand.buildSelect(payload)],
            timeout: Times.minutes(1),
        });

        await richMessage.send(this.ctx);
    }
}
