import { MemoryCooldownStore, type CooldownStore } from './cooldown.store';

/**
 * Registro centralizado de implementaciones de stores configurables.
 *
 * Sigue el mismo patrón estático que {@link ComponentRegistry} y
 * {@link PluginRegistry}: se configura una vez al arranque del proceso y
 * permanece inmutable durante el resto del ciclo de vida.
 *
 * Por defecto usa implementaciones en memoria. Cuando el sharding está
 * habilitado, `index.ts` reemplaza las implementaciones por sus equivalentes
 * de Redis antes de que `plugins.config.ts` sea evaluado.
 *
 * @example Configurar Redis en index.ts (antes de importar Bot)
 * ```ts
 * StoreRegistry.useCooldownStore(new RedisCooldownStore(redis));
 * ```
 *
 * @example Leer en plugins.config.ts
 * ```ts
 * new CooldownPlugin(StoreRegistry.getCooldownStore())
 * ```
 */
export class StoreRegistry {
    private static _cooldownStore: CooldownStore = new MemoryCooldownStore();

    /**
     * Reemplaza el store de cooldowns. Llamar al inicio del proceso,
     * antes de que `plugins.config.ts` instancie los plugins.
     */
    public static useCooldownStore(store: CooldownStore): void {
        this._cooldownStore = store;
    }

    /**
     * Devuelve el store de cooldowns configurado (memoria por defecto).
     */
    public static getCooldownStore(): CooldownStore {
        return this._cooldownStore;
    }
}
