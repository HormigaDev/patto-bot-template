# Carpeta: Utils

## 📖 Descripción

Esta carpeta contiene **utilidades y helpers** reutilizables en todo el proyecto. Son funciones, clases y constantes que simplifican tareas comunes.

## 🏗️ Estructura

```
utils/
├── CommandCategories.ts    # Definiciones de categorías de comandos
├── Times.ts               # Utilidad para conversión de tiempo
├── Permissions.ts         # Re-exportación de permisos de Discord
└── Env.ts                 # Validación y carga segura de variables de entorno
```

---

## 📂 Env.ts

### Descripción

Utilidad para **validar y cargar variables de entorno** de forma segura y centralizada. Valida tipos, valores obligatorios y proporciona valores por defecto para variables opcionales.

### Ubicación

```typescript
// src/utils/Env.ts
```

### Exportaciones

#### `Env` (Singleton)

```typescript
import { Env } from '@/utils/Env';

// Cargar y validar configuración (una sola vez al inicio)
const config = Env.load();

// Obtener configuración ya validada
const config = Env.get();
```

### Interface de Configuración

```typescript
interface EnvConfig {
    BOT_TOKEN: string; // Token del bot (obligatorio)
    CLIENT_ID: string; // ID del cliente (obligatorio)
    USE_MESSAGE_CONTENT: boolean; // Habilitar comandos de texto (default: false)
    COMMAND_PREFIX: string; // Prefijo de comandos (default: '!')
    INTENTS?: number; // Intents personalizados (opcional)
}
```

### Métodos

#### `Env.load()`

Valida y carga todas las variables de entorno. **Debe llamarse una sola vez al inicio** del bot (en `index.ts`).

```typescript
import { Env } from '@/utils/Env';

// Validar y cargar configuración
Env.load(); // ✅ Valida y muestra logs

// Si falta alguna variable obligatoria, termina el proceso con exit(1)
```

**Comportamiento:**

- ✅ Valida variables obligatorias (`BOT_TOKEN`, `CLIENT_ID`)
- ✅ Asigna valores por defecto a variables opcionales
- ✅ Convierte tipos (strings a boolean/number)
- ✅ Muestra configuración cargada (con token enmascarado)
- ❌ Termina el proceso si falta alguna variable obligatoria

#### `Env.get()`

Obtiene la configuración ya validada. Se puede llamar desde cualquier parte del código después de `Env.load()`.

```typescript
import { Env } from '@/utils/Env';

// En bot.ts, comandos, handlers, etc.
const config = Env.get();

console.log(config.BOT_TOKEN); // string
console.log(config.USE_MESSAGE_CONTENT); // boolean
console.log(config.COMMAND_PREFIX); // string (default: '!')
```

### Reglas de Validación

#### Variables Obligatorias

- `BOT_TOKEN`: Debe existir y no estar vacío
- `CLIENT_ID`: Debe existir y no estar vacío

#### Variables Opcionales con Defaults

| Variable              | Tipo      | Default | Validación                                               |
| --------------------- | --------- | ------- | -------------------------------------------------------- |
| `USE_MESSAGE_CONTENT` | `boolean` | `false` | Solo `'true'` (case insensitive) es `true`               |
| `COMMAND_PREFIX`      | `string`  | `'!'`   | No puede estar vacío                                     |
| `INTENTS`             | `number`  | `auto`  | Debe ser número válido o se usa configuración automática |

### Ejemplo Completo

#### En `src/index.ts` (inicialización)

```typescript
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { Bot } from './bot';
import { Env } from '@/utils/Env';

dotenv.config();

// Validar y cargar configuración
Env.load();

// Iniciar el bot
const bot = new Bot();
bot.start();
```

#### En `src/bot.ts` (uso)

```typescript
import { Env } from '@/utils/Env';

export class Bot {
    constructor() {
        const config = Env.get();

        // Usar configuración validada
        if (config.USE_MESSAGE_CONTENT) {
            console.log(`Comandos de texto habilitados con prefijo: ${config.COMMAND_PREFIX}`);
        }
    }

    async start(): Promise<void> {
        const config = Env.get();
        await this.client.login(config.BOT_TOKEN);
    }
}
```

#### En cualquier archivo

```typescript
import { Env } from '@/utils/Env';

export function getPrefix(): string {
    return Env.get().COMMAND_PREFIX;
}
```

### Mensajes de Error

