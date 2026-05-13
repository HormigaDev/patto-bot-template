# Sistema de Componentes Interactivos

## 📖 Descripción

Wrappers para crear botones, selects y modales de Discord cuyos handlers son **métodos estáticos del comando** que los origina. Cada instancia del componente sólo guarda un **payload** (datos serializables); las funciones nunca se serializan ni se duplican por instancia.

## 🎯 Por qué este diseño

El problema con un esquema basado en `.onClick(callback)` es que cada componente captura una closure independiente. En 1.000 servidores con 100 componentes activos cada uno, eso significa **100.000 closures vivas** en el heap del bot — un asesino de RAM y prácticamente imposible de mover a un store distribuido.

La arquitectura actual separa drásticamente lo que es código (los handlers) de lo que es estado (los payloads):

| Recurso  | Cantidad                                | Dónde vive                            |
| -------- | --------------------------------------- | ------------------------------------- |
| Handlers | **K** (uno por método estático)         | En la clase del comando, en código    |
| Payloads | **N** (uno por instancia de componente) | En `PayloadStore` (memoria o externo) |
| Owners   | **N** (puntero al `RichMessage` padre)  | `Map<customId, RichMessage>`          |

K es típicamente entre 1 y 10 por comando. N puede ser arbitrariamente grande, pero los payloads son datos planos (serializables) que se pueden mover a Redis/Mongo sin tocar el código de los componentes.

## 🏗️ Arquitectura

```
core/
├── components/
│   ├── Button.ts          # Wrapper de botón
│   ├── Select.ts          # Wrapper de select menu
│   ├── Modal.ts           # Wrapper de modal
│   ├── RichMessage.ts     # Agrupa componentes con timeout único
│   └── index.ts           # Barrel
├── registry/
│   └── component.registry.ts  # Owners + acceso al PayloadStore
└── store/
    └── payload.store.ts       # Contrato PayloadStore + impl in-memory
```

## 📐 Contrato del customId

Todos los componentes generan un `customId` con el siguiente formato:

```
<commandKey>:<methodName>:<id>
```

| Segmento      | Descripción                                                    | Ejemplo           |
| ------------- | -------------------------------------------------------------- | ----------------- |
| `commandKey`  | Clave kebab-case bajo la que `CommandLoader` registra al comando | `help`            |
| `methodName`  | Nombre exacto del método estático handler. El prefijo (`button`/`select`/`modal`) determina el tipo | `selectCategory`  |
| `id`          | `generateId(10)` (`@/utils/Id`) para unicidad de la instancia  | `0Mj7QzAk9F`      |

CustomId resultante: `help:selectCategory:0Mj7QzAk9F`

El dispatcher en [`interactionCreate.event.ts`](../../events/interactionCreate.event.ts):

1. Parsea `customId` → `commandKey`, `methodName`, `id`.
2. Valida que `methodName` empiece con el prefijo correcto para el tipo de interacción.
3. Resuelve la clase del comando vía `CommandLoader.getCommand(commandKey)`.
4. Ubica el método estático en la clase.
5. Recupera el payload por `customId` desde `PayloadStore`.
6. Invoca `Class.method(interaction, [values,] payload)`.

## ✏️ Convención de nombres

Los handlers son **métodos estáticos** de la clase del comando. El prefijo del nombre indica el tipo:

```typescript
public static async buttonXxx(interaction, payload)            // botón
public static async selectXxx(interaction, values, payload)    // select
public static async modalXxx(interaction, payload)             // modal
```

El dispatcher rechaza la interacción si el prefijo no coincide con el tipo de la interacción recibida (un `selectFoo` invocado por un botón devuelve un warning y se ignora).

## 🤫 Respuestas efímeras

`ephemeral: true` está deprecado en discord.js v14. La forma correcta es `flags: [MessageFlags.Ephemeral]`. Para no repetir esa ceremonia en cada handler, usá el helper estático **`BaseCommand.replyEphemeral(interaction, options)`**:

```typescript
import { BaseCommand } from '@/core/structures/BaseCommand';

public static async buttonConfirm(interaction: ButtonInteraction) {
    await BaseCommand.replyEphemeral(interaction, '✅ Confirmado');
    //  o con embeds:
    await BaseCommand.replyEphemeral(interaction, { embeds: [embed] });
}
```

El helper:

- Aplica `flags: [MessageFlags.Ephemeral]` por vos.
- Elige automáticamente entre `interaction.reply()` y `interaction.followUp()` según el estado de la interacción.
- Acepta string o `InteractionReplyOptions`.

