# Carpeta: Structures

## 📖 Descripción

Esta carpeta contiene las **estructuras base** y clases fundamentales del framework. Son las abstracciones sobre las que se construye todo el sistema de comandos.

## 🏗️ Estructura

```
structures/
├── BaseCommand.ts       # Clase abstracta base para comandos
├── BasePlugin.ts        # Clase abstracta base para plugins
└── CommandContext.ts    # Contexto unificado de ejecución
```

## 🎯 BaseCommand

### Descripción

Clase **abstracta** base que todos los comandos deben extender (a través de sus definiciones).

### Ubicación

```typescript
// src/core/structures/BaseCommand.ts
```

### Propiedades

```typescript
public readonly ctx!: CommandContext;
public readonly user!: User;
public readonly channel!: TextChannel | null;
```

**Inyectadas automáticamente por CommandHandler:**

-   `ctx` - Contexto completo del comando
-   `user` - Usuario que ejecutó el comando
-   `channel` - Canal donde se ejecutó (null si no es de texto)

### Método Abstracto

```typescript
public abstract run(): Promise<void>;
```

Cada comando **debe** implementar este método con su lógica específica.

### Métodos Protegidos

#### `reply(options)`

Responde al usuario (reply al mensaje o interacción).

**Parámetros:**

```typescript
options: (InteractionReplyOptions & MessageReplyOptions) | string;
```

**Ejemplos:**

```typescript
// String simple
await this.reply('¡Hola!');

// Con embed
await this.reply({
    embeds: [embed],
    components: [row],
});

// Efímero (solo interactions)
await this.reply({
    content: 'Secreto',
    flags: [MessageFlags.Ephemeral],
});
```

#### `send(options)`

Envía un mensaje al canal (sin reply).

**Parámetros:**

```typescript
options: (InteractionReplyOptions & MessageReplyOptions) | string;
```

**Diferencia con `reply`:**

-   `reply()` → Responde directamente al mensaje/interacción
-   `send()` → Envía un mensaje nuevo al canal

**Ejemplo:**

```typescript
await this.send('Mensaje nuevo en el canal');
```

#### `getEmbed(type)`

Crea un `EmbedBuilder` preconfigurado con color y timestamp.

**Parámetros:**

```typescript
type: 'error' | 'success' | 'warning' | 'info';
```

**Colores predefinidos:**

| Tipo      | Color      | Hex       |
| --------- | ---------- | --------- |
| `error`   | 🔴 Rojo    | `#ca5c5c` |
| `success` | 🟢 Verde   | `#6ec06c` |
| `warning` | 🟠 Naranja | `#d49954` |
| `info`    | 🔵 Azul    | `#5180d6` |

**Retorna:**

```typescript
EmbedBuilder;
```

Un embed con:

-   ✅ Color predefinido según el tipo
-   ✅ Timestamp automático
-   ✅ Listo para personalizar

**Ejemplos:**

```typescript
// Embed de éxito
const embed = this.getEmbed('success')
    .setTitle('✅ Operación exitosa')
    .setDescription('El usuario fue baneado correctamente');
await this.reply({ embeds: [embed] });

// Embed de error
const embed = this.getEmbed('error')
    .setTitle('❌ Error')
    .setDescription('No tienes permisos para esto');
await this.reply({ embeds: [embed] });

// Embed de advertencia
const embed = this.getEmbed('warning')
    .setTitle('⚠️ Advertencia')
    .setDescription('Esta acción no se puede deshacer');
await this.reply({ embeds: [embed] });

// Embed informativo
const embed = this.getEmbed('info')
    .setTitle('ℹ️ Información')
    .setDescription('Aquí está tu información');
await this.reply({ embeds: [embed] });
```

**Ventajas:**

-   ✅ No necesitas crear `new EmbedBuilder()` cada vez
-   ✅ Colores consistentes en todo el bot
-   ✅ Timestamp automático
-   ✅ Menos código repetitivo

### Ejemplo de Uso

```typescript
import { BaseCommand } from '@/core/structures/BaseCommand';

export class PingCommand extends BaseCommand {
    public async run(): Promise<void> {
        // Usar getEmbed en lugar de new EmbedBuilder()
        const embed = this.getEmbed('success')
            .setTitle('🏓 Pong!')
            .setDescription(`Usuario: ${this.user.username}`)
            .addFields({ name: 'Latencia', value: `${this.ctx.client.ws.ping}ms` });

        // Usar métodos heredados
        await this.reply({ embeds: [embed] });
    }
}
```

### Validación Interna

Ambos métodos validan que `ctx` exista:

```typescript
if (!this.ctx) {
    throw new Error('El contexto no fue definido');
}
```

Esto nunca debería ocurrir en uso normal, pero protege contra mal uso.

---

## 🔌 BasePlugin

### Descripción

Clase **abstracta** base para crear plugins extensibles que se ejecutan antes o después de los comandos.

### Ubicación

```typescript
// src/core/structures/BasePlugin.ts
```

