/**
 * Contrato para almacenar y recuperar expiraciones de cooldown por clave.
 *
 * Implementaciones disponibles:
 * - {@link MemoryCooldownStore}: almacenamiento en memoria. Adecuado para
 *   bots single-instance o desarrollo.
 *
 * Implementaciones que se pueden agregar respetando este contrato:
 * - Redis (recomendado para producción con sharding)
 * - Cualquier otro KV store distribuido
 */
export interface CooldownStore {
    /**
     * Recupera el timestamp de expiración del cooldown para la clave dada.
     * @returns Timestamp en milisegundos, o `undefined` si no existe / ya expiró.
     */
    get(key: string): Promise<number | undefined>;

    /**
     * Guarda el timestamp de expiración del cooldown para la clave dada.
     * @param key   Clave única del cooldown (ej. `userId-commandId`)
     * @param expiry Timestamp de expiración en milisegundos (Date.now() + cooldownMs)
     */
    set(key: string, expiry: number): Promise<void>;

    /**
     * Elimina el cooldown para la clave dada.
     */
    delete(key: string): Promise<void>;
}

/**
 * Implementación en memoria de {@link CooldownStore}.
 *
 * Adecuada para bots single-instance o entornos de desarrollo.
 * Para producción con sharding usar {@link RedisCooldownStore}.
 */
export class MemoryCooldownStore implements CooldownStore {
    private readonly cooldowns = new Map<string, number>();

    public async get(key: string): Promise<number | undefined> {
        return this.cooldowns.get(key);
    }

    public async set(key: string, expiry: number): Promise<void> {
        this.cooldowns.set(key, expiry);
    }

    public async delete(key: string): Promise<void> {
        this.cooldowns.delete(key);
    }
}
