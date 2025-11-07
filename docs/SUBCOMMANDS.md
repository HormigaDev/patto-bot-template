# 📦 Subcomandos

## 📖 Descripción

Los subcomandos permiten agrupar funcionalidades relacionadas bajo un mismo comando padre, organizando mejor la estructura de comandos de tu bot. Por ejemplo: `/user info`, `/user avatar`, `/config get`, `/config set`.

## 🎯 Características

- ✅ Soporte nativo para slash commands y text commands
- ✅ Validación automática de subcomandos
- ✅ Archivos unificados o separados
- ✅ Retrocompatible con comandos sin subcomandos
- ✅ Errores descriptivos en español

## 🏗️ Implementación

### Opción 1: Archivo Unificado

Todos los subcomandos en un mismo archivo usando la propiedad `subcommands`.

**1. Crear Definition:**

```typescript
// src/definition/config.definition.ts
import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { CommandCategoryTag } from '@/utils/CommandCategories';

@Command({
    name: 'config',
    description: 'Gestiona la configuración del bot',
    category: CommandCategoryTag.Other,
    subcommands: ['get', 'set', 'list'], // ✅ Declarar subcomandos
})
export abstract class ConfigDefinition extends BaseCommand {
    @Arg({
        name: 'clave',
        description: 'La clave de configuración',
        index: 0,
        required: true,
        subcommands: ['get', 'set'], // ✅ Solo se usa en 'get' y 'set', no en 'list'
    })
    key!: string;

    @Arg({
        name: 'valor',
        description: 'El valor a establecer',
        index: 1,
        subcommands: ['set'], // ✅ Solo se usa en 'set'
    })
    value?: string;

    // run() debe existir pero no se ejecuta con subcomandos
    async run(): Promise<void> {}

    // ✅ Métodos abstractos para cada subcomando
    abstract subcommandGet(): Promise<void>;
    abstract subcommandSet(): Promise<void>;
    abstract subcommandList(): Promise<void>;
}
```

**2. Implementar Command:**

```typescript
// src/commands/other/config.command.ts
import { ConfigDefinition } from '@/definition/config.definition';

export class ConfigCommand extends ConfigDefinition {
    private static config = new Map<string, string>([
        ['prefix', '!'],
        ['language', 'es'],
    ]);

    // ✅ Implementar cada subcomando
    async subcommandGet(): Promise<void> {
        const value = ConfigCommand.config.get(this.key);
        // ... lógica
    }

    async subcommandSet(): Promise<void> {
        if (!this.value) return;
        ConfigCommand.config.set(this.key, this.value);
        // ... lógica
    }

    async subcommandList(): Promise<void> {
        // ... lógica
    }
}
```

### Opción 2: Archivos Separados

Cada subcomando en su propio archivo.

**1. Crear Definition para cada subcomando:**

```typescript
// src/definition/user.info.definition.ts
import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { User } from 'discord.js';

@Command({
    name: 'user info', // ✅ Nombre con espacio: "comando subcomando"
    description: 'Muestra información de un usuario',
    // ❌ NO usar 'subcommands' aquí
})
export abstract class UserInfoDefinition extends BaseCommand {
    @Arg({
        name: 'usuario',
        description: 'El usuario del que quieres ver información',
        index: 0,
    })
    targetUser?: User;
}
```

```typescript
// src/definition/user.avatar.definition.ts
@Command({
    name: 'user avatar', // ✅ "comando subcomando"
    description: 'Muestra el avatar de un usuario',
})
export abstract class UserAvatarDefinition extends BaseCommand {
    // ...
}
```

**2. Implementar cada Command:**

```typescript
// src/commands/user/user.info.command.ts
import { UserInfoDefinition } from '@/definition/user.info.definition';

export class UserInfoCommand extends UserInfoDefinition {
    async run(): Promise<void> {
        const targetUser = this.targetUser || this.user;
        // ... lógica
    }
}
```

```typescript
// src/commands/user/user.avatar.command.ts
import { UserAvatarDefinition } from '@/definition/user.avatar.definition';

export class UserAvatarCommand extends UserAvatarDefinition {
    async run(): Promise<void> {
        const targetUser = this.targetUser || this.user;
        // ... lógica
    }
}
```

## 📝 Convenciones

### Nombres de Archivos

**Unificado:**

- Definition: `config.definition.ts`
- Command: `config.command.ts`

**Separado:**

- Definition: `user.info.definition.ts`, `user.avatar.definition.ts`
- Command: `user.info.command.ts`, `user.avatar.command.ts`

### Nombres en @Command

**Unificado:**

```typescript
@Command({
    name: 'config', // Nombre base
    subcommands: ['get', 'set'], // Subcomandos
})
```

**Separado:**

```typescript
@Command({
    name: 'user info', // "comando subcomando" con espacio
    // NO usar 'subcommands'
})
```

### Nombres de Métodos

Los métodos de subcomandos deben seguir la convención `subcommand<Nombre>` con capitalización:

- `subcommands: ['get']` → `subcommandGet()`
- `subcommands: ['set']` → `subcommandSet()`
- `subcommands: ['deleteall']` → `subcommandDeleteall()`

## 🔄 Flujo de Ejecución

### Slash Commands

Discord maneja los subcomandos nativamente:

