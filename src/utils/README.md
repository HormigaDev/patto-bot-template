# Carpeta: Utils

## 📖 Descripción

Esta carpeta contiene **utilidades y helpers** reutilizables en todo el proyecto. Son funciones, clases y constantes que simplifican tareas comunes.

## 🏗️ Estructura

```
utils/
├── CommandCategories.ts    # Definiciones de categorías de comandos
└── Times.ts               # Utilidad para conversión de tiempo
```

---

## 📂 CommandCategories.ts

### Descripción

Define las categorías disponibles para organizar comandos en el bot. Cada categoría tiene un nombre, descripción, etiqueta única y opcionalmente un ícono.

### Ubicación

```typescript
// src/utils/CommandCategories.ts
```

### Exportaciones

#### `CommandCategoryTag` (Enum)

```typescript
export enum CommandCategoryTag {
    Info = 'info',
    Other = 'other',
}
```

**Descripción:**

-   Enum con las etiquetas únicas de cada categoría
-   Usa valores en `lowercase` para consistencia
-   Se usa en el decorador `@Command`

#### `CommandCategory` (Interface)

```typescript
export interface CommandCategory {
    name: string; // Nombre visible de la categoría
    description: string; // Descripción de qué incluye
    tag: CommandCategoryTag; // Tag único de la categoría
    icon?: string; // Emoji o ícono (opcional)
}
```

#### `CommandCategories` (Array)

```typescript
export const CommandCategories: CommandCategory[] = [
    {
        name: 'Información',
        description: 'Comandos relacionados con la información del bot y del servidor.',
        tag: CommandCategoryTag.Info,
        icon: 'ℹ️',
    },
    {
        name: 'Otros',
        description: 'Comandos que no encajan en otras categorías.',
        tag: CommandCategoryTag.Other,
        icon: '❓',
    },
];
```

**Descripción:**

-   Array con todas las categorías disponibles
-   Cada categoría incluye metadatos completos
-   `Other` es la categoría por defecto si no se especifica una

### Uso en Comandos

```typescript
import { Command } from '@/core/decorators/command.decorator';
import { CommandCategoryTag } from '@/utils/CommandCategories';

@Command({
    name: 'help',
    description: 'Muestra la ayuda del bot',
    category: CommandCategoryTag.Info, // ✅ Opcional
})
export class HelpCommand extends HelpDefinition {
    async run(): Promise<void> {
        // Lógica del comando
    }
}
```

**Nota:** Si no se especifica `category`, el loader asigna automáticamente `CommandCategoryTag.Other`.

### Uso en Sistema de Ayuda

```typescript
import { CommandCategories, CommandCategoryTag } from '@/utils/CommandCategories';

// Obtener categoría por tag
const category = CommandCategories.find((c) => c.tag === CommandCategoryTag.Info);
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
export enum CommandCategoryTag {
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
        tag: CommandCategoryTag.Info,
        icon: 'ℹ️',
    },
    // ✅ Nueva categoría
    {
        name: 'Moderación',
        description: 'Comandos para moderar el servidor (ban, kick, mute, etc).',
        tag: CommandCategoryTag.Moderation,
        icon: '🛡️',
    },
    // ✅ Nueva categoría
    {
        name: 'Diversión',
        description: 'Comandos de entretenimiento y juegos.',
        tag: CommandCategoryTag.Fun,
        icon: '🎮',
    },
    {
        name: 'Otros',
        description: 'Comandos que no encajan en otras categorías.',
        tag: CommandCategoryTag.Other,
        icon: '❓',
    },
];
```

**Paso 3: Usar en comandos**

```typescript
@Command({
    name: 'ban',
    description: 'Banea a un usuario',
    category: CommandCategoryTag.Moderation, // ✅ Usar nueva categoría
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

-   ✅ **Legibilidad**: Código más claro y auto-documentado
-   ✅ **Mantenibilidad**: Fácil de entender y modificar
-   ✅ **Sin errores**: No más cálculos manuales incorrectos
-   ✅ **Consistencia**: Mismo patrón en todo el proyecto

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

-   [`/src/commands/`](../commands/README.md) - Implementación de comandos que usan estas utilidades

### Core

-   [`/src/core/components/`](../core/components/README.md) - RichMessage usa Times para timeouts
-   [`/src/core/decorators/`](../core/decorators/README.md) - @Command usa CommandCategoryTag

### Plugins

-   [`/src/plugins/`](../plugins/README.md) - Plugins usan Times para cooldowns

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

-   [ ] Sistema de permisos por categoría
-   [ ] Categorías anidadas (subcategorías)
-   [ ] Categorías personalizadas por servidor

### Times

-   [ ] Método `Times.parse('1d 5h 30m')` para parsing de strings
-   [ ] Método `Times.format(ms)` para formatear a string legible
-   [ ] Soporte para años bisiestos y meses exactos
-   [ ] Zona horaria y localización

---

## 💡 Ejemplos Avanzados

### Sistema de Categorías Dinámico

```typescript
import { CommandCategories, CommandCategoryTag } from '@/utils/CommandCategories';

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

-   🏷️ **Organización**: Categorías para estructurar comandos
-   ⏱️ **Tiempo**: Conversiones legibles para timeouts y cooldowns
-   🔧 **Reutilización**: Código compartido en todo el proyecto
-   📈 **Escalabilidad**: Fácil agregar nuevas utilidades

Estas utilidades mejoran la **legibilidad**, **mantenibilidad** y **consistencia** del código en todo el bot.
