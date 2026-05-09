/**
 * Contrato para almacenar y recuperar payloads de componentes interactivos
 *
 * Esta abstracción permite que el sistema de componentes guarde payloads
 * (datos serializables) en lugar de funciones (closures), reduciendo
 * drásticamente el uso de memoria RAM.
 *
 * Implementaciones disponibles:
 * - {@link MemoryPayloadStore}: almacenamiento en memoria con TTL por entrada.
 *
 * Implementaciones que se pueden agregar respetando este contrato:
 * - Redis (recomendado para producción multi-instancia)
 * - MongoDB
 * - Cualquier otro KV store
 *
 * @example Implementación custom
 * ```ts
 * class RedisPayloadStore implements PayloadStore {
 *     async set(id: string, payload: unknown, ttlMs?: number) { ... }
 *     async get<T>(id: string) { ... }
 *     async delete(id: string) { ... }
 *     async has(id: string) { ... }
 * }
 *
 * ComponentRegistry.useStore(new RedisPayloadStore());
 * ```
 */
export interface PayloadStore {
    /**
     * Guarda un payload bajo un id
     * @param id Identificador único del componente
     * @param payload Datos a guardar (cualquier valor serializable, incluyendo null/false)
     * @param ttlMs TTL en milisegundos. Si no se define, el payload no expira por sí solo.
     */
    set(id: string, payload: unknown, ttlMs?: number): Promise<void>;

    /**
     * Recupera un payload por su id
     * @returns El payload si existe, o `undefined` si no existe / expiró.
     *          IMPORTANTE: `null`, `false`, `0`, `''` son valores válidos.
     *          Solo `undefined` indica ausencia.
     */
    get<T = unknown>(id: string): Promise<T | undefined>;

    /**
     * Elimina un payload por su id
     */
    delete(id: string): Promise<void>;

    /**
     * Verifica si existe un payload bajo el id
     */
    has(id: string): Promise<boolean>;
}

/**
 * Implementación en memoria de {@link PayloadStore}
 *
 * Soporta TTL por entrada mediante `setTimeout`. Adecuada para bots
 * single-instance o desarrollo. Para producción con múltiples instancias
 * usar una implementación basada en Redis u otro store distribuido.
 */
export class MemoryPayloadStore implements PayloadStore {
    private payloads = new Map<string, unknown>();
    private timers = new Map<string, NodeJS.Timeout>();

    public async set(id: string, payload: unknown, ttlMs?: number): Promise<void> {
        // Limpiar TTL previo si existía
        const previous = this.timers.get(id);
        if (previous) {
            clearTimeout(previous);
            this.timers.delete(id);
        }

        this.payloads.set(id, payload);

        if (ttlMs && ttlMs > 0) {
            const timer = setTimeout(() => {
                this.payloads.delete(id);
                this.timers.delete(id);
            }, ttlMs);
            this.timers.set(id, timer);
        }
    }

    public async get<T = unknown>(id: string): Promise<T | undefined> {
        if (!this.payloads.has(id)) {
            return undefined;
        }
        return this.payloads.get(id) as T;
    }

    public async delete(id: string): Promise<void> {
        const timer = this.timers.get(id);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(id);
        }
        this.payloads.delete(id);
    }

    public async has(id: string): Promise<boolean> {
        return this.payloads.has(id);
    }

    /**
     * Limpia todos los payloads y timers (útil para tests / shutdown)
     */
    public clear(): void {
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.timers.clear();
        this.payloads.clear();
    }

    /**
     * Cantidad de payloads almacenados
     */
    public size(): number {
        return this.payloads.size;
    }
}