Si falta una variable obligatoria, el bot muestra un mensaje claro y termina:

```
╔════════════════════════════════════════════════════════════════╗
║  ❌ ERROR DE CONFIGURACIÓN                                     ║
╚════════════════════════════════════════════════════════════════╝

  ❌ Variable obligatoria faltante o vacía: BOT_TOKEN
  ❌ Variable obligatoria faltante o vacía: CLIENT_ID

📋 Solución:
  1. Copia el archivo .env.template a .env
  2. Completa las variables obligatorias
  3. Reinicia el bot
```

### Logs de Éxito

Cuando la configuración se carga correctamente:

```
✅ Configuración cargada correctamente:
   • BOT_TOKEN: MTEy...xNzg=
   • CLIENT_ID: 1234567890
   • USE_MESSAGE_CONTENT: true
   • COMMAND_PREFIX: "!"
   • INTENTS: automático
```

### Ventajas

- ✅ **Tipo seguro**: TypeScript conoce los tipos de cada variable
- ✅ **Centralizado**: Una sola fuente de verdad para la configuración
- ✅ **Validación temprana**: Errores detectados al inicio, no en runtime
- ✅ **Mensajes claros**: Errores descriptivos en español
- ✅ **Sin accesos directos**: No más `process.env.VAR || 'default'` esparcidos
- ✅ **Seguridad**: Tokens enmascarados en logs

---

## 📂 Permissions.ts

### Descripción

Re-exportación simplificada de **todos los permisos de Discord.js** para uso conveniente en el bot. Proporciona acceso directo a las banderas (flags) de permisos sin necesidad de importar desde Discord.js.

### Ubicación

```typescript
// src/utils/Permissions.ts
```

### Exportación

```typescript
import { PermissionsBitField as p } from 'discord.js';

export const Permissions = p.Flags;
```

### Uso

```typescript
import { Permissions } from '@/utils/Permissions';

// Usar en decoradores
@RequirePermissions(Permissions.BanMembers, Permissions.KickMembers)
export class ModerateCommand extends BaseCommand {}

// Verificar permisos manualmente
if (member.permissions.has(Permissions.Administrator)) {
    // Usuario es administrador
}

// Verificar múltiples permisos
const hasModPerms = member.permissions.has([
    Permissions.KickMembers,
    Permissions.BanMembers,
    Permissions.ModerateMembers,
]);
```

### Permisos Disponibles

Todos los permisos de Discord están disponibles. Los más comunes:

#### 🔨 Permisos Administrativos

```typescript
Permissions.Administrator; // Control total del servidor
Permissions.ManageGuild; // Gestionar servidor
Permissions.ManageRoles; // Gestionar roles
Permissions.ManageChannels; // Gestionar canales
Permissions.ManageWebhooks; // Gestionar webhooks
Permissions.ManageEmojisAndStickers; // Gestionar emojis y stickers
```

#### 👥 Permisos de Moderación

```typescript
Permissions.KickMembers; // Expulsar miembros
Permissions.BanMembers; // Banear miembros
Permissions.ModerateMembers; // Timeout a miembros
Permissions.ManageMessages; // Gestionar mensajes
Permissions.ManageNicknames; // Gestionar apodos
Permissions.ViewAuditLog; // Ver registro de auditoría
```

#### 💬 Permisos de Chat

```typescript
Permissions.ViewChannel; // Ver canales
Permissions.SendMessages; // Enviar mensajes
Permissions.SendMessagesInThreads; // Enviar mensajes en hilos
Permissions.CreatePublicThreads; // Crear hilos públicos
Permissions.CreatePrivateThreads; // Crear hilos privados
Permissions.EmbedLinks; // Insertar enlaces
Permissions.AttachFiles; // Adjuntar archivos
Permissions.AddReactions; // Añadir reacciones
Permissions.UseExternalEmojis; // Usar emojis externos
Permissions.MentionEveryone; // Mencionar @everyone y @here
Permissions.ManageMessages; // Gestionar mensajes
Permissions.ManageThreads; // Gestionar hilos
Permissions.ReadMessageHistory; // Leer historial de mensajes
```

#### 🔊 Permisos de Voz

```typescript
Permissions.Connect; // Conectar a voz
Permissions.Speak; // Hablar en voz
Permissions.Stream; // Transmitir pantalla
Permissions.UseVAD; // Usar detección de voz
Permissions.MuteMembers; // Silenciar miembros
Permissions.DeafenMembers; // Ensordecer miembros
Permissions.MoveMembers; // Mover miembros entre canales
Permissions.PrioritySpeaker; // Hablar con prioridad
```

