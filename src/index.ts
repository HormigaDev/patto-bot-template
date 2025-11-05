import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { Bot } from './bot';

dotenv.config();

const REQUIRED_ENV_VARS = ['BOT_TOKEN', 'CLIENT_ID'];

const missingVars = REQUIRED_ENV_VARS.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
    console.error(
        `Error: Variable(s) de entorno OBRIGATORIAS faltantes: ${missingVars.join(', ')}`,
    );
    process.exit(1);
}

// Validar USE_MESSAGE_CONTENT si está presente
if (process.env.USE_MESSAGE_CONTENT) {
    const normalized = process.env.USE_MESSAGE_CONTENT.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    if (normalized !== 'yes') {
        console.warn(
            `⚠️  USE_MESSAGE_CONTENT='${process.env.USE_MESSAGE_CONTENT}' no es válido. ` +
                `Use 'yes' para habilitar comandos de texto.`,
        );
    }
}

// Iniciar el bot
const bot = new Bot();
bot.start();
