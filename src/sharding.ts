/**
 * Entry point para modo sharding (ShardingManager).
 *
 * Usar este archivo cuando el bot supere los 2.500 servidores y se necesite
 * distribuir la carga entre múltiples shards de Discord.
 *
 * Requiere SHARDING_ENABLED=true y REDIS_URL en el entorno.
 *
 * Producción:  npm run start:sharding
 * Desarrollo:  npm run dev:sharding
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { Env } from '@/utils/Env';

dotenv.config({ override: true });
Env.load();

import { ShardingManager } from 'discord.js';
import { logger } from '@/utils/Logger';
import * as path from 'path';

const log = logger.child('ShardingManager');
const config = Env.get();

// En desarrollo (ts-node), __filename termina en .ts y se apunta al fuente.
// En producción (compilado), __filename termina en .js y se apunta al dist.
const isTypeScript = __filename.endsWith('.ts');

const workerFile = isTypeScript
    ? path.resolve(__dirname, 'index.ts')
    : path.resolve(__dirname, 'index.js');

const execArgv = isTypeScript
    ? ['-r', 'ts-node/register/transpile-only', '-r', 'tsconfig-paths/register']
    : [];

const manager = new ShardingManager(workerFile, {
    token: config.BOT_TOKEN,
    totalShards: config.TOTAL_SHARDS,
    respawn: true,
    ...(execArgv.length > 0 && { execArgv }),
});

manager.on('shardCreate', (shard) => {
    log.info(`Shard ${shard.id} lanzado\n\n`);

    shard.on('ready', () => log.info(`Shard ${shard.id} listo`));
    shard.on('disconnect', () => log.warn(`Shard ${shard.id} desconectado`));
    shard.on('reconnecting', () => log.info(`Shard ${shard.id} reconectando...`));
    shard.on('death', () => log.error(`Shard ${shard.id} terminó inesperadamente`));
});

manager.spawn().catch((error) => {
    log.fatal('Error crítico al lanzar shards', error);
    process.exit(1);
});