Es el mismo patrón en handlers de botones, selects y modales.

## 🔧 Componentes

### Button

```typescript
import { Button, ButtonVariant } from '@/core/components';
import type { ButtonInteraction } from 'discord.js';

interface GreetPayload {
    name: string;
}

export class GreetCommand extends BaseCommand {
    // Handler: vive en la clase, jamás en una closure por instancia
    public static async buttonGreet(
        interaction: ButtonInteraction,
        payload: GreetPayload | undefined,
    ): Promise<void> {
        if (payload === undefined) {
            // payload === undefined ⇒ expirado o nunca creado.
            // null / false / 0 / '' son payloads válidos.
            await BaseCommand.replyEphemeral(interaction, 'Esta interacción expiró.');
            return;
        }
        await interaction.reply(`Hola, ${payload.name}!`);
    }

    async run() {
        const button = new Button<GreetPayload>({
            label: 'Saluda',
            variant: ButtonVariant.Primary,
            command: 'greet',          // clave del comando en CommandLoader
            method: 'buttonGreet',     // nombre exacto del método estático
            payload: { name: this.user.username },
        });

        const richMsg = new RichMessage({
            components: [button],
            timeout: Times.minutes(2),
        });
        await richMsg.send(this.ctx);
    }
}
```

#### Variantes

```typescript
ButtonVariant.Primary    // Azul
ButtonVariant.Secondary  // Gris
ButtonVariant.Success    // Verde
ButtonVariant.Danger     // Rojo
ButtonVariant.Link       // Link (sin handler ni payload)
```

#### Helpers estáticos

```typescript
Button.primary(label, command, method, payload?, emoji?)
Button.secondary(label, command, method, payload?, emoji?)
Button.success(label, command, method, payload?, emoji?)
Button.danger(label, command, method, payload?, emoji?)
Button.link(label, url, emoji?)   // sin handler
```

### Select

```typescript
import { Select } from '@/core/components';
import type { StringSelectMenuInteraction } from 'discord.js';

interface MenuPayload {
    menu: string;
}

export class FooCommand extends BaseCommand {
    public static async selectPick(
        interaction: StringSelectMenuInteraction,
        values: string[],
        payload: MenuPayload | undefined,
    ): Promise<void> {
        if (payload === undefined) {
            await BaseCommand.replyEphemeral(interaction, 'Expirado.');
            return;
        }
        await interaction.reply(`En ${payload.menu} elegiste ${values[0]}`);
    }

    async run() {
        const select = new Select<MenuPayload>({
            command: 'foo',
            method: 'selectPick',
            payload: { menu: 'principal' },
            placeholder: 'Elige…',
            options: [
                { label: 'Opción 1', value: '1' },
                { label: 'Opción 2', value: '2' },
            ],
        });
        // ... agregar a un RichMessage
    }
}
```

### Modal

```typescript
import { Modal, TextInputStyle } from '@/core/components';
import type { ModalSubmitInteraction } from 'discord.js';

interface ContactPayload {
    topic: string;
}

export class ContactCommand extends BaseCommand {
    public static async modalContact(
        interaction: ModalSubmitInteraction,
        payload: ContactPayload | undefined,
    ): Promise<void> {
        if (payload === undefined) {
            await BaseCommand.replyEphemeral(interaction, 'Formulario expirado.');
            return;
        }
        const name = interaction.fields.getTextInputValue('name');
        await interaction.reply(`Gracias ${name}! Tema: ${payload.topic}`);
    }

    async run() {
        const modal = new Modal<ContactPayload>({
            command: 'contact',
            method: 'modalContact',
            title: 'Formulario de contacto',
            payload: { topic: 'soporte' },
            fields: [
                { customId: 'name', label: 'Nombre', style: TextInputStyle.Short, required: true },
            ],
        });

        // Modal se persiste manualmente (no pasa por RichMessage)
        await modal.commit(Times.minutes(5));
        await this.ctx.interaction.showModal(modal.getBuilder());
    }
}
```

> Los modales no se agregan a un mensaje, se muestran con `interaction.showModal(...)`. Por eso requieren `await modal.commit(ttl)` antes de abrirse — `RichMessage` no los toca.

### RichMessage

Agrupa varios componentes bajo un único timeout. Maneja el ciclo de vida de los payloads automáticamente.

```typescript
const richMsg = new RichMessage({
    embeds: [embed],
    components: [select, button1, button2],
    timeout: Times.minutes(2),
});

await richMsg.send(this.ctx);
```