#### 🎭 Permisos Especiales

```typescript
Permissions.ChangeNickname; // Cambiar propio apodo
Permissions.ManageNicknames; // Cambiar apodos de otros
Permissions.UseApplicationCommands; // Usar comandos de aplicación
Permissions.RequestToSpeak; // Solicitar hablar (stage)
Permissions.CreateEvents; // Crear eventos
Permissions.ManageEvents; // Gestionar eventos
```

### Uso con @RequirePermissions

El uso principal de `Permissions` es con el decorador `@RequirePermissions`:

```typescript
import { Permissions } from '@/utils/Permissions';
import { RequirePermissions } from '@/core/decorators/permission.decorator';

// Comando solo para administradores
@RequirePermissions(Permissions.Administrator)
export class SetupCommand extends BaseCommand {}

// Comando con múltiples permisos
@RequirePermissions(Permissions.ManageChannels, Permissions.ManageRoles)
export class LockdownCommand extends BaseCommand {}

// Comando de moderación
@RequirePermissions(Permissions.BanMembers, Permissions.ViewAuditLog)
export class BanCommand extends BaseCommand {}
```

### Verificación Manual de Permisos

También puedes verificar permisos manualmente en tus comandos:

```typescript
export class CustomCommand extends BaseCommand {
    async run(): Promise<void> {
        const member = this.ctx.member;

        // Verificar un permiso
        if (!member.permissions.has(Permissions.ManageMessages)) {
            const embed = this.getEmbed('error')
                .setTitle('❌ Sin Permisos')
                .setDescription('Necesitas el permiso de "Gestionar Mensajes"');
            await this.reply({ embeds: [embed] });
            return;
        }

        // Verificar múltiples permisos (requiere TODOS)
        const hasAllPerms = member.permissions.has([
            Permissions.ManageMessages,
            Permissions.ManageChannels,
        ]);

        // Verificar si tiene AL MENOS UNO
        const hasAnyPerm = member.permissions.any([
            Permissions.Administrator,
            Permissions.ManageGuild,
        ]);

        // Tu lógica aquí...
    }
}
```

### Verificar Permisos del Bot

```typescript
export class MyCommand extends BaseCommand {
    async run(): Promise<void> {
        const botMember = this.guild!.members.me;

        // Verificar si el bot tiene permisos
        if (!botMember?.permissions.has(Permissions.ManageChannels)) {
            const embed = this.getEmbed('error')
                .setTitle('❌ Bot sin Permisos')
                .setDescription('El bot necesita el permiso "Gestionar Canales"');
            await this.reply({ embeds: [embed] });
            return;
        }

        // Tu lógica aquí...
    }
}
```

### Ventajas

| Característica          | Beneficio                              |
| ----------------------- | -------------------------------------- |
| **Import simplificado** | No necesitas importar desde discord.js |
| **Autocompletado**      | TypeScript sugiere todos los permisos  |
| **Consistencia**        | Mismo import en toda la aplicación     |
| **Type-safe**           | Banderas tipadas correctamente         |
| **Legibilidad**         | Nombres claros y descriptivos          |

---

## 📂 CommandCategories.ts

### Descripción

Define las categorías disponibles para organizar comandos en el bot. Cada categoría tiene un nombre, descripción, etiqueta única y opcionalmente un ícono.

### Ubicación

```typescript
// src/utils/CommandCategories.ts
```

### Exportaciones

#### `Category` (Enum)

```typescript
export enum Category {
    Info = 'info',
    Other = 'other',
}
```

**Descripción:**

- Enum con las etiquetas únicas de cada categoría
- Usa valores en `lowercase` para consistencia
- Se usa en el decorador `@Command`

#### `CommandCategory` (Interface)

```typescript
export interface CommandCategory {
    name: string; // Nombre visible de la categoría
    description: string; // Descripción de qué incluye
    tag: Category; // Tag único de la categoría
    icon?: string; // Emoji o ícono (opcional)
}
```

#### `CommandCategories` (Array)

```typescript
export const CommandCategories: CommandCategory[] = [
    {
        name: 'Información',
        description: 'Comandos relacionados con la información del bot y del servidor.',
        tag: Category.Info,
        icon: 'ℹ️',
    },
    {
        name: 'Otros',
        description: 'Comandos que no encajan en otras categorías.',
        tag: Category.Other,
        icon: '❓',
    },
];
```

