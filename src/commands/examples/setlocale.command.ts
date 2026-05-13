import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { RequirePermissions } from '@/core/decorators/permission.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { Category } from '@/utils/CommandCategories';
import { Permissions } from '@/utils/Permissions';
import {
    i18n,
    isSupportedLocale,
    LocaleRegistry,
    SUPPORTED_LOCALES,
    type SupportedLocale,
} from '@/i18n';

const LOCALE_LABELS: Record<SupportedLocale, string> = {
    es: 'Español',
    en: 'Inglés',
    pt: 'Portugués',
};

/**
 * Comando de ejemplo `/setlocale`.
 *
 * Cambia el idioma con el que el bot responde a **todo el servidor**.
 * La preferencia se persiste en el {@link LocaleRegistry} configurado
 * al arranque (memoria por defecto; Redis u otro store en producción
 * multi-shard).
 *
 * Como el idioma es una configuración global del servidor, el comando
 * exige el permiso `ManageGuild`: cualquier miembro puede ver el bot en
 * el idioma resultante, pero solo quien gestiona el servidor puede
 * cambiarlo.
 *
 * Demuestra el patrón recomendado para consumir el módulo i18n:
 *
 * 1. Acceder a las traducciones con `this.t('clave.con.puntos', ...)`.
 * 2. La función `t` está cacheada en `CommandContext`, sin overhead.
 * 3. Cero `const t = ...` repetitivo en cada función.
 */
@Command({
    name: 'setlocale',
    description: 'Cambia el idioma en el que el bot responde en este servidor',
    aliases: ['idioma', 'language'],
    category: Category.Settings,
})
@RequirePermissions(Permissions.ManageGuild)
export class SetLocaleCommand extends BaseCommand {
    @Arg({
        name: 'idioma',
        description: 'Idioma a usar para las respuestas del bot',
        required: true,
        options: SUPPORTED_LOCALES.map((loc) => ({
            label: LOCALE_LABELS[loc],
            value: loc,
        })),
    })
    language!: string;

    public async run(): Promise<void> {
        const raw = this.language;

        // El choice del slash command ya valida contra `SUPPORTED_LOCALES`,
        // pero por la ruta de prefix commands el usuario puede escribir
        // cualquier texto. Aquí lo reverificamos antes de tocar el store.
        if (!isSupportedLocale(raw)) {
            const embed = this.getEmbed('error').setDescription(
                this.t('setlocale.response.unsupported', raw),
            );
            await this.reply({ embeds: [embed] });
            return;
        }

        const target: SupportedLocale = raw;

        if (target === this.locale) {
            const embed = this.getEmbed('info').setDescription(
                this.t('setlocale.response.same_locale', target),
            );
            await this.reply({ embeds: [embed] });
            return;
        }

        await LocaleRegistry.getStore().setGuildLocale(this.guild.id, target);

        // Confirmación en el NUEVO idioma: si se pidió cambiar a 'en',
        // los miembros del servidor verán "Language updated", no
        // "Idioma actualizado". Por eso se obtiene `t` para `target`
        // explícitamente, en lugar de usar `this.t` (que sigue
        // apuntando al locale viejo).
        const t = i18n.for(target);
        const embed = this.getEmbed('success')
            .setTitle(t('setlocale.response.title'))
            .setDescription(t('setlocale.response.description', target));

        await this.reply({ embeds: [embed] });
    }
}
