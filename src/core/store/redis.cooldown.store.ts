import type { Redis } from 'ioredis';
import type { CooldownStore } from './cooldown.store';

/**
 * Implementación de {@link CooldownStore} respaldada por Redis.
 *
 * Diseñada para producción con sharding, donde los cooldowns deben aplicarse
 * de forma global independientemente del shard que atienda la solicitud.
 *
 * Todas las claves se almacenan con el prefijo `patto:cooldown:` para evitar
 * colisiones con otras aplicaciones que compartan la misma instancia de Redis.
 * El TTL de cada clave se calcula automáticamente a partir del timestamp de
 * expiración para que Redis limpie las entradas sin intervención manual.
 *
 * @example Configurar en index.ts (antes de importar Bot)
 * ```ts
 * const redis = new Redis(config.REDIS_URL);
 * StoreRegistry.useCooldownStore(new RedisCooldownStore(redis));
 * ```
 */
export class RedisCooldownStore implements CooldownStore {
    private static readonly KEY_PREFIX = 'patto:cooldown:';

    constructor(private readonly client: Redis) {}

    private buildKey(key: string): string {
        return `${RedisCooldownStore.KEY_PREFIX}${key}`;
    }

    public async get(key: string): Promise<number | undefined> {
        const value = await this.client.get(this.buildKey(key));
        if (value === null) return undefined;
        return parseInt(value, 10);
    }

    public async set(key: string, expiry: number): Promise<void> {
        const ttlMs = expiry - Date.now();
        if (ttlMs <= 0) return;
        // Almacena el timestamp y lo hace expirar automáticamente en Redis
        await this.client.set(this.buildKey(key), String(expiry), 'PX', ttlMs);
    }

    public async delete(key: string): Promise<void> {
        await this.client.del(this.buildKey(key));
    }
}