**Descripción:**

- Array con todas las categorías disponibles
- Cada categoría incluye metadatos completos
- `Other` es la categoría por defecto si no se especifica una

### Uso en Comandos

```typescript
import { Command } from '@/core/decorators/command.decorator';
import { Category } from '@/utils/CommandCategories';

@Command({
    name: 'help',
    description: 'Muestra la ayuda del bot',
    category: Category.Info, // ✅ Opcional
})
export class HelpCommand extends HelpDefinition {
    async run(): Promise<void> {
        // Lógica del comando
    }
}
```

**Nota:** Si no se especifica `category`, el loader asigna automáticamente `Category.Other`.

### Uso en Sistema de Ayuda

```typescript
import { CommandCategories, Category } from '@/utils/CommandCategories';

// Obtener categoría por tag
const category = CommandCategories.find((c) => c.tag === Category.Info);
console.log(category.name); // "Información"
console.log(category.description); // "Comandos relacionados con..."
console.log(category.icon); // "ℹ️"

// Listar todas las categorías
CommandCategories.forEach((cat) => {
    console.log(`${cat.icon} ${cat.name} - ${cat.description}`);
});
```

### Agregar Nuevas Categorías

Para agregar una nueva categoría, sigue estos pasos:

**Paso 1: Agregar el tag al enum**

```typescript
export enum Category {
    Info = 'info',
    Moderation = 'moderation', // ✅ Nueva categoría
    Fun = 'fun', // ✅ Nueva categoría
    Other = 'other',
}
```

**Paso 2: Agregar la definición completa**

```typescript
export const CommandCategories: CommandCategory[] = [
    {
        name: 'Información',
        description: 'Comandos relacionados con la información del bot y del servidor.',
        tag: Category.Info,
        icon: 'ℹ️',
    },
    // ✅ Nueva categoría
    {
        name: 'Moderación',
        description: 'Comandos para moderar el servidor (ban, kick, mute, etc).',
        tag: Category.Moderation,
        icon: '🛡️',
    },
    // ✅ Nueva categoría
    {
        name: 'Diversión',
        description: 'Comandos de entretenimiento y juegos.',
        tag: Category.Fun,
        icon: '🎮',
    },
    {
        name: 'Otros',
        description: 'Comandos que no encajan en otras categorías.',
        tag: Category.Other,
        icon: '❓',
    },
];
```

**Paso 3: Usar en comandos**

```typescript
@Command({
    name: 'ban',
    description: 'Banea a un usuario',
    category: Category.Moderation, // ✅ Usar nueva categoría
})
export class BanCommand extends BanDefinition {
    async run(): Promise<void> {
        // Lógica
    }
}
```

### Ejemplos de Íconos por Categoría

| Categoría      | Íconos Sugeridos |
| -------------- | ---------------- |
| Información    | ℹ️ 📖 📋         |
| Moderación     | 🛡️ 🔨 ⚖️         |
| Diversión      | 🎮 🎲 🎉         |
| Economía       | 💰 💸 🏦         |
| Utilidad       | 🔧 ⚙️ 🛠️         |
| Música         | 🎵 🎶 🎧         |
| Administración | 👑 ⚡ 🔐         |
| Otros          | ❓ 📦 ✨         |

---

## ⏱️ Times.ts

### Descripción

Clase utilitaria para **convertir unidades de tiempo a milisegundos**. Simplifica el trabajo con timeouts, cooldowns, y duraciones.

### Ubicación

```typescript
// src/utils/Times.ts
```

### Métodos Estáticos

Todos los métodos reciben un número y retornan milisegundos:

```typescript
Times.seconds(n: number): number  // n segundos → milisegundos
Times.minutes(n: number): number  // n minutos → milisegundos
Times.hours(n: number): number    // n horas → milisegundos
Times.days(n: number): number     // n días → milisegundos
Times.weeks(n: number): number    // n semanas → milisegundos
Times.months(n: number): number   // n meses (30 días) → milisegundos
Times.years(n: number): number    // n años (365 días) → milisegundos
```

### Conversiones Internas

