import {
    CommandInteraction,
    Message,
    TextChannel,
    User,
    InteractionReplyOptions,
    MessageReplyOptions,
    MessageFlags,
    Guild,
    Client,
    InteractionResponse,
    GuildMember,
} from 'discord.js';

type ReplyOptions = InteractionReplyOptions & MessageReplyOptions;

export class CommandContext {
    private source: CommandInteraction | Message;

    public readonly isInteraction: boolean;
    public readonly args: Map<string, any> = new Map();

    constructor(source: CommandInteraction | Message) {
        this.source = source;
        this.isInteraction = source instanceof CommandInteraction;
    }

    get client(): Client {
        return this.source.client;
    }

    private get sourceCommand(): CommandInteraction {
        return this.source as CommandInteraction;
    }

    private get sourceMessage(): Message {
        return this.source as Message;
    }

    get guild(): Guild {
        return this.isInteraction ? this.sourceCommand.guild! : this.sourceMessage.guild!;
    }

    get user(): User {
        return this.isInteraction ? this.sourceCommand.user : this.sourceMessage.author;
    }

    get channel(): TextChannel | null {
        if (this.source.channel?.isTextBased()) {
            return this.source.channel as TextChannel;
        }
        return null;
    }

    get member(): GuildMember {
        if (this.isInteraction) {
            return this.sourceCommand.member as GuildMember;
        } else {
            return this.sourceMessage.member!;
        }
    }

    private async _reply(
        options: ReplyOptions | string,
        send: boolean = false,
    ): Promise<Message | InteractionResponse | undefined> {
        const payload = typeof options === 'string' ? { content: options } : options;

        if (this.isInteraction) {
            return await this.sourceCommand.reply(payload);
        } else {
            const { flags: _flags, ...messageOptions } = payload;
            if (send) {
                return await this.channel?.send(messageOptions);
            } else {
                return await this.sourceMessage.reply(messageOptions);
            }
        }
    }

    async send(options: ReplyOptions | string): Promise<Message | InteractionResponse | undefined> {
        return await this._reply(options, true);
    }

    async reply(
        options: ReplyOptions | string,
    ): Promise<Message | InteractionResponse | undefined> {
        return await this._reply(options);
    }

    async ephemeral(
        options: ReplyOptions | string,
    ): Promise<Message | InteractionResponse | undefined> {
        const payload = typeof options === 'string' ? { content: options } : options;

        if (this.isInteraction) {
            return await this.sourceCommand.reply({ ...payload, flags: [MessageFlags.Ephemeral] });
        } else {
            return await this.sourceMessage.reply(payload);
        }
    }
}
