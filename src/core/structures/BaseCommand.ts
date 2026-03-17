import { CommandContext } from './CommandContext';
import {
    User,
    TextChannel,
    EmbedBuilder,
    ColorResolvable,
    Guild,
    Client,
    GuildMember,
} from 'discord.js';
import { InteractionReplyOptions, MessageReplyOptions } from 'discord.js';
import { CommandLoader } from '../loaders/command.loader';
import { ReplyError } from '@/error/ReplyError';

type ReplyOptions = InteractionReplyOptions & MessageReplyOptions;

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
}
