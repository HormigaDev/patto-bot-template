import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { Logger } from '@/utils/Logger';
import { Env } from '@/utils/Env';

dotenv.config({ override: true });

// Discord.js ShardingManager inyecta SHARDS=JSON([id,...]) en cada proceso
// worker. Configurar el ID antes de Env.load() garantiza que TODOS los logs
// posteriores (incluyendo los de arranque) ya muestren el tag [SHARD X].
if (process.env.SHARDS) {
    Logger.setShardId(process.env.SHARDS);
}

Env.load();

async function bootstrap(): Promise<void> {
    const config = Env.get();

    if (config.SHARDING_ENABLED && config.REDIS_URL) {
        // Importaciones dinámicas para garantizar que los stores queden
        // configurados ANTES de que bot.ts evalúe plugins.config (side-effect).
        const { default: Redis } = await import('ioredis');
        const { RedisPayloadStore } = await import('@/core/store/redis.payload.store');
        const { RedisCooldownStore } = await import('@/core/store/redis.cooldown.store');
        const { ComponentRegistry } = await import('@/core/registry/component.registry');
        const { StoreRegistry } = await import('@/core/store/store.registry');
        const { logger } = await import('@/utils/Logger');

        const log = logger.child('Bootstrap');

        const redis = new Redis(config.REDIS_URL);

        try {
            await redis.ping();
            log.info('Conexión a Redis establecida');
        } catch (error) {
            log.fatal('No se pudo conectar a Redis. Verifica REDIS_URL en tu .env', error);
            process.exit(1);
        }

        ComponentRegistry.useStore(new RedisPayloadStore(redis));
        StoreRegistry.useCooldownStore(new RedisCooldownStore(redis));
    }

    // Importación dinámica de Bot para que plugins.config se ejecute
    // después de que los stores estén configurados.
    const { Bot } = await import('./bot');
    const bot = new Bot();
    await bot.start();
}

bootstrap().catch((error) => {
    console.error('Error fatal al iniciar el bot:', error);
    process.exit(1);
});
