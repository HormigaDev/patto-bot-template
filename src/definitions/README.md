# Carpeta: Definition

## 📖 Descripción

Esta carpeta contiene las **definiciones** de comandos complejos que requieren argumentos o validaciones. Para comandos simples sin argumentos, puedes usar el patrón monolítico sin necesidad de crear una definición separada.

## 🎨 ¿Cuándo Usar Definiciones?

### ✅ Usa Definición Separada Si:

- Tu comando tiene **argumentos**
- Necesitas **validaciones complejas**
- El comando tiene **lógica extensa** (mejor separación)
- Quieres **reutilizar** la estructura en tests

### ❌ No Necesitas Definición Si:

- El comando **no tiene argumentos** (ej: `/ping`, `/help`)
- Es un comando **muy simple** con lógica mínima
- Prefieres **rapidez** sobre estructura perfecta

## 🎯 Propósito

Separar la **definición** (qué hace el comando, qué argumentos tiene) de la **implementación** (cómo lo hace). Esto permite:

- ✅ Mejor organización del código
- ✅ Reutilización de definiciones
- ✅ Documentación clara de la interfaz del comando
- ✅ Fácil mantenimiento y testing

## 🏗️ Estructura

```
definition/
└── *.definition.ts    # Definiciones de comandos complejos
```

## 📝 Convención de Nombres

Los archivos deben seguir el patrón:

```
<nombre-comando>.definition.ts
```

**Ejemplos:**

- `ask.definition.ts` → Define el comando `ask`
- `ban.definition.ts` → Define el comando `ban`
- `user-info.definition.ts` → Define el comando `user-info`

## 🔨 Anatomía de una Definición

```typescript
import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { User } from 'discord.js';

@Command({
    name: 'comando', // Nombre del comando (requerido)
    description: 'Descripción', // Descripción del comando (requerido)
    aliases: ['alias1', 'alias2'], // Aliases opcionales
})
export abstract class ComandoDefinition extends BaseCommand {
    @Arg({
        name: 'argumento', // Nombre del argumento
        description: 'Descripción', // Descripción del argumento
        index: 0, // Posición (solo text commands)
        required: true, // Si es obligatorio
        validate: (value) => {
            // Validación personalizada (opcional)
            if (value.length < 3) {
                return 'Debe tener al menos 3 caracteres';
            }
            return true;
        },
    })
    public argumento!: string;
}
```

## 🎨 Decorador @Command

Define los metadatos del comando.

### Propiedades

| Propiedad     | Tipo       | Requerido | Descripción                              |
| ------------- | ---------- | --------- | ---------------------------------------- |
| `name`        | `string`   | ✅ Sí     | Nombre del comando (sin espacios)        |
| `description` | `string`   | ✅ Sí     | Descripción que aparecerá en Discord     |
| `category`    | `Category` | ❌ No     | Categoría del comando (default: `Other`) |
| `aliases`     | `string[]` | ❌ No     | Aliases para comandos de texto           |

### Ejemplo

```typescript
import { Category } from '@/utils/CommandCategories';

@Command({
    name: 'ban',
    description: 'Banea a un usuario del servidor',
    category: Category.Moderation, // Opcional
    aliases: ['banear', 'expulsar']
})
```

> **Nota:** Si no especificas `category`, el comando se asignará automáticamente a la categoría `Other`.

## 🎯 Decorador @Arg

Define un argumento del comando.

### Propiedades

| Propiedad     | Tipo       | Requerido | Descripción                         |
| ------------- | ---------- | --------- | ----------------------------------- |
| `name`        | `string`   | ✅ Sí     | Nombre del argumento                |
| `description` | `string`   | ✅ Sí     | Descripción del argumento           |
| `index`       | `number`   | ✅ Sí     | Posición del argumento (0, 1, 2...) |
| `required`    | `boolean`  | ❌ No     | Si es obligatorio (default: false)  |
| `validate`    | `function` | ❌ No     | Función de validación personalizada |

### Tipos Soportados

Los tipos se infieren automáticamente de TypeScript:

```typescript
// Tipos Primitivos
public texto!: string;        // String
public numero!: number;       // Number
public activo!: boolean;      // Boolean
public items!: Array<string>; // Array

// Tipos de Discord (resueltos automáticamente)
public usuario!: User;        // Usuario de Discord
public miembro!: GuildMember; // Miembro del servidor
public canal!: Channel;       // Canal de Discord
public rol!: Role;            // Rol del servidor
```

### Validación Personalizada

