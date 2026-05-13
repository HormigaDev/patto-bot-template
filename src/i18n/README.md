# Módulo `i18n`

Internacionalización del bot **centralizada**, segura bajo concurrencia y opt-in para quien la quiera ampliar.

> El logger, la infraestructura, las descripciones de slash commands y los comandos de ejemplo base siguen con textos hardcoded. Este módulo es para comandos que quieran responder al usuario con i18n, como `setlocale` y `help-translated`.

---

## Tabla de contenidos

- [Filosofía](#filosofía)
- [Arquitectura](#arquitectura)
- [Idiomas soportados](#idiomas-soportados)
- [Añadir o cambiar un mensaje](#añadir-o-cambiar-un-mensaje)
- [Consumir traducciones desde código](#consumir-traducciones-desde-código)
- [Cómo se resuelve el locale de cada petición](#cómo-se-resuelve-el-locale-de-cada-petición)
- [Handlers estáticos de componentes](#handlers-estáticos-de-componentes)
- [Configurar un store distribuido (Redis u otros)](#configurar-un-store-distribuido-redis-u-otros)
- [Añadir un nuevo idioma](#añadir-un-nuevo-idioma)
- [Eliminar i18n del bot (un único punto)](#eliminar-i18n-del-bot-un-único-punto)
- [API pública](#api-pública)
- [Comando de ejemplo: `/setlocale`](#comando-de-ejemplo-setlocale)
- [Tests](#tests)

---

## Filosofía

1. **Tres archivos, una sola tabla por idioma.** Todos los mensajes del bot viven en [`src/i18n/locale/es.ts`](./locale/es.ts) (fuente de verdad), [`en.ts`](./locale/en.ts) y [`pt.ts`](./locale/pt.ts). Sin archivos de traducción dispersos por el repositorio — añadir/renombrar/borrar una clave es siempre un cambio en una sola carpeta.
2. **Claves planas con notación de puntos.** Tipo `'ping.response.title'`, `'system.error.title'`, `'cooldown.wait_until'`. No camelCase, no objetos anidados: cada clave es un literal string con segmentos en `<dominio>.<sección>.<mensaje>`, con `snake_case` cuando un segmento es multi-palabra.
3. **Por servidor, no por usuario.** El locale es una configuración de **guild**: cualquier miembro del servidor ve al bot en el idioma resultante. Evita que dos usuarios en el mismo canal lean el bot en idiomas distintos en el mismo hilo de conversación.
4. **Opt-in por comando.** El helper recomendado es `this.t('clave', ...args)` desde `BaseCommand`. Los comandos que no quieran i18n pueden seguir usando strings literales.
5. **Sin estado mutable por petición.** El locale se resuelve **una vez** al inicio y se inyecta en `CommandContext.locale`/`BaseCommand.locale`. `this.t` usa ese locale para resolver el bundle correcto.
6. **El español es la fuente de verdad.** `en.ts` y `pt.ts` se tipan como `typeof es`: si añades una clave en `es.ts` y olvidas traducirla, el compilador te lo señala.
7. **El logger queda fuera.** Los logs siguen en el idioma del desarrollador. La traducción afecta **solo** a respuestas visibles para el usuario final.

---

## Arquitectura

```text
src/i18n/
├── README.md
├── index.ts                # API pública (i18n, resolveLocaleFromInteraction, …)
├── types.ts                # SupportedLocale, DEFAULT_LOCALE, helpers
├── translator.ts           # i18n.for(locale) → TFn(key, ...args)
├── locale.resolver.ts      # LocaleResolver (cadena de precedencia)
├── registry.ts             # LocaleRegistry estático (store/resolver)
├── locale/
│   ├── es.ts               # ⭐ Catálogo en español — fuente de verdad
│   ├── en.ts               # Catálogo en inglés (typeof es)
│   └── pt.ts               # Catálogo en portugués (typeof es)
└── store/
    └── locale.store.ts     # LocaleStore (per-guild) + MemoryLocaleStore
```

Flujo de una petición:

```text
Interaction / Message
        │
        ▼
CommandHandler.executeCommand()
        │  resuelve locale una sola vez
        ▼
LocaleRegistry.getResolver().resolve({ guildId, discordLocale })
        │  1. preferencia del servidor   (LocaleStore por guildId)
        │  2. interaction.locale         (normalizado)
        │  3. DEFAULT_LOCALE ('es')
        ▼
ctx.locale = <SupportedLocale>           (también accesible como BaseCommand.locale)
        │
        ▼
comandos opt-in → this.t('clave.con.puntos', ...args)
```

---

## Idiomas soportados

Por defecto: `es`, `en`, `pt` (declarados en [`types.ts`](./types.ts)).

```ts
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/i18n';

SUPPORTED_LOCALES; // readonly ['es', 'en', 'pt']
DEFAULT_LOCALE;    // 'es' — fuente de verdad y fallback
```

---

## Añadir o cambiar un mensaje

**Toda nueva clave se introduce primero en [`locale/es.ts`](./locale/es.ts).** Después, el compilador te lleva de la mano:

1. Edita `es.ts` y añade la clave con su dominio y notación de puntos. Usa una **función** para mensajes con interpolación: TypeScript validará los argumentos en cada call site.

   ```ts
   // en locale/es.ts
   export const es = {
       // …
       'ping.response.latency': (ms: number) => `Latencia \`${ms}ms\``,
       'moderation.kicked': (target: string, reason: string) =>
           `${target} ha sido expulsado. Motivo: ${reason}`,
   };
   ```

2. Ejecuta `tsc --noEmit` (o deja que el build/IDE lo haga). Verás errores en `en.ts` y `pt.ts` diciendo qué claves faltan.

3. Traduce esas claves. Las firmas de funciones (`(ms: number) => string`, etc.) se infieren automáticamente desde el español: sólo escribes el cuerpo.

   ```ts
   // en locale/en.ts
   export const en: typeof es = {
       // …
       'ping.response.latency': (ms) => `Latency \`${ms}ms\``,
       'moderation.kicked': (target, reason) =>
           `${target} has been kicked. Reason: ${reason}`,
   };
   ```

4. Listo. Cualquier consumidor que use `this.t('moderation.kicked', target, reason)` ve la nueva clave con autocompletado y tipos completos en los tres idiomas.

> **Convención de nombres.** `'<dominio>.<sección>.<mensaje>'` en minúsculas, segmentos en `snake_case` si son multi-palabra. Ej: `'ping.response.title'`, `'system.argument.parse_error'`, `'help.subcommand_groups.footer'`. Tener el dominio en el primer segmento hace que `grep "'ping\." src/i18n/locale/` te devuelva inmediatamente todo lo del comando `/ping`.

> **Descripciones de comandos.** Las descripciones de slash commands y argumentos se mantienen como literales del decorador. No se registran `description_localizations` ni se traducen nombres/opciones de Discord; i18n se aplica a respuestas del bot.

---

## Consumir traducciones desde código

### Desde un comando

```ts
@Command({ name: 'ping', description: 'Muestra la latencia del bot', ... })
export class PingCommand extends BaseCommand {
    async run() {
        const embed = this.getEmbed('success')
            .setTitle(this.t('ping.response.title'))
            .setDescription(this.t('ping.response.latency', this.client.ws.ping));
        await this.send({ embeds: [embed] });
    }
}
```

### Desde handlers estáticos de componentes

Los handlers `static` de botones/selects/modales no tienen `BaseCommand`/`CommandContext`. Usa el helper:

```ts
import { i18n, resolveLocaleFromInteraction } from '@/i18n';

public static async buttonOpen(interaction: ButtonInteraction, payload: P | undefined) {
    if (payload === undefined) {
        const t = i18n.for(await resolveLocaleFromInteraction(interaction));
        await BaseCommand.replyEphemeral(interaction, t('feedback.invitation_expired'));
        return;
    }
    // …
}
```

> **Recomendación: pasa el locale en el payload.** Para que los botones de un flujo prolongado (paginación de `/help`, encuestas de `/vote`, etc.) sigan en el mismo idioma con el que se invocó el comando aunque el servidor cambie la configuración a mitad de flujo, incluye `locale: SupportedLocale` en el payload del componente. El handler hace `i18n.for(payload.locale)` y evita un lookup al store.

---

## Cómo se resuelve el locale de cada petición

El `CommandHandler` lo resuelve **una sola vez** antes de invocar `run()` y lo deposita en `ctx.locale`:

```ts
const discordLocale =
    source instanceof Message ? undefined : (source.locale as string | undefined);

ctx.locale = await LocaleRegistry.getResolver().resolve({
    guildId: ctx.guild?.id,
    discordLocale,
});
```

Cadena de precedencia (gana la primera fuente con valor válido):

1. **Preferencia explícita del servidor** (lo que cambia `/setlocale`, persistido en `LocaleStore`).
2. **`interaction.locale` de Discord** (`'es-ES'`, `'pt-BR'`, etc., normalizado al código base soportado).
3. **`DEFAULT_LOCALE`** (`'es'`).

Locales fuera de los soportados se ignoran silenciosamente.

---

## Handlers estáticos de componentes

Ver "[Consumir traducciones desde código → Desde handlers estáticos](#desde-handlers-estáticos-de-componentes)".

---

## Configurar un store distribuido (Redis u otros)

Por defecto se usa `MemoryLocaleStore` (válido para single-instance y desarrollo). Para producción con sharding o multi-instancia, implementa `LocaleStore` y regístralo **antes** de crear el `Bot`:

```ts
// src/index.ts (resumido)
import { LocaleRegistry } from '@/i18n';
import { RedisLocaleStore } from './stores/redis-locale-store';
import Redis from 'ioredis';

LocaleRegistry.useStore(new RedisLocaleStore(new Redis(process.env.REDIS_URL!)));

// ahora sí: importar Bot, etc.
```

Ejemplo mínimo de `LocaleStore` sobre Redis:

```ts
import type { LocaleStore, SupportedLocale } from '@/i18n';
import { isSupportedLocale } from '@/i18n';
import type Redis from 'ioredis';

export class RedisLocaleStore implements LocaleStore {
    constructor(private readonly redis: Redis) {}

    private key(guildId: string) {
        return `i18n:locale:guild:${guildId}`;
    }

    async getGuildLocale(guildId: string): Promise<SupportedLocale | undefined> {
        const raw = await this.redis.get(this.key(guildId));
        return raw && isSupportedLocale(raw) ? raw : undefined;
    }

    async setGuildLocale(guildId: string, locale: SupportedLocale): Promise<void> {
        await this.redis.set(this.key(guildId), locale);
    }

    async deleteGuildLocale(guildId: string): Promise<void> {
        await this.redis.del(this.key(guildId));
    }
}
```

---

## Añadir un nuevo idioma

1. Añade el código ISO 639-1 al tuple `SUPPORTED_LOCALES` en [`types.ts`](./types.ts):

   ```ts
   export const SUPPORTED_LOCALES = ['es', 'en', 'pt', 'fr'] as const;
   ```

2. Crea `src/i18n/locale/fr.ts` tipado como `typeof es`. El compilador te dirá exactamente qué claves faltan.

   ```ts
   import type { es } from './es';

   export const fr: typeof es = {
       // …todas las claves de es traducidas
   };
   ```

3. Inclúyelo en `BUNDLES` dentro de `translator.ts`:

   ```ts
   import { fr } from './locale/fr';
   const BUNDLES = { es, en, pt, fr };
   ```

No hace falta tocar el resolver, el registry ni ningún comando.

---

## Eliminar i18n del bot

¿Quieres un bot solo en español sin el subsistema i18n? El diseño mantiene la dependencia acotada:

1. Elimina los comandos opt-in que usan i18n (`setlocale` y `help-translated`).
2. Borra `get t(): TFn { … }` en [`BaseCommand`](../core/structures/BaseCommand.ts).
3. Borra `src/i18n` y retira la resolución de locale en `CommandHandler`/`CommandContext` si ya no necesitas `BaseCommand.locale`.

TypeScript marcará cualquier `this.t(...)` que quede vivo.

---

## API pública

Todo se exporta desde `@/i18n`:

| Símbolo                            | Propósito                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `i18n.for(locale)`                 | Devuelve la función traductora `t(key, ...args)` ligada al locale dado.    |
| `i18n.has(locale)`                 | Indica si el locale tiene traducción explícita.                            |
| `i18n.availableLocales()`          | Lista de locales con traducción real.                                      |
| `TFn`                              | Firma de la función traductora.                                            |
| `TranslationKey`                   | Unión de todas las claves del bundle.                                      |
| `Bundle`                           | Tipo del catálogo (alias de `typeof es`).                                  |
| `SupportedLocale`                  | Unión de tipos de locales soportados.                                      |
| `SUPPORTED_LOCALES`                | Tuple readonly con todos los locales.                                      |
| `DEFAULT_LOCALE`                   | Locale base (`'es'`).                                                      |
| `isSupportedLocale(v)`             | Type-guard para input externo.                                             |
| `normalizeLocale(raw)`             | Acepta `'es-ES'`, `'pt-BR'`, etc. Devuelve el código base o `null`.        |
| `resolveLocaleFromInteraction(i)`  | Helper para handlers estáticos (botones/selects/modales).                  |
| `LocaleResolver`                   | Resuelve el locale efectivo de una petición.                               |
| `LocaleStore` (interface)          | Contrato de persistencia per-guild (`getGuildLocale`, etc.).               |
| `MemoryLocaleStore`                | Implementación por defecto en memoria.                                     |
| `LocaleRegistry`                   | Punto único de configuración (`useStore`, `getStore`, `getResolver`).      |

---

## Comando de ejemplo: `/setlocale`

Incluido en [`src/commands/examples/setlocale.command.ts`](../commands/examples/setlocale.command.ts). Permite cambiar el idioma del servidor entero. Como la preferencia es global, el comando exige el permiso `ManageGuild` vía `@RequirePermissions(Permissions.ManageGuild)`.

Demuestra:

- Llamadas a `this.t('setlocale.response.title')` y `this.t('setlocale.response.description', target)` con autocompletado completo.
- Persistencia de la preferencia con `LocaleRegistry.getStore().setGuildLocale(this.guild.id, target)`.
- Confirmación devuelta **en el nuevo idioma** seleccionado (no en el actual).

---

## Tests

Tests unitarios en [`tests/unit/i18n/`](../../tests/unit/i18n/):

- `types.test.ts` — `SUPPORTED_LOCALES`, `isSupportedLocale`, `normalizeLocale`.
- `translator.test.ts` — bundle global `i18n` + funcion `TFn`.
- `memory.locale.store.test.ts` — `MemoryLocaleStore` (per-guild + escrituras paralelas).
- `locale.resolver.test.ts` — cadena de precedencia completa (guild → Discord → default).
- `registry.test.ts` — comportamiento estático del `LocaleRegistry`.

Ejecútalos con:

```sh
npx jest tests/unit/i18n
```
