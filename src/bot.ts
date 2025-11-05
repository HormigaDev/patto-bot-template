import { Client, GatewayIntentBits } from 'discord.js';
import { CommandLoader } from '@/core/loaders/command.loader';
import { SlashCommandLoader } from '@/core/loaders/slash-command.loader';
import { CommandHandler } from '@/core/handlers/command.handler';
import { registerInteractionCreateEvent } from '@/events/interactionCreate.event';
import { registerMessageCreateEvent } from '@/events/messageCreate.event';
import { registerReadyEvent } from '@/events/ready.event';
import '@/config/plugins.config';

export class Bot {
    private client: Client;
    private commandLoader: CommandLoader;
    private slashCommandLoader: SlashCommandLoader;
    private commandHandler: CommandHandler;

    /**
     * Verifica si el bot debe procesar mensajes de texto
     * Acepta: yes, yés, yês (insensible a mayúsculas y acentos unicode)
     */
    private static shouldUseMessageContent(): boolean {
        const value = process.env.USE_MESSAGE_CONTENT;
        if (!value) return false;

        // Normalizar: remover acentos y convertir a minúsculas
        const normalized = value
            .normalize('NFD') // Descomponer caracteres con acentos
            .replace(/[\u0300-\u036f]/g, '') // Remover marcas diacríticas
            .toLowerCase()
            .trim();

        return normalized === 'yes';
    }

    constructor() {
        let intents: any = process.env.INTENTS;
        if (!intents || isNaN(parseInt(intents))) {
            // Intents por defecto
            intents = [GatewayIntentBits.Guilds] as number[];

            // Solo agregar intents de mensajes si USE_MESSAGE_CONTENT está habilitado
            if (Bot.shouldUseMessageContent()) {
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
        try {
            await this.commandLoader.loadCommands();

            this.registerEvents();

            await this.client.login(process.env.BOT_TOKEN);
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

        // Solo registrar evento de mensajes si USE_MESSAGE_CONTENT está habilitado
        if (Bot.shouldUseMessageContent()) {
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
