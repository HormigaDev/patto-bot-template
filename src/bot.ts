import { Client, GatewayIntentBits } from 'discord.js';
import { CommandLoader } from '@/core/loaders/command.loader';
import { SlashCommandLoader } from '@/core/loaders/slash-command.loader';
import { CommandHandler } from '@/core/handlers/command.handler';
import { registerInteractionCreateEvent } from '@/events/interactionCreate.event';
import { registerMessageCreateEvent } from '@/events/messageCreate.event';
import { registerReadyEvent } from '@/events/ready.event';
import { Env } from '@/utils/Env';
import '@/config/plugins.config';

export class Bot {
    private client: Client;
    private commandLoader: CommandLoader;
    private slashCommandLoader: SlashCommandLoader;
    private commandHandler: CommandHandler;

    constructor() {
        const config = Env.get();

        // Determinar intents
        let intents: any;

        if (config.INTENTS !== undefined) {
            // Usar intents personalizados
            intents = config.INTENTS;
        } else {
            // Intents automáticos según configuración
            intents = [GatewayIntentBits.Guilds] as number[];

            if (config.USE_MESSAGE_CONTENT) {
                intents.push(GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent);
            }
        }

        this.client = new Client({
            intents,
        });

        this.commandLoader = new CommandLoader();
        this.slashCommandLoader = new SlashCommandLoader(this.client, this.commandLoader);
        this.commandHandler = new CommandHandler();
    }

    /**
     * Inicia el bot
     */
    async start(): Promise<void> {
        const config = Env.get();

        try {
            await this.commandLoader.loadCommands();

            this.registerEvents();

            await this.client.login(config.BOT_TOKEN);
        } catch (error) {
            console.error('❌ Error al iniciar el bot:', error);
            process.exit(1);
        }
    }

    /**
     * Registra todos los eventos del bot
     */
    private registerEvents(): void {
        const readyEvent = registerReadyEvent(this.slashCommandLoader);
        this.client.once(readyEvent.name as any, readyEvent.execute);

        const interactionEvent = registerInteractionCreateEvent(
            this.commandLoader,
            this.commandHandler,
        );
        this.client.on(interactionEvent.name as any, interactionEvent.execute);
        const config = Env.get();
        // Solo registrar evento de mensajes si USE_MESSAGE_CONTENT está habilitado
        if (config.USE_MESSAGE_CONTENT) {
            const messageEvent = registerMessageCreateEvent(
                this.commandLoader,
                this.commandHandler,
            );
            this.client.on(messageEvent.name as any, messageEvent.execute);
            console.log('✅ Comandos de texto habilitados (USE_MESSAGE_CONTENT=Yes)');
        } else {
            console.log(
                '⚠️  Comandos de texto deshabilitados (USE_MESSAGE_CONTENT no está configurado como Yes)',
            );
        }
    }

    /**
     * Obtiene el cliente de Discord
     */
    getClient(): Client {
        return this.client;
    }
}
