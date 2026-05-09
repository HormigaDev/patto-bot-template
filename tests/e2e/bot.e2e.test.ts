/**
 * Tests end-to-end del bot de Discord.
 * Verifican el flujo completo usando mocks en lugar de una conexión real a Discord.
 */

import 'reflect-metadata';

// Mockear Env antes de cualquier import que lo use a nivel de módulo
// (messageCreate.event.ts llama a getPrefix() → Env.get() al cargar el módulo)
jest.mock('@/utils/Env', () => ({
    Env: {
        get: jest.fn().mockReturnValue({
            BOT_TOKEN: 'test-bot-token',
            CLIENT_ID: 'test-client-id',
            USE_MESSAGE_CONTENT: true,
            COMMAND_PREFIX: '!',
            LOG_LEVEL: 0,
            SHARDING_ENABLED: false,
            TOTAL_SHARDS: 'auto',
        }),
        load: jest.fn(),
    },
}));

import { Collection } from 'discord.js';
import { Bot } from '@/bot';
import { Env } from '@/utils/Env';
import { CommandHandler } from '@/core/handlers/command.handler';
import { CommandLoader } from '@/core/loaders/command.loader';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { BasePlugin } from '@/core/structures/BasePlugin';
import { ValidationError } from '@/error/ValidationError';
import { registerInteractionCreateEvent } from '@/events/interactionCreate.event';
import { registerMessageCreateEvent } from '@/events/messageCreate.event';
import { PluginRegistry, PluginScope } from '@/config/plugin.registry';
import { MetadataStore } from '@/core/metadata/metadata.store';
import { Category } from '@/utils/CommandCategories';
import {
    createMockMessage,
    createMockInteraction,
    createMockGuild,
} from '@tests/mocks/discord.mock';

// ─────────────────────────────────────────────────────────────────────────────
// Config de entorno reutilizable
// ─────────────────────────────────────────────────────────────────────────────

