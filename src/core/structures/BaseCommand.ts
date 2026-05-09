import { CommandContext } from './CommandContext';
import {
    User,
    TextChannel,
    EmbedBuilder,
    ColorResolvable,
    Guild,
    Client,
    GuildMember,
    MessageFlags,
    RepliableInteraction,
} from 'discord.js';
import { InteractionReplyOptions, MessageReplyOptions } from 'discord.js';
import { CommandLoader } from '../loaders/command.loader';
import { ReplyError } from '@/error/ReplyError';

type ReplyOptions = InteractionReplyOptions & MessageReplyOptions;

/**
 * Opciones aceptadas por los helpers estáticos de respuesta. Un string se
 * interpreta como `{ content }`. Las flags se manejan internamente, así que
 * se omiten del tipo público para evitar inconsistencias.
 */
type EphemeralReplyOptions = Omit<InteractionReplyOptions, 'flags' | 'ephemeral'>;
type EphemeralReplyInput = string | EphemeralReplyOptions;

export abstract class BaseCommand {
    public readonly id!: string;
    public readonly ctx!: CommandContext;
    public readonly user!: User;
    public readonly channel!: TextChannel | null;
    public readonly guild!: Guild;
    public readonly client!: Client;
    public readonly loader!: CommandLoader;

    public abstract run(): Promise<void>;

    public async reply(options: ReplyOptions | string) {
        if (!this.ctx) {
            throw new Error('El contexto no fue definido');
        }
        await this.ctx.reply(options);
    }

    public async send(options: ReplyOptions | string) {
        if (!this.ctx) {
            throw new Error('El contexto no fue definido');
        }
        await this.ctx.send(options);
    }

    public getEmbed(
        type: 'error' | 'success' | 'warning' | 'info',
        noTimestamp: boolean = false,
    ): EmbedBuilder {
        const colors: Record<string, ColorResolvable> = {
            error: '#ca5c5c',
            success: '#6ec06c',
            warning: '#d49954',
            info: '#5180d6',
        };

        const embed = new EmbedBuilder().setColor(colors[type] || colors.info);
        if (!noTimestamp) {
            embed.setTimestamp();
        }

        return embed;
    }

    public async onBeforeExecute(operation: (command: any) => Promise<void>): Promise<void> {
        await operation(this);
    }

    public async onAfterExecute(operation: (command: any) => Promise<void>): Promise<void> {
        await operation(this);
    }

    protected validateUserIsNotAuthor(target: GuildMember | User): void {
        if (target.id === this.user.id) {
            throw new ReplyError('No puedes ejecutar este comando sobre ti mismo.');
        }
    }

    protected validateUserIsNotBot(target: GuildMember): void {
        if (target.id === this.client.user?.id) {
            throw new ReplyError('¿Por qué debería hacer eso conmigo mismo?');
        }
    }

    protected get authorName(): string {
        return this.user.globalName || this.user.username;
    }

    // ──────────────────────────────────────────────────────────────────
    // Helpers estáticos de respuesta para handlers de componentes
    // ──────────────────────────────────────────────────────────────────

    /**
     * Responde de forma efímera a una interacción. Centraliza el uso de
     * `flags: [MessageFlags.Ephemeral]` (la opción `ephemeral: true` está
     * deprecada en discord.js v14) y elige automáticamente entre `reply`
     * y `followUp` según el estado de la interacción.
     *
     * Pensado para los handlers estáticos de botones/selects/modales,
     * donde no hay instancia de `BaseCommand` disponible.
     *
     * @example
     * ```ts
     * public static async buttonConfirm(interaction: ButtonInteraction) {
     *     await BaseCommand.replyEphemeral(interaction, '✅ Confirmado');
     * }
     * ```
     */
    public static async replyEphemeral(
        interaction: RepliableInteraction,
        options: EphemeralReplyInput,
    ): Promise<void> {
        const base: EphemeralReplyOptions =
            typeof options === 'string' ? { content: options } : options;
        const payload: InteractionReplyOptions = {
            ...base,
            flags: [MessageFlags.Ephemeral],
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(payload);
        } else {
            await interaction.reply(payload);
        }
    }
}
