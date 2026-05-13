/**
 * API pública del subsistema de internacionalización (i18n).
 *
 * Ver `src/i18n/README.md` para la guía completa de uso y convenciones.
 *
 * ## Resumen de la API
 *
 * - `i18n.for(locale)` — devuelve la función traductora ligada al
 *   `locale` dado. Es lo único que se usa en runtime para mostrar
 *   mensajes al usuario final.
 * - `BaseCommand.t` — expone la misma función ligada al locale efectivo
 *   de la petición. Es el punto de acceso recomendado dentro de comandos;
 *   eliminar i18n del bot solo requiere borrar **este accesor** y
 *   TypeScript marcará todos los call sites afectados.
 * - `resolveLocaleFromInteraction(i)` — helper para handlers
 *   estáticos de componentes (botones/selects/modales) que no tienen
 *   acceso a `BaseCommand`/`CommandContext`.
 */

export {
    SUPPORTED_LOCALES,
    DEFAULT_LOCALE,
    I18N_ENABLED,
    isSupportedLocale,
    normalizeLocale,
    type SupportedLocale,
} from './types';

export { i18n, type Bundle, type TranslationKey, type TFn } from './translator';

export { LocaleResolver, type ResolveLocaleInput } from './locale.resolver';

export { LocaleStore, MemoryLocaleStore } from './store/locale.store';

export { LocaleRegistry } from './registry';

import { LocaleRegistry } from './registry';
import type { SupportedLocale } from './types';

/**
 * Resuelve el locale efectivo para una interacción de Discord (o
 * cualquier objeto con `guildId` y opcionalmente `locale`).
 *
 * Es la forma recomendada de obtener el locale en handlers **estáticos**
 * de botones/selects/modales: como no hay `BaseCommand`
 * disponibles, este helper aplica la misma resolución que el
 * `CommandHandler` (preferencia del servidor → locale de Discord →
 * default) usando el `LocaleRegistry` configurado.
 *
 * @example
 * ```ts
 * import { i18n, resolveLocaleFromInteraction } from '@/i18n';
 *
 * public static async selectPick(interaction: StringSelectMenuInteraction, ...) {
 *     const t = i18n.for(await resolveLocaleFromInteraction(interaction));
 *     await BaseCommand.replyEphemeral(interaction, t('color.expired'));
 * }
 * ```
 */
export async function resolveLocaleFromInteraction(interaction: {
    locale?: unknown;
    guildId?: string | null;
}): Promise<SupportedLocale> {
    return LocaleRegistry.getResolver().resolve({
        guildId: interaction.guildId ?? undefined,
        discordLocale: typeof interaction.locale === 'string' ? interaction.locale : undefined,
    });
}
