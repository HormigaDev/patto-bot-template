import type { SupportedLocale } from '../types';

/**
 * Contrato para persistir la preferencia de idioma **por servidor (guild)**.
 *
 * El idioma es una configuración global del servidor: cualquier miembro
 * del servidor ve las respuestas del bot en el mismo idioma. Esto evita
 * que dos usuarios del mismo canal lean mensajes en idiomas diferentes
 * en el mismo hilo de conversación (especialmente importante para los
 * embeds compartidos: encuestas, paneles, modales, etc.).
 *
 * Implementaciones disponibles:
 * - {@link MemoryLocaleStore}: válida para bots single-instance o
 *   desarrollo.
 *
 * Implementaciones que pueden añadirse respetando este contrato:
 * - Redis (recomendado para sharding o multi-instancia).
 * - Base de datos relacional, KV store distribuido, etc.
 *
 * El subsistema i18n no impone TTL: la preferencia se considera
 * permanente hasta que el servidor la cambie o elimine.
 */
export interface LocaleStore {
    /**
     * Devuelve el locale guardado para el servidor, o `undefined` si
     * nunca fijó uno. El resolver caerá al locale de Discord o al default.
     */
    getGuildLocale(guildId: string): Promise<SupportedLocale | undefined>;

    /**
     * Guarda (o sobreescribe) la preferencia de idioma del servidor.
     */
    setGuildLocale(guildId: string, locale: SupportedLocale): Promise<void>;

    /**
     * Elimina la preferencia explícita del servidor. Tras esta llamada,
     * el resolver volverá a inferir el locale desde Discord/default.
     */
    deleteGuildLocale(guildId: string): Promise<void>;
}

/**
 * Implementación en memoria de {@link LocaleStore}.
 *
 * Adecuada para bots single-instance o entornos de desarrollo y tests.
 * Para producción con sharding/multi-instancia, implementar un store
 * compartido (Redis, BD) y registrarlo vía `LocaleRegistry.useStore(...)`.
 */
export class MemoryLocaleStore implements LocaleStore {
    private readonly preferences = new Map<string, SupportedLocale>();

    public async getGuildLocale(guildId: string): Promise<SupportedLocale | undefined> {
        return this.preferences.get(guildId);
    }

    public async setGuildLocale(guildId: string, locale: SupportedLocale): Promise<void> {
        this.preferences.set(guildId, locale);
    }

    public async deleteGuildLocale(guildId: string): Promise<void> {
        this.preferences.delete(guildId);
    }

    /**
     * Limpia todos los registros (solo para tests y mantenimiento manual;
     * no forma parte del contrato público de {@link LocaleStore}).
     */
    public clear(): void {
        this.preferences.clear();
    }
}