Lo que hace `send()`:

1. `commitComponents()` → persiste el payload de cada componente en el `PayloadStore` con `ttl = timeout`.
2. Registra a `RichMessage` como **owner** de cada `customId` en `ComponentRegistry` (un puntero por `customId`, no una closure).
3. Envía el mensaje al canal/contexto/interacción.
4. Arranca el timeout global.

Cuando expira o se llama `destroy()`:

1. Elimina los payloads del store.
2. Quita los owners del registry.
3. Edita el mensaje en Discord para remover los componentes.

#### Reset de timeout y refresh de TTL

Cuando uno de los componentes recibe una interacción, el dispatcher invoca `owner.onComponentInteraction(customId)` **antes** de llamar al handler estático. `RichMessage` responde:

1. **Refresca el TTL de los payloads** llamando `commit(timeoutMs)` en cada componente activo. Sin esto, el payload moriría cuando se cumpliera el TTL original aunque el usuario siguiera interactuando.
2. **Reinicia el timeout global** (el `setTimeout` que dispara `destroyAll`).

```typescript
// El usuario hace click → TTL del payload y timeout global se reinician.
// No hay que llamar a resetTimeout() ni re-commitear payloads manualmente.
```

#### Modo permanente (sin expiración)

Para paneles públicos que viven indefinidamente — selectores de roles, mensajes pegados, dashboards de estado — pasá `timeout: NEVER_EXPIRES` (alias de `null`):

```typescript
import { RichMessage, Button, ButtonVariant, NEVER_EXPIRES } from '@/core/components';

const adminBtn = new Button({
    label: 'Admin',
    variant: ButtonVariant.Danger,
    command: 'roles',
    method: 'buttonAssignAdmin', // toda la info que el handler necesita está aquí
    // sin payload
});

const richMsg = new RichMessage({
    embeds: [embed],
    components: [adminBtn /* …más botones… */],
    timeout: NEVER_EXPIRES,
});

await richMsg.send(channel);
```

**Restricción:** un RichMessage permanente **no puede** tener componentes con payload. La razón es práctica: un payload sin TTL crece indefinidamente en el store. Sin TTL no hay forma de evitarlo. Si necesitás estado por interacción, usá un timeout numérico.

```typescript
// ❌ Esto lanza un error en construcción
new RichMessage({
    components: [new Button({ ..., payload: { x: 1 } })],
    timeout: NEVER_EXPIRES, // payload + permanente = contradicción
});
```

En modo permanente:

- No hay `setTimeout` global (el mensaje no se autodestruye).
- No se persiste ningún payload en el store.
- El handler estático recibe siempre `payload === undefined` — la lógica debe vivir en el `methodName` (ej. `buttonAssignAdmin` vs `buttonAssignMod`).
- Sigue habiendo owner tracking, así que un handler puede llamar `richMsg.edit({...})` si el operador tiene la referencia.

#### Edit

```typescript
await richMsg.edit({
    embeds: [newEmbed],
    components: [newButton1, newButton2],
    timeout: Times.seconds(30),
});
```

`edit()` destruye los payloads de los componentes anteriores, commitea los nuevos y reinicia el timeout. Si pasás `components: []`, elimina los componentes y cancela el timeout.

#### Acceso al `RichMessage` desde un handler estático

Como el handler es estático, no tiene closure sobre la instancia de `RichMessage`. Cuando lo necesite (por ejemplo, para llamar `richMsg.edit()` desde el handler), lo recupera vía el registry:

```typescript
import { ComponentRegistry, RichMessage } from '@/core/components';

public static async selectCategory(interaction, values, payload) {
    const owner = ComponentRegistry.getOwner(interaction.customId);
    if (!(owner instanceof RichMessage)) {
        await BaseCommand.replyEphemeral(interaction, 'Expirado.');
        return;
    }
    await owner.edit({ embeds: [...], components: [...] });
}
```

## 💾 PayloadStore

Contrato de persistencia para los payloads. Definido en [`core/store/payload.store.ts`](../store/payload.store.ts):

```typescript
interface PayloadStore {
    set(id: string, payload: unknown, ttlMs?: number): Promise<void>;
    get<T = unknown>(id: string): Promise<T | undefined>;
    delete(id: string): Promise<void>;
    has(id: string): Promise<boolean>;
}
```

Implementación por defecto: `MemoryPayloadStore` (in-memory + timers de TTL).

