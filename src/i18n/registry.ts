import { LocaleResolver } from './locale.resolver';
import { LocaleStore, MemoryLocaleStore } from './store/locale.store';

/**
 * Registro estático del subsistema de i18n.
 *
 * Sigue el mismo patrón que {@link StoreRegistry} y {@link PluginRegistry}:
 * el store y el resolver se configuran una sola vez durante el arranque y
 * permanecen inmutables durante el resto del ciclo de vida del proceso.
 *
 * Por defecto se usa {@link MemoryLocaleStore}. Para producción con
 * sharding o multi-instancia, registrar un store compartido **antes** de
 * que el bot empiece a manejar peticiones (idealmente en `index.ts`,
 * antes de importar `Bot`).
 *
 * @example Reemplazar el store en `src/index.ts`
 * ```ts
 * import { LocaleRegistry } from '@/i18n';
 * import { RedisLocaleStore } from './my-redis-locale-store';
 *
 * LocaleRegistry.useStore(new RedisLocaleStore(redis));
 * ```
 */
export class LocaleRegistry {
    private static _store: LocaleStore = new MemoryLocaleStore();
    private static _resolver: LocaleResolver = new LocaleResolver(LocaleRegistry._store);

    /**
     * Reemplaza el store de preferencias. Reconstruye el resolver para que
     * use el nuevo store. Llamar al inicio del proceso.
     */
    public static useStore(store: LocaleStore): void {
        this._store = store;
        this._resolver = new LocaleResolver(store);
    }

    public static getStore(): LocaleStore {
        return this._store;
    }

    public static getResolver(): LocaleResolver {
        return this._resolver;
    }

    /**
     * Restablece el registro a su estado por defecto.
     * Pensado para tests: no debería usarse en producción.
     */
    public static reset(): void {
        this._store = new MemoryLocaleStore();
        this._resolver = new LocaleResolver(this._store);
    }
}