```typescript
1 segundo  = 1000 ms
1 minuto   = 60 segundos = 60,000 ms
1 hora     = 60 minutos = 3,600,000 ms
1 día      = 24 horas = 86,400,000 ms
1 semana   = 7 días = 604,800,000 ms
1 mes      = 30 días = 2,592,000,000 ms
1 año      = 365 días = 31,536,000,000 ms
```

**Nota:** Los meses se calculan como 30 días y los años como 365 días (no considera años bisiestos).

### Ejemplos de Uso

#### Timeouts

```typescript
import { Times } from '@/utils/Times';

// Timeout de 5 segundos
setTimeout(() => {
    console.log('5 segundos después');
}, Times.seconds(5));

// Timeout de 2 minutos
setTimeout(() => {
    console.log('2 minutos después');
}, Times.minutes(2));

// Timeout de 1 hora
setTimeout(() => {
    console.log('1 hora después');
}, Times.hours(1));
```

#### Cooldowns en Plugins

```typescript
import { BasePlugin } from '@/core/structures/BasePlugin';
import { Times } from '@/utils/Times';

export class CooldownPlugin extends BasePlugin {
    private cooldownTime = Times.minutes(5); // 5 minutos en ms

    async onBeforeExecute(command: BaseCommand): Promise<boolean> {
        const cooldownEnd = Date.now() + this.cooldownTime;
        // ... lógica de cooldown
        return true;
    }
}
```

#### RichMessage Timeout

```typescript
import { RichMessage } from '@/core/components/RichMessage';
import { Times } from '@/utils/Times';

const richMessage = new RichMessage(ctx)
    .setTimeout(Times.minutes(10)) // Timeout de 10 minutos
    .addButton({
        customId: 'confirm',
        label: 'Confirmar',
        style: ButtonStyle.Success,
        onClick: async () => {
            // Lógica
        },
    });

await richMessage.send({ content: 'Mensaje con timeout de 10 minutos' });
```

#### Duraciones en Comandos

```typescript
export class MuteCommand extends MuteDefinition {
    async run(): Promise<void> {
        // Mutear por 30 minutos
        const duration = Times.minutes(30);

        await this.target.timeout(duration, this.reason);

        const embed = this.getEmbed('success')
            .setTitle('Usuario Muteado')
            .setDescription(`${this.target} muteado por 30 minutos`);

        await this.reply({ embeds: [embed] });
    }
}
```

#### Comparaciones de Tiempo

```typescript
import { Times } from '@/utils/Times';

const lastUsed = Date.now() - Times.days(7); // Hace 7 días
const now = Date.now();

if (now - lastUsed > Times.weeks(1)) {
    console.log('Hace más de 1 semana');
}

if (now - lastUsed < Times.hours(24)) {
    console.log('Hace menos de 24 horas');
}
```

#### Cálculos de Expiración

```typescript
import { Times } from '@/utils/Times';

// Premium expira en 30 días
const premiumExpiry = Date.now() + Times.days(30);

// Verificar si expiró
const isExpired = Date.now() > premiumExpiry;

// Tiempo restante
const timeLeft = premiumExpiry - Date.now();
const daysLeft = Math.ceil(timeLeft / Times.days(1));
console.log(`Quedan ${daysLeft} días de premium`);
```

#### Formateo de Duraciones

```typescript
import { Times } from '@/utils/Times';

function formatDuration(ms: number): string {
    const days = Math.floor(ms / Times.days(1));
    const hours = Math.floor((ms % Times.days(1)) / Times.hours(1));
    const minutes = Math.floor((ms % Times.hours(1)) / Times.minutes(1));
    const seconds = Math.floor((ms % Times.minutes(1)) / Times.seconds(1));

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

console.log(formatDuration(Times.hours(25))); // "1d 1h 0m 0s"
console.log(formatDuration(Times.minutes(90))); // "0d 1h 30m 0s"
```

### Ventajas de Usar Times

| ❌ Sin Times               | ✅ Con Times                       |
| -------------------------- | ---------------------------------- |
| `setTimeout(fn, 300000)`   | `setTimeout(fn, Times.minutes(5))` |
| `cooldown = 86400000`      | `cooldown = Times.days(1)`         |
| `timeout = 1000 * 60 * 60` | `timeout = Times.hours(1)`         |

**Beneficios:**

- ✅ **Legibilidad**: Código más claro y auto-documentado
- ✅ **Mantenibilidad**: Fácil de entender y modificar
- ✅ **Sin errores**: No más cálculos manuales incorrectos
- ✅ **Consistencia**: Mismo patrón en todo el proyecto