### Reemplazar por Redis / Mongo

```typescript
class RedisPayloadStore implements PayloadStore {
    async set(id, payload, ttlMs) {
        await redis.set(id, JSON.stringify(payload), 'PX', ttlMs);
    }
    async get(id) {
        const raw = await redis.get(id);
        return raw === null ? undefined : JSON.parse(raw);
    }
    async delete(id) {
        await redis.del(id);
    }
    async has(id) {
        return (await redis.exists(id)) === 1;
    }
}

// Al inicio del bot, antes de crear componentes:
ComponentRegistry.useStore(new RedisPayloadStore());
```

> **Convención obligatoria del contrato:** `get()` devuelve `undefined` **si y sólo si** la entrada no existe (o expiró). `null`, `false`, `0`, `''` son payloads válidos.

## ⚠️ Reglas y limitaciones

1. **Los métodos handler deben ser `static`** y vivir en la clase del comando referenciado por `commandKey`. Si no se encuentran, el dispatcher loggea un warning e ignora la interacción.
2. **El prefijo del método debe coincidir con el tipo de interacción**: `button*` para botones, `select*` para selects, `modal*` para modales.
3. **El payload debe ser serializable** si se usa un store distribuido (Redis/Mongo). En memoria cualquier valor sirve.
4. **`payload === undefined` ⇒ no existe.** Expiró por TTL, fue borrado, o nunca se commiteó. Distinguilo explícitamente del resto de los falsy.
5. **Un `commandKey` debe existir en `CommandLoader`.** El dispatcher no acepta handlers fuera de comandos. Si necesitás handlers en clases que no son comandos, registrá esa clase como un comando "no listable" o extendé el dispatcher.
6. **Discord:** máximo 5 ActionRows por mensaje, máximo 5 botones por fila, sólo 1 select por fila, los botones Link no llevan handler.

## 🧠 Ventajas

| Antes (`.onClick(closure)`)                 | Ahora (`command + method + payload`)         |
| ------------------------------------------- | -------------------------------------------- |
| 1 closure por instancia                     | 1 método estático compartido por todas       |
| Memoria del proceso crece con el uso        | El payload se puede mover a Redis            |
| El dispatcher recorre un `Map` de funciones | Lookup O(1) por `commandKey`+`methodName`    |
| Imposible auditar handlers vivos            | Los handlers son código fijo, grep-eable     |
| Restart del bot = sesiones perdidas         | Con store externo, sobreviven al restart¹    |

¹ Si el `PayloadStore` es externo (Redis/Mongo), las interacciones inflight de Discord siguen funcionando tras un restart.

## 📚 Tipos

```typescript
interface ButtonOptions<P = unknown> {
    label: string;
    variant?: ButtonVariant | ButtonStyle;
    emoji?: string;
    disabled?: boolean;
    url?: string;          // sólo para Link
    command?: string;      // requerido salvo Link
    method?: string;       // requerido salvo Link, debe empezar con "button"
    payload?: P;
    ttl?: number;
}

interface SelectOptions<P = unknown> {
    placeholder?: string;
    minValues?: number;
    maxValues?: number;
    disabled?: boolean;
    options: SelectOption[];
    command: string;
    method: string;        // debe empezar con "select"
    payload?: P;
    ttl?: number;
}

interface ModalOptions<P = unknown> {
    title: string;
    fields: ModalFieldOptions[];
    command: string;
    method: string;        // debe empezar con "modal"
    payload?: P;
    ttl?: number;
}

interface RichMessageOptions {
    content?: string;
    embeds?: EmbedBuilder[];
    components?: (Button | Select)[];
    /** number en ms, o `NEVER_EXPIRES` (= null) para no expirar */
    timeout?: number | null;
}

/** Sentinel exportado para mejorar legibilidad: `timeout: NEVER_EXPIRES` */
const NEVER_EXPIRES: null;
```

## 📖 Referencias

- [`Button.ts`](./Button.ts), [`Select.ts`](./Select.ts), [`Modal.ts`](./Modal.ts) — wrappers
- [`RichMessage.ts`](./RichMessage.ts) — agrupador con timeout
- [`component.registry.ts`](../registry/component.registry.ts) — owners + accesores al store
- [`payload.store.ts`](../store/payload.store.ts) — contrato e implementación in-memory
- [`interactionCreate.event.ts`](../../events/interactionCreate.event.ts) — dispatcher
- [`commands/info/help.command.ts`](../../commands/info/help.command.ts) — ejemplo real con paginación