### Métodos Opcionales

```typescript
async onBeforeExecute?(command: BaseCommand): Promise<boolean>;
async onAfterExecute?(command: BaseCommand): Promise<void>;
```

**Características:**

-   Ambos métodos son **opcionales** (puedes implementar uno o ambos)
-   Reciben la instancia completa del comando
-   `onBeforeExecute` se ejecuta **antes** de `command.run()`
    -   ✅ `return true` → Continúa con la ejecución del comando
    -   ❌ `return false` → Cancela la ejecución silenciosamente (sin mensaje)
    -   💥 `throw Error` → Cancela la ejecución y muestra mensaje de error
-   `onAfterExecute` se ejecuta **después** de `command.run()` (solo si no hubo errores)

### Comportamiento de onBeforeExecute

El método `onBeforeExecute` debe retornar un booleano que indica si el comando debe ejecutarse:

| Retorno/Acción                   | Resultado             | Mensaje al usuario       |
| -------------------------------- | --------------------- | ------------------------ |
| `return true`                    | ✅ Comando se ejecuta | -                        |
| `return false`                   | ❌ Comando se cancela | No (silencioso)          |
| `throw new ReplyError(...)`      | ❌ Comando se cancela | Sí (embed de error)      |
| `throw new ValidationError(...)` | ❌ Comando se cancela | Sí (embed de validación) |

### Ejemplo de Uso

```typescript
import { BasePlugin } from '@/core/structures/BasePlugin';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { ReplyError } from '@/error/ReplyError';

export class CooldownPlugin extends BasePlugin {
    private cooldowns = new Map<string, number>();

    async onBeforeExecute(command: BaseCommand): Promise<boolean> {
        const key = `${command.user.id}-${command.constructor.name}`;
        const now = Date.now();
        const cooldownEnd = this.cooldowns.get(key);

        if (cooldownEnd && now < cooldownEnd) {
            const timeLeft = Math.ceil((cooldownEnd - now) / 1000);
            throw new ReplyError(`⏱️ Espera ${timeLeft}s`);
        }

        return true; // Continuar con la ejecución
    }

    async onAfterExecute(command: BaseCommand): Promise<void> {
        const key = `${command.user.id}-${command.constructor.name}`;
        this.cooldowns.set(key, Date.now() + 5000); // 5s cooldown
    }
}
```

### Ejemplo de Cancelación Silenciosa

```typescript
export class SilentCooldownPlugin extends BasePlugin {
    private cooldowns = new Map<string, number>();

    async onBeforeExecute(command: BaseCommand): Promise<boolean> {
        const key = `${command.user.id}-${command.constructor.name}`;
        const now = Date.now();
        const cooldownEnd = this.cooldowns.get(key);

        // Cancelar silenciosamente si está en cooldown
        if (cooldownEnd && now < cooldownEnd) {
            return false; // No muestra ningún mensaje
        }

        this.cooldowns.set(key, now + 3000);
        return true; // Continuar
    }
}
```

**Ver:** [`/src/plugins/`](../../plugins/README.md) para más información sobre plugins.

---

## 🌐 CommandContext

### Descripción

Wrapper unificado que abstrae las diferencias entre `Message` y `CommandInteraction`.

### Ubicación

```typescript
// src/core/structures/CommandContext.ts
```

### Constructor

```typescript
constructor(source: CommandInteraction | Message)
```

Acepta tanto interacciones (slash commands) como mensajes (text commands).

### Propiedades

#### `isInteraction`

```typescript
public readonly isInteraction: boolean;
```

Indica si la fuente es una interacción o un mensaje.

**Ejemplo:**

```typescript
if (ctx.isInteraction) {
    // Lógica específica de slash command
} else {
    // Lógica específica de text command
}
```

#### `guild`

```typescript
get guild(): Guild
```

Obtiene el servidor donde se ejecutó el comando.

**Ejemplo:**

```typescript
const guildName = ctx.guild.name;
```

#### `user`

```typescript
get user(): User
```

Obtiene el usuario que ejecutó el comando.

**Diferencia:**

-   En interacciones: `interaction.user`
-   En mensajes: `message.author`

**Ejemplo:**

```typescript
const username = ctx.user.username;
```

#### `channel`

```typescript
get channel(): TextChannel | null
```

Obtiene el canal donde se ejecutó el comando.

**Retorna:**

-   `TextChannel` si es un canal de texto
-   `null` si no es texto (DM, thread, etc.)

**Ejemplo:**

```typescript
if (ctx.channel) {
    await ctx.channel.send('Mensaje directo al canal');
}
```

#### `client`

```typescript
get client(): Client
```

Obtiene el cliente de Discord.

**Ejemplo:**

```typescript
const botUser = ctx.client.user;
```

### Métodos

#### `reply(options)`

Responde al usuario.

**Comportamiento:**

-   **Interaction**: `interaction.reply(options)`
-   **Message**: `message.reply(options)`

**Parámetros:**

```typescript
options: (InteractionReplyOptions & MessageReplyOptions) | string;
```

