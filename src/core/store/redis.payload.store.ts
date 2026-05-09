import type { Redis } from 'ioredis';
import type { PayloadStore } from './payload.store';

/**
 * Implementación de {@link PayloadStore} respaldada por Redis.
 *
 * Diseñada para producción con sharding, donde los payloads de componentes
 * interactivos deben ser accesibles desde cualquier shard.
 *
 * Todas las claves se almacenan con el prefijo `patto:payload:` para evitar
 * colisiones con otras aplicaciones que compartan la misma instancia de Redis.
 *
 * @example Configurar en index.ts (antes de importar Bot)
 * ```ts
 * const redis = new Redis(config.REDIS_URL);
 * ComponentRegistry.useStore(new RedisPayloadStore(redis));
 * ```
 */
export class RedisPayloadStore implements PayloadStore {
    private static readonly KEY_PREFIX = 'patto:payload:';

    constructor(private readonly client: Redis) {}

    private buildKey(id: string): string {
        return `${RedisPayloadStore.KEY_PREFIX}${id}`;
    }

    public async set(id: string, payload: unknown, ttlMs?: number): Promise<void> {
        const key = this.buildKey(id);
        const serialized = JSON.stringify(payload);

        if (ttlMs && ttlMs > 0) {
            await this.client.set(key, serialized, 'PX', ttlMs);
        } else {
            await this.client.set(key, serialized);
        }
    }

    public async get<T = unknown>(id: string): Promise<T | undefined> {
        const value = await this.client.get(this.buildKey(id));
        if (value === null) return undefined;
        return JSON.parse(value) as T;
    }

    public async delete(id: string): Promise<void> {
        await this.client.del(this.buildKey(id));
    }

    public async has(id: string): Promise<boolean> {
        return (await this.client.exists(this.buildKey(id))) === 1;
    }
}
