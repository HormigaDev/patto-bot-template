import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { Bot } from './bot';
import { Env } from '@/utils/Env';

dotenv.config();

// Validar y cargar configuración
Env.load();

// Iniciar el bot
const bot = new Bot();
bot.start();
