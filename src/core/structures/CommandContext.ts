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
import { DEFAULT_LOCALE, type SupportedLocale } from '@/i18n';

type ReplyOptions = InteractionReplyOptions & MessageReplyOptions;

export class CommandContext {
    private source: CommandInteraction | Message;

    public readonly isInteraction: boolean;
    public readonly args: Map<string, any> = new Map();

    /**
     * Locale efectivo de la petición. Se asigna desde el `CommandHandler`
     * tras la resolución y queda inmutable durante la ejecución del
     * comando: cualquier código aguas abajo (resolver de argumentos,
     * plugins, helpers de respuesta) puede confiar en este valor.
     */
    public readonly locale: SupportedLocale = DEFAULT_LOCALE;

    constructor(source: CommandInteraction | Message, locale: SupportedLocale) {
        this.source = source;
        this.isInteraction = source instanceof CommandInteraction;
        this.locale = locale;
    }

    get client(): Client {
        return this.source.client;
    }

    public get sourceCommand(): CommandInteraction {
        return this.source as CommandInteraction;
    }

    public get sourceMessage(): Message {
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
