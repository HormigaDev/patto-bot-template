/**
 * Tipos base del subsistema de i18n.
 *
 * Aquí se declara qué idiomas soporta el bot y cuál es el idioma de
 * referencia (la "fuente de verdad" sobre la que se modelan los demás).
 *
 * ## Agregar un nuevo idioma
 *
 * 1. Añade el código ISO 639-1 al tuple `SUPPORTED_LOCALES` (en minúsculas).
 * 2. Crea `src/i18n/locale/<locale>.ts` tipado contra `typeof es` para que
 *    el compilador exija todas las claves.
 * 3. Registra el nuevo bundle en `src/i18n/translator.ts` para que
 *    `i18n.for(locale)` pueda resolverlo en runtime.
 */

export const SUPPORTED_LOCALES = ['es', 'en', 'pt'] as const;

/**
 * Interruptor central de i18n. Para un bot monolingüe, deja
 * `SUPPORTED_LOCALES` con un solo idioma: el resolver caerá siempre al
 * default y el registro slash no enviará localizaciones a Discord.
 */
export const I18N_ENABLED = SUPPORTED_LOCALES.length > 1;

/**
 * Locales soportados por el bot. El nombre coincide con el código ISO 639-1.
 */
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Idioma de referencia ("fuente de verdad" de las claves). Todos los demás
 * idiomas extienden este conjunto mediante `typeof` para garantizar paridad.
 *
 * También es el fallback cuando un locale no tiene traducción disponible.
 */
export const DEFAULT_LOCALE: SupportedLocale = 'es';

/**
 * Type-guard para validar valores externos (input del usuario, env vars,
 * locales de Discord, etc.) antes de tratarlos como `SupportedLocale`.
 */
export function isSupportedLocale(value: unknown): value is SupportedLocale {
    return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Normaliza un locale arbitrario al formato soportado por el bot.
 *
 * Acepta variantes regionales (`es-ES`, `pt-BR`, `en-US`, etc.) y devuelve
 * el código base si está soportado. Devuelve `null` cuando el idioma no
 * encaja con ninguno de los soportados.
 */
export function normalizeLocale(raw: string | undefined | null): SupportedLocale | null {
    if (!raw) return null;
    const base = raw.toLowerCase().split('-')[0];
    return isSupportedLocale(base) ? base : null;
}
