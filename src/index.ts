import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { Env } from '@/utils/Env';
dotenv.config({ override: true });
Env.load();

import { Bot } from './bot';

// Iniciar el bot
const bot = new Bot();
bot.start();