### Operaciones Matemáticas

Puedes combinar Times con operaciones matemáticas:

```typescript
import { Times } from '@/utils/Times';

// 1 día y medio
const duration = Times.days(1) + Times.hours(12);

// 30 segundos
const halfMinute = Times.minutes(1) / 2;

// 2 semanas
const twoWeeks = Times.weeks(1) * 2;

// 1 hora menos 10 minutos
const fiftyMinutes = Times.hours(1) - Times.minutes(10);
```

---

## 📚 Recursos Relacionados

### Comandos

- [`/src/commands/`](../commands/README.md) - Implementación de comandos que usan estas utilidades

### Core

- [`/src/core/components/`](../core/components/README.md) - RichMessage usa Times para timeouts
- [`/src/core/decorators/`](../core/decorators/README.md) - @Command usa Category

### Plugins

- [`/src/plugins/`](../plugins/README.md) - Plugins usan Times para cooldowns

---

## 🎯 Mejores Prácticas

### CommandCategories

1. ✅ **Mantén categorías organizadas**: Agrupa comandos de forma lógica
2. ✅ **Usa íconos consistentes**: Facilita la identificación visual
3. ✅ **Descripciones claras**: Ayuda a los usuarios a encontrar comandos
4. ✅ **Other como fallback**: Siempre debe existir para comandos sin categoría

### Times

1. ✅ **Usa Times siempre**: No uses números mágicos como `300000`
2. ✅ **Combina unidades**: `Times.hours(1) + Times.minutes(30)` es válido
3. ✅ **Documenta duraciones largas**: Comenta timeouts/cooldowns largos
4. ✅ **Considera límites**: `Times.years(100)` puede ser muy grande

---

## 🔮 Futuras Mejoras

### CommandCategories

- [ ] Sistema de permisos por categoría
- [ ] Categorías anidadas (subcategorías)
- [ ] Categorías personalizadas por servidor

### Times

- [ ] Método `Times.parse('1d 5h 30m')` para parsing de strings
- [ ] Método `Times.format(ms)` para formatear a string legible
- [ ] Soporte para años bisiestos y meses exactos
- [ ] Zona horaria y localización

---

## 💡 Ejemplos Avanzados

### Sistema de Categorías Dinámico

```typescript
import { CommandCategories, Category } from '@/utils/CommandCategories';

// Generar select menu con todas las categorías
const options = CommandCategories.map((cat) => ({
    label: cat.name,
    description: cat.description,
    value: cat.tag,
    emoji: cat.icon,
}));

const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('category-select')
    .setPlaceholder('Selecciona una categoría')
    .addOptions(options);
```

### Sistema de Cooldown Avanzado

```typescript
import { Times } from '@/utils/Times';

export class AdvancedCooldownPlugin extends BasePlugin {
    private cooldowns = new Map<string, number>();

    // Cooldowns diferentes por comando
    private getCooldownTime(commandName: string): number {
        const cooldownMap: Record<string, number> = {
            ban: Times.minutes(5),
            kick: Times.minutes(2),
            mute: Times.minutes(1),
            default: Times.seconds(30),
        };

        return cooldownMap[commandName] || cooldownMap['default'];
    }

    async onBeforeExecute(command: BaseCommand): Promise<boolean> {
        const key = `${command.user.id}-${command.constructor.name}`;
        const cooldownTime = this.getCooldownTime(command.constructor.name);
        const cooldownEnd = this.cooldowns.get(key);
        const now = Date.now();

        if (cooldownEnd && now < cooldownEnd) {
            const timeLeft = Math.ceil((cooldownEnd - now) / Times.seconds(1));
            throw new ReplyError(`⏱️ Espera ${timeLeft}s antes de usar este comando`);
        }

        this.cooldowns.set(key, now + cooldownTime);
        return true;
    }
}
```

---

## ✨ Conclusión

La carpeta `utils/` proporciona utilidades fundamentales para:

- 🏷️ **Organización**: Categorías para estructurar comandos
- ⏱️ **Tiempo**: Conversiones legibles para timeouts y cooldowns
- 🔧 **Reutilización**: Código compartido en todo el proyecto
- 📈 **Escalabilidad**: Fácil agregar nuevas utilidades

Estas utilidades mejoran la **legibilidad**, **mantenibilidad** y **consistencia** del código en todo el bot.