```
/config get clave       → Ejecuta subcommandGet()
/config set clave valor → Ejecuta subcommandSet()
```

### Text Commands

El framework maneja el primer argumento como subcomando:

```
!config get clave       → textArgs[0] = "get" → subcommandGet()
!config set clave valor → textArgs[0] = "set" → subcommandSet()
```

**⚠️ Importante:** Los argumentos `@Arg` mantienen sus índices originales, pero el framework ajusta internamente.

## ✅ Validaciones

El framework valida automáticamente:

1. **Tiempo de carga:**
    - ✅ Existencia de métodos `subcommand<Nombre>()`
    - ✅ Formato correcto de nombres de archivo separados

2. **Tiempo de ejecución:**
    - ✅ Subcomando especificado en text commands
    - ✅ Subcomando válido (existe en `subcommands`)

### Errores Descriptivos

```typescript
// ❌ Sin subcomando en text command
!config
// Error: "Debes especificar un subcomando. Disponibles: get, set, list"

// ❌ Subcomando inválido
!config delete
// Error: "Subcomando 'delete' no válido. Disponibles: get, set, list"

// ❌ Método faltante
@Command({ name: 'config', subcommands: ['get'] })
// Sin implementar subcommandGet()
// Error en carga: "El comando 'config' declara subcomandos pero faltan los siguientes métodos:
//                  - subcommandGet()"
```

## 📚 Comando Help

El comando `/help` muestra automáticamente los subcomandos:

```
/help config

Ayuda: config
Gestiona la configuración del bot

Subcomandos:
/config get - Obtiene el valor de una configuración
/config set - Establece el valor de una configuración
/config list - Lista todas las configuraciones
```

## 🎯 Mejores Prácticas

### ✅ DO (Hacer)

```typescript
// ✅ Nombres descriptivos en lowercase sin acentos
@Command({
    subcommands: ['get', 'set', 'delete'],
})

// ✅ Implementar todos los métodos requeridos
async subcommandGet() { }
async subcommandSet() { }
async subcommandDelete() { }

// ✅ Usar archivos separados para subcomandos complejos
// user.info.command.ts (50+ líneas de lógica)
// user.avatar.command.ts (30+ líneas de lógica)

// ✅ Usar archivo unificado para subcomandos simples
@Command({ subcommands: ['get', 'set'] })

// ✅ Especificar subcommands en @Arg para archivos unificados
@Command({
    subcommands: ['get', 'set', 'list'],
})
export abstract class ConfigDefinition extends BaseCommand {
    @Arg({
        name: 'clave',
        index: 0,
        subcommands: ['get', 'set'], // ✅ Solo en 'get' y 'set', no en 'list'
    })
    key!: string;

    @Arg({
        name: 'valor',
        index: 1,
        subcommands: ['set'], // ✅ Solo en 'set'
    })
    value?: string;
}
```

### ❌ DON'T (No hacer)

```typescript
// ❌ Nombres con mayúsculas, acentos o espacios
@Command({
    subcommands: ['Get', 'configuración', 'set config'],
})
// ❌ No implementar métodos requeridos
@Command({ subcommands: ['get', 'set'] })
// Sin subcommandGet() o subcommandSet()

// ❌ Mezclar estilos
@Command({
    name: 'config get', // ❌ No combinar nombre con espacio y subcommands
    subcommands: ['set'],
})
// ❌ Usar 'subcommands' en archivos separados
// user.info.definition.ts
@Command({
    name: 'user info',
    subcommands: ['avatar'], // ❌ Innecesario
})
// ❌ No especificar subcommands en @Arg cuando el argumento no se usa en todos
@Command({
    subcommands: ['get', 'set', 'list'],
})
export abstract class ConfigDefinition extends BaseCommand {
    @Arg({
        name: 'valor',
        index: 1,
        // ❌ Sin 'subcommands', se registra en TODOS (get, set, list)
        // pero solo se usa en 'set'
    })
    value?: string;
}
```

## 🔍 Ejemplos Completos

Ver los archivos de ejemplo en el proyecto:

### Archivo Unificado

- `/src/definition/config.definition.ts`
- `/src/commands/other/config.command.ts`

### Archivos Separados

- `/src/definition/user.info.definition.ts`
- `/src/commands/user/user.info.command.ts`
- `/src/definition/user.avatar.definition.ts`
- `/src/commands/user/user.avatar.command.ts`

## 🚨 Troubleshooting

### "El comando declara subcomandos pero faltan los siguientes métodos"

**Problema:** Falta implementar un método `subcommand<Name>()`.

**Solución:** Verifica que el nombre esté correctamente capitalizado:

```typescript
subcommands: ['get'] → subcommandGet() ✅
subcommands: ['get'] → subcommandget() ❌
```

### "Subcomando no válido"

**Problema:** Usuario usó un subcomando no declarado.

**Solución:** Agrega el subcomando a la lista:

```typescript
@Command({
    subcommands: ['get', 'set', 'delete'], // Agregar 'delete'
})
```

### Argumentos no se resuelven correctamente

**Problema:** Los índices de argumentos no coinciden.

**Solución:** Recuerda que en text commands con subcomandos, el subcomando NO consume un índice de `@Arg`. El framework ajusta automáticamente.

---

¿Tienes dudas? Revisa los ejemplos en `/src/commands/` o consulta la documentación de comandos básicos.
