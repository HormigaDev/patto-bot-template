import { LocaleStore } from './store/locale.store';
import { DEFAULT_LOCALE, I18N_ENABLED, normalizeLocale, SupportedLocale } from './types';

/**
 * Datos mínimos necesarios para resolver el locale de una petición.
 *
 * Se separan en una interfaz explícita para que el resolver no dependa
 * de tipos de discord.js: facilita los tests y permite reusarlo desde
 * cualquier punto de entrada (slash commands, prefix commands, jobs,
 * etc.).
 */
export interface ResolveLocaleInput {
    /**
     * ID del servidor (guild). Si no se proporciona —p.ej. invocación
     * desde DMs— el resolver salta directamente al locale de Discord
     * o al default.
     */
    guildId?: string;
    /**
     * Locale de Discord (`interaction.locale`, ej. `'es-ES'`, `'pt-BR'`).
     * Se acepta cualquier string: el resolver intenta normalizarlo y lo
     * descarta si no encaja con un idioma soportado.
     */
    discordLocale?: string;
}

/**
 * Resuelve el locale efectivo de una petición.
 *
 * Cadena de precedencia (la primera fuente con valor válido gana):
 *
 * 1. **Preferencia explícita del servidor** (del {@link LocaleStore}).
 *    Es lo que cambia el comando `/setlocale`. La preferencia es global
 *    al servidor: todos los miembros ven al bot en el mismo idioma.
 * 2. **Locale de Discord** que viene con la interacción
 *    (`interaction.locale`). Útil como detección inicial: el servidor
 *    aún no configuró nada, pero Discord conoce el idioma del cliente.
 * 3. **Default** ({@link DEFAULT_LOCALE}).
 *
 * Esta resolución se hace **una vez por petición** y se inyecta en
 * `CommandContext.locale`, evitando lookups repetidos durante la
 * ejecución.
 */
export class LocaleResolver {
    constructor(private readonly store: LocaleStore) {}

    public async resolve(input: ResolveLocaleInput): Promise<SupportedLocale> {
        if (!I18N_ENABLED) return DEFAULT_LOCALE;

        if (input.guildId) {
            const explicit = await this.store.getGuildLocale(input.guildId);
            if (explicit) return explicit;
        }

        const fromDiscord = normalizeLocale(input.discordLocale);
        if (fromDiscord) return fromDiscord;

        return DEFAULT_LOCALE;
    }
}