```typescript
@Arg({
    name: 'edad',
    description: 'Tu edad',
    index: 0,
    required: true,
    validate: (value: number) => {
        if (value < 18) {
            return 'Debes ser mayor de 18 años';
        }
        if (value > 120) {
            return 'Edad inválida';
        }
        return true; // Validación exitosa
    }
})
public edad!: number;
```

## 📚 Ejemplos Completos

### Ejemplo 1: Comando Simple

```typescript
import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@Command({
    name: 'say',
    description: 'Repite un mensaje',
    aliases: ['repetir', 'echo'],
})
export abstract class SayDefinition extends BaseCommand {
    @Arg({
        name: 'mensaje',
        description: 'El mensaje a repetir',
        index: 0,
        required: true,
    })
    public mensaje!: string;
}
```

### Ejemplo 2: Comando con Usuario

```typescript
import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { User } from 'discord.js';

@Command({
    name: 'hug',
    description: 'Abraza a un usuario',
    aliases: ['abrazar'],
})
export abstract class HugDefinition extends BaseCommand {
    @Arg({
        name: 'usuario',
        description: 'Usuario a abrazar',
        index: 0,
        required: true,
    })
    public usuario!: User;
}
```

### Ejemplo 3: Comando con Múltiples Argumentos

```typescript
import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { User } from 'discord.js';

@Command({
    name: 'warn',
    description: 'Advierte a un usuario',
    aliases: ['advertir', 'avisar'],
})
export abstract class WarnDefinition extends BaseCommand {
    @Arg({
        name: 'usuario',
        description: 'Usuario a advertir',
        index: 0,
        required: true,
    })
    public usuario!: User;

    @Arg({
        name: 'razon',
        description: 'Razón de la advertencia',
        index: 1,
        required: true,
        validate: (value: string) => {
            if (value.length < 10) {
                return 'La razón debe tener al menos 10 caracteres';
            }
            return true;
        },
    })
    public razon!: string;

    @Arg({
        name: 'duracion',
        description: 'Duración en días',
        index: 2,
        required: false,
        validate: (value: number) => {
            if (value < 1 || value > 30) {
                return 'La duración debe ser entre 1 y 30 días';
            }
            return true;
        },
    })
    public duracion?: number;
}
```

### Ejemplo 4: Comando con Validación Compleja

```typescript
import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@Command({
    name: 'transfer',
    description: 'Transfiere monedas a otro usuario',
    aliases: ['transferir', 'enviar'],
})
export abstract class TransferDefinition extends BaseCommand {
    @Arg({
        name: 'cantidad',
        description: 'Cantidad a transferir',
        index: 0,
        required: true,
        validate: (value: number) => {
            if (value <= 0) {
                return 'La cantidad debe ser mayor a 0';
            }
            if (value > 1000000) {
                return 'No puedes transferir más de 1,000,000 monedas';
            }
            if (!Number.isInteger(value)) {
                return 'La cantidad debe ser un número entero';
            }
            return true;
        },
    })
    public cantidad!: number;

    @Arg({
        name: 'destinatario',
        description: 'Usuario que recibirá las monedas',
        index: 1,
        required: true,
    })
    public destinatario!: User;
}
```

## ⚠️ Importante

### Clase Abstracta

La definición **DEBE** ser una clase abstracta:

```typescript
export abstract class MiDefinition extends BaseCommand {
    // ✅ Correcto
}
```

No:

```typescript
export class MiDefinition extends BaseCommand {
    // ❌ Incorrecto - no debe ser implementable directamente
}
```

### Extends BaseCommand

Toda definición **DEBE** extender de `BaseCommand`:

```typescript
export abstract class MiDefinition extends BaseCommand {
    // ✅ Correcto
}
```

### Propiedades con !

Los argumentos deben usar el operador `!` (non-null assertion):

```typescript
public argumento!: string;  // ✅ Correcto
public argumento: string;   // ❌ Incorrecto
```

## 🔄 Flujo de Trabajo

```
1. Crear definición → /src/definition/comando.definition.ts
                      ↓
2. Crear implementación → /src/commands/comando.command.ts
                      ↓
3. El sistema carga automáticamente
                      ↓
4. Comando disponible en Discord
```

## 📚 Recursos Relacionados

- `/src/commands/` - Implementaciones de comandos
- `/src/core/decorators/` - Código de los decoradores
- `/src/core/structures/BaseCommand.ts` - Clase base
- `ARCHITECTURE.md` - Arquitectura completa