**Ejemplo:**

```typescript
await ctx.reply('¡Hola!');
await ctx.reply({ embeds: [embed] });
```

#### `send(options)`

Envía un mensaje al canal.

**Comportamiento:**

-   **Interaction**: `interaction.reply(options)` (mismo que reply)
-   **Message**: `channel.send(options)` (no es reply)

**Parámetros:**

```typescript
options: (InteractionReplyOptions & MessageReplyOptions) | string;
```

**Ejemplo:**

```typescript
await ctx.send('Mensaje en el canal');
```

#### `ephemeral(options)`

Responde con un mensaje efímero (solo visible para el usuario).

**Comportamiento:**

-   **Interaction**: Agrega flag `Ephemeral`
-   **Message**: Reply normal (los mensajes no pueden ser efímeros)

**Parámetros:**

```typescript
options: (InteractionReplyOptions & MessageReplyOptions) | string;
```

**Ejemplo:**

```typescript
await ctx.ephemeral('Solo tú puedes ver esto');
```

**Nota:** En mensajes normales, esto funciona como un reply regular.

### Abstracción de Diferencias

El CommandContext abstrae las diferencias entre Message e Interaction:

| Propiedad | Interaction           | Message           | Abstracción   |
| --------- | --------------------- | ----------------- | ------------- |
| Usuario   | `interaction.user`    | `message.author`  | `ctx.user`    |
| Servidor  | `interaction.guild`   | `message.guild`   | `ctx.guild`   |
| Canal     | `interaction.channel` | `message.channel` | `ctx.channel` |
| Reply     | `interaction.reply()` | `message.reply()` | `ctx.reply()` |
| Send      | `interaction.reply()` | `channel.send()`  | `ctx.send()`  |

### Ejemplo de Uso

```typescript
export class MyCommand extends BaseCommand {
    public async run(): Promise<void> {
        // Acceder al contexto
        const ctx = this.ctx;

        // Verificar tipo
        if (ctx.isInteraction) {
            await ctx.ephemeral('Mensaje efímero');
        } else {
            await ctx.reply('Reply normal');
        }

        // Acceder a propiedades
        const user = ctx.user;
        const guild = ctx.guild;
        const client = ctx.client;

        // Responder de forma unificada
        await ctx.reply(`Hola ${user.username} en ${guild.name}`);
    }
}
```

### Implementación Interna

```typescript
private get sourceCommand(): CommandInteraction {
    return this.source as CommandInteraction;
}

private get sourceMessage(): Message {
    return this.source as Message;
}
```

Los getters privados permiten type-casting seguro internamente.

### Manejo de Flags

Para mensajes, los flags son filtrados:

```typescript
const { flags, ...messageOptions } = payload;
// flags se descartan en mensajes
```

Esto previene errores al usar opciones de interacción en mensajes.

## 🎨 Ejemplo Integrado

```typescript
// Definición
@Command({ name: 'ban', description: 'Banea un usuario' })
export abstract class BanDefinition extends BaseCommand {
    @Arg({ name: 'usuario', index: 0, required: true })
    public usuario!: User;

    @Arg({ name: 'razon', index: 1, required: false })
    public razon?: string;
}

// Implementación
export class BanCommand extends BanDefinition {
    public async run(): Promise<void> {
        // BaseCommand proporciona:
        // - this.ctx (CommandContext)
        // - this.user (User)
        // - this.channel (TextChannel | null)
        // - this.getEmbed(type) (Helper de embeds)

        // Verificar permisos
        if (!this.ctx.guild.members.me?.permissions.has('BanMembers')) {
            const errorEmbed = this.getEmbed('error')
                .setTitle('❌ Sin Permisos')
                .setDescription('No tengo permisos para banear usuarios');

            await this.reply({ embeds: [errorEmbed] });
            return;
        }

        try {
            // Banear usuario
            await this.usuario.ban({ reason: this.razon || 'No especificada' });

            // Embed de éxito usando getEmbed
            const successEmbed = this.getEmbed('success')
                .setTitle('✅ Usuario Baneado')
                .setDescription(`${this.usuario.tag} ha sido baneado`)
                .addFields(
                    { name: 'Moderador', value: this.user.tag, inline: true },
                    { name: 'Razón', value: this.razon || 'No especificada', inline: true },
                );

            await this.reply({ embeds: [successEmbed] });
        } catch (error) {
            const errorEmbed = this.getEmbed('error')
                .setTitle('❌ Error')
                .setDescription('No se pudo banear al usuario');

            await this.reply({ embeds: [errorEmbed] });
        }
    }
}
```

## 📚 Recursos Relacionados

-   `/src/commands/` - Implementan BaseCommand
-   `/src/definition/` - Extienden BaseCommand
-   `/src/plugins/` - Implementan BasePlugin
-   `/src/core/handlers/command.handler.ts` - Inyecta ctx, user, channel
-   [Discord.js Docs](https://discord.js.org/) - Documentación de Discord.js