const mockEnvConfig = {
    BOT_TOKEN: 'test-bot-token',
    CLIENT_ID: 'test-client-id',
    USE_MESSAGE_CONTENT: true,
    COMMAND_PREFIX: '!',
    LOG_LEVEL: 0,
    SHARDING_ENABLED: false,
    TOTAL_SHARDS: 'auto' as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Guild mock con members.me y permisos de SendMessages */
function createGuildWithPermissions() {
    const guild = createMockGuild();
    (guild as any).members = {
        cache: new Collection(),
        fetch: jest.fn(),
        me: {
            permissions: {
                has: jest.fn().mockReturnValue(true),
            },
        },
    };
    return guild;
}

/** Interaction de tipo ChatInputCommand lista para el event handler */
function createSlashInteraction(commandName: string = 'test') {
    const interaction = createMockInteraction(commandName);
    (interaction as any).guild = createGuildWithPermissions();
    (interaction as any).isChatInputCommand = jest.fn().mockReturnValue(true);
    (interaction as any).isButton = jest.fn().mockReturnValue(false);
    (interaction as any).isStringSelectMenu = jest.fn().mockReturnValue(false);
    (interaction as any).isModalSubmit = jest.fn().mockReturnValue(false);
    (interaction as any).isRepliable = jest.fn().mockReturnValue(true);
    (interaction as any).options.getSubcommandGroup = jest.fn().mockReturnValue(null);
    (interaction as any).options.getSubcommand = jest.fn().mockReturnValue(null);
    return interaction;
}

/** Entrada de comando mock para inyectar en CommandLoader */
function createCommandEntry(name: string) {
    class MockCommand extends BaseCommand {
        async run() {
            await this.reply('Response');
        }
    }
    return {
        class: MockCommand,
        path: `mock/${name}`,
        category: Category.Other,
        metadata: { type: 'command' as const, meta: { name, description: 'Test command' } },
        key: name,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Setup global: restaurar Env.get tras resetMocks y limpiar registros
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
    (Env.get as jest.Mock).mockReturnValue(mockEnvConfig);
    PluginRegistry.clear();
    MetadataStore.clear();
});

// ─────────────────────────────────────────────────────────────────────────────
// E2E: Ciclo de vida del Bot
// ─────────────────────────────────────────────────────────────────────────────

describe('E2E: Ciclo de vida del Bot', () => {
    it('debería iniciar el bot exitosamente', async () => {
        jest.spyOn(CommandLoader.prototype, 'loadCommands').mockResolvedValue();

        const bot = new Bot();
        const client = bot.getClient();

        jest.spyOn(client, 'login').mockResolvedValue('token');
        jest.spyOn(client, 'on').mockReturnValue(client as any);
        jest.spyOn(client, 'once').mockReturnValue(client as any);

        await bot.start();

        // loadCommands y login se invocan durante el arranque
        expect(CommandLoader.prototype.loadCommands).toHaveBeenCalled();
        expect(client.login).toHaveBeenCalledWith('test-bot-token');

        // Un evento con once (ready) y dos con on (interactionCreate + messageCreate)
        // porque USE_MESSAGE_CONTENT=true en el config de prueba
        expect(client.once).toHaveBeenCalledTimes(1);
        expect(client.on).toHaveBeenCalledTimes(2);
    });

    it('debería responder a slash commands', async () => {
        const commandLoader = new CommandLoader();
        const commandHandler = new CommandHandler();
        const entry = createCommandEntry('ping');

        jest.spyOn(commandLoader, 'getCommandEntry').mockReturnValue(entry);
        jest.spyOn(commandHandler, 'executeCommand').mockResolvedValue();

        const { execute } = registerInteractionCreateEvent(commandLoader, commandHandler);
        const interaction = createSlashInteraction('ping');

        await execute(interaction as any);

        // El event handler debe resolver la entrada del comando y delegarla al handler
        expect(commandLoader.getCommandEntry).toHaveBeenCalledWith('ping');
        expect(commandHandler.executeCommand).toHaveBeenCalledWith(
            interaction,
            entry.class,
            commandLoader,
            'ping',
            undefined,
            entry.path,
        );
    });

    it('debería manejar comandos de texto', async () => {
        const commandLoader = new CommandLoader();
        const commandHandler = new CommandHandler();
        const entry = createCommandEntry('ping');

        jest.spyOn(commandLoader, 'getCommandEntry').mockReturnValue(entry);
        jest.spyOn(commandHandler, 'executeCommand').mockResolvedValue();

        const { execute } = registerMessageCreateEvent(commandLoader, commandHandler);

        const message = createMockMessage('!ping');
        (message as any).guild = createGuildWithPermissions();

        await execute(message as any);

        // El mensaje con prefijo correcto debe llegar al handler de comandos
        expect(commandLoader.getCommandEntry).toHaveBeenCalled();
        expect(commandHandler.executeCommand).toHaveBeenCalled();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// E2E: Flujo de ejecución de comandos
// ─────────────────────────────────────────────────────────────────────────────

describe('E2E: Flujo de ejecución de comandos', () => {
    it('debería ejecutar el ciclo de vida completo de un comando', async () => {
        const callOrder: string[] = [];

        class LifecyclePlugin extends BasePlugin {
            async onBeforeExecute(): Promise<boolean> {
                callOrder.push('onBeforeExecute');
                return true;
            }

            async onAfterExecute(): Promise<void> {
                callOrder.push('onAfterExecute');
            }
        }

        class LifecycleCommand extends BaseCommand {
            async run(): Promise<void> {
                callOrder.push('run');
                await this.reply('Executed!');
            }
        }

        PluginRegistry.register({
            plugin: new LifecyclePlugin(),
            scope: PluginScope.Specified,
            commands: [LifecycleCommand],
        });

        const interaction = createSlashInteraction('lifecycle');

        await new CommandHandler().executeCommand(
            interaction as any,
            LifecycleCommand,
            new CommandLoader(),
            'lifecycle',
            undefined,
            'test/lifecycle',
        );

        // El ciclo completo debe respetar el orden: before → run → after
        expect(callOrder).toEqual(['onBeforeExecute', 'run', 'onAfterExecute']);
        expect(interaction.reply).toHaveBeenCalled();
    });

    it('debería manejar errores de forma elegante', async () => {
        class BrokenCommand extends BaseCommand {
            async run(): Promise<void> {
                throw new ValidationError('Campo requerido faltante');
            }
        }

        const interaction = createSlashInteraction('broken');

        // El handler no debe propagar el error: lo captura y responde con un embed
        await expect(
            new CommandHandler().executeCommand(
                interaction as any,
                BrokenCommand,
                new CommandLoader(),
                'broken',
                undefined,
                'test/broken',
            ),
        ).resolves.not.toThrow();

        // El usuario debe recibir un embed de error en lugar de un crash
        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: expect.arrayContaining([expect.any(Object)]),
            }),
        );
    });
});
