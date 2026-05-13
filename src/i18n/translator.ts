import { DEFAULT_LOCALE, type SupportedLocale } from './types';
import { es } from './locale/es';
import { en } from './locale/en';
import { pt } from './locale/pt';

/**
 * Catálogo de mensajes (tipo del idioma base). Cada clave es un string
 * en notación de puntos (`'<dominio>.<seccion>.<mensaje>'`) cuyo valor
 * es:
 *
 * - Un `string` literal (mensaje fijo), o
 * - Una función `(...args) => string` (mensaje con interpolación
 *   tipada). TypeScript valida en cada llamada que se pasen los
 *   argumentos correctos.
 *
 * `Bundle` se infiere automáticamente de `es.ts`. `en.ts` y `pt.ts` se
 * tipan como `typeof es`, garantizando paridad estructural en compile
 * time.
 */
export type Bundle = typeof es;

/**
 * Conjunto exhaustivo de claves de traducción.
 *
 * `keyof Bundle` se resuelve a la unión de todas las claves declaradas
 * en `es.ts`, así que `TFn` solo acepta claves que existen y
 * `TFn(key, ...)` tipa los argumentos según el valor de esa clave.
 */
export type TranslationKey = keyof Bundle;

/**
 * Argumentos esperados por una clave concreta. Si el valor es una
 * función `(a, b) => string`, son `[a, b]`. Si es un `string`, son `[]`
 * (la llamada no acepta argumentos extra).
 */
type ArgsFor<K extends TranslationKey> = Bundle[K] extends (...a: infer A) => string ? A : [];

/**
 * Firma de la función traductora.
 *
 * Es **el único punto de acceso** que comandos, plugins e infraestructura
 * usan para traducir. `BaseCommand.t` y `CommandContext.t` la exponen
 * cacheada por petición; los handlers estáticos la obtienen con
 * `i18n.for(locale)` donde `locale` se resuelve con
 * `resolveLocaleFromInteraction`.
 *
 * @example
 * ```ts
 * this.t('ping.response.title');          // 'Pong!'
 * this.t('ping.response.latency', 120);   // 'Latencia 120ms'
 * ```
 */
export type TFn = <K extends TranslationKey>(key: K, ...args: ArgsFor<K>) => string;

const BUNDLES: Record<SupportedLocale, Bundle> = { es, en, pt };

/**
 * Devuelve el bundle del locale solicitado. Si el locale es
 * `null`/`undefined` o no tiene traducción explícita, cae al idioma
 * base ({@link DEFAULT_LOCALE}). Nunca lanza.
 *
 * Es interno: el resto del código consume `i18n.for(locale)` que
 * devuelve la función `TFn` directamente.
 */
function bundleFor(locale: SupportedLocale | null | undefined): Bundle {
    if (!locale) return BUNDLES[DEFAULT_LOCALE];
    return BUNDLES[locale] ?? BUNDLES[DEFAULT_LOCALE];
}

/**
 * Construye una función traductora ligada al locale dado.
 *
 * El cierre captura el bundle una sola vez y resuelve cada clave en
 * O(1). No mantiene estado por petición: dos invocaciones consecutivas
 * con el mismo locale devuelven traductores funcionalmente idénticos.
 *
 * Lo usan internamente `BaseCommand.t`/`CommandContext.t` (cacheado por
 * petición) y `i18n.for(locale)`.
 */
function makeT(locale: SupportedLocale | null | undefined): TFn {
    const bundle = bundleFor(locale);
    return ((key, ...args) => {
        const value = bundle[key as TranslationKey];
        return typeof value === 'function'
            ? (value as (...a: unknown[]) => string)(...args)
            : (value as string);
    }) as TFn;
}

/**
 * API global del subsistema de i18n.
 *
 * - `i18n.for(locale)` → función `TFn` lista para llamar con claves.
 * - `i18n.has(locale)` → indica si el locale tiene traducción explícita.
 * - `i18n.availableLocales()` → lista de locales con traducción real.
 *
 * No hay estado mutable: el catálogo se compila al cargar el módulo y
 * la selección de locale ocurre en cada `for(locale)`, lo que es seguro
 * bajo concurrencia masiva.
 */
export const i18n = {
    for: makeT,
    has(locale: SupportedLocale): boolean {
        return BUNDLES[locale] !== undefined;
    },
    availableLocales(): SupportedLocale[] {
        return (Object.keys(BUNDLES) as SupportedLocale[]).filter((l) => BUNDLES[l] !== undefined);
    },
};
