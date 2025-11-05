import {
    Client,
    User,
    Guild,
    GuildMember,
    TextChannel,
    Message,
    CommandInteraction,
    Collection,
} from 'discord.js';

/**
 * Mock de Client de Discord.js
 */
export function createMockClient(): jest.Mocked<Client> {
    return {
        user: createMockUser('123456789', 'TestBot'),
        guilds: {
            cache: new Collection(),
        } as any,
        ws: {
            ping: 50,
        } as any,
        login: jest.fn().mockResolvedValue('token'),
        destroy: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
    } as unknown as jest.Mocked<Client>;
}

/**
 * Mock de User de Discord.js
 */
export function createMockUser(
    id: string = '123456789',
    username: string = 'TestUser',
): jest.Mocked<User> {
    return {
        id,
        username,
        discriminator: '0001',
        tag: `${username}#0001`,
        bot: false,
        globalName: username,
        displayAvatarURL: jest
            .fn()
            .mockReturnValue(`https://cdn.discordapp.com/avatars/${id}/test.png`),
        toString: jest.fn().mockReturnValue(`<@${id}>`),
    } as unknown as jest.Mocked<User>;
}

/**
 * Mock de Guild de Discord.js
 */
export function createMockGuild(
    id: string = '987654321',
    name: string = 'Test Guild',
): jest.Mocked<Guild> {
    return {
        id,
        name,
        members: {
            cache: new Collection(),
            fetch: jest.fn(),
        } as any,
        channels: {
            cache: new Collection(),
            fetch: jest.fn(),
        } as any,
        roles: {
            cache: new Collection(),
            fetch: jest.fn(),
        } as any,
    } as unknown as jest.Mocked<Guild>;
}

/**
 * Mock de GuildMember de Discord.js
 */
export function createMockMember(
    user: User = createMockUser(),
    guild: Guild = createMockGuild(),
): jest.Mocked<GuildMember> {
    return {
        id: user.id,
        user,
        guild,
        displayName: user.username,
        nickname: null,
        roles: {
            cache: new Collection(),
            add: jest.fn(),
            remove: jest.fn(),
        } as any,
        kick: jest.fn().mockResolvedValue(undefined),
        ban: jest.fn().mockResolvedValue(undefined),
        timeout: jest.fn().mockResolvedValue(undefined),
        toString: jest.fn().mockReturnValue(`<@${user.id}>`),
    } as unknown as jest.Mocked<GuildMember>;
}

/**
 * Mock de TextChannel de Discord.js
 */
export function createMockTextChannel(
    id: string = '111222333',
    name: string = 'test-channel',
    guild?: Guild,
): jest.Mocked<TextChannel> {
    return {
        id,
        name,
        guild: guild || createMockGuild(),
        type: 0, // GUILD_TEXT
        send: jest.fn().mockResolvedValue({} as Message), // Evitar referencia circular
        bulkDelete: jest.fn(),
        isTextBased: jest.fn().mockReturnValue(true),
        toString: jest.fn().mockReturnValue(`<#${id}>`),
    } as unknown as jest.Mocked<TextChannel>;
}

/**
 * Mock de Message de Discord.js
 */
export function createMockMessage(
    content: string = 'Test message',
    author?: User,
    channel?: TextChannel,
): jest.Mocked<Message> {
    const mockAuthor = author || createMockUser();
    const mockChannel = channel || createMockTextChannel();

    return {
        id: '555666777',
        content,
        author: mockAuthor,
        channel: mockChannel,
        guild: mockChannel.guild,
        member: createMockMember(mockAuthor, mockChannel.guild),
        createdTimestamp: Date.now(),
        reply: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
        edit: jest.fn().mockResolvedValue(undefined),
        react: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Message>;
}

/**
 * Mock de CommandInteraction de Discord.js
 */
export function createMockInteraction(
    commandName: string = 'test',
    user?: User,
    guild?: Guild,
): jest.Mocked<CommandInteraction> {
    const mockUser = user || createMockUser();
    const mockGuild = guild || createMockGuild();

    const interaction = {
        id: '888999000',
        commandName,
        user: mockUser,
        guild: mockGuild,
        member: createMockMember(mockUser, mockGuild),
        channel: createMockTextChannel(),
        createdTimestamp: Date.now(),
        replied: false,
        deferred: false,
        reply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
        deferReply: jest.fn().mockResolvedValue(undefined),
        followUp: jest.fn().mockResolvedValue(undefined),
        deleteReply: jest.fn().mockResolvedValue(undefined),
        options: {
            getString: jest.fn(),
            getInteger: jest.fn(),
            getBoolean: jest.fn(),
            getUser: jest.fn(),
            getMember: jest.fn(),
            getChannel: jest.fn(),
            getRole: jest.fn(),
            get: jest.fn(),
            data: [],
        } as any,
    } as unknown as jest.Mocked<CommandInteraction>;

    // Hacer que instanceof CommandInteraction funcione
    Object.setPrototypeOf(interaction, CommandInteraction.prototype);

    return interaction;
}
