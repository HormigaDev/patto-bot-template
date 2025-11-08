# 📦 Subcomandos

## 📖 Descripción

Los subcomandos permiten agrupar funcionalidades relacionadas bajo un mismo comando padre, organizando mejor la estructura de comandos de tu bot. Discord soporta hasta **3 niveles** de comandos: comando → grupo → subcomando.

**Ejemplos:**

- 2 niveles: `/user info`, `/user avatar`, `/config get`
- 3 niveles: `/server config get`, `/server config set`, `/admin roles add`

## 🎯 Características

- ✅ Soporte nativo para slash commands y text commands
- ✅ **Hasta 3 niveles** de comandos (comando → grupo → subcomando)
- ✅ Validación automática de subcomandos
- ✅ Archivos unificados o separados
- ✅ **Soporte para kebab-case** (`delete-all` → `subcommandDeleteAll()`)
- ✅ Grupos de subcomandos automáticos
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
// src/definition/user-info.definition.ts
import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { User } from 'discord.js';

@Command({
    name: 'user info', // ✅ Nombre con espacio en metadata (Discord API)
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
// src/definition/user-avatar.definition.ts
@Command({
    name: 'user avatar', // ✅ "comando subcomando" en metadata
    description: 'Muestra el avatar de un usuario',
})
export abstract class UserAvatarDefinition extends BaseCommand {
    // ...
}
```

⚠️ **Nota**: El archivo se llama `user-info.definition.ts` (con guiones), pero el `name` en `@Command` es `'user info'` (con espacios) para Discord API.

**2. Implementar cada Command:**

```typescript
// src/commands/user/user-info.command.ts
import { UserInfoDefinition } from '@/definition/user-info.definition';

export class UserInfoCommand extends UserInfoDefinition {
    async run(): Promise<void> {
        const targetUser = this.targetUser || this.user;
        // ... lógica
    }
}
```

```typescript
// src/commands/user/user-avatar.command.ts
import { UserAvatarDefinition } from '@/definition/user-avatar.definition';

export class UserAvatarCommand extends UserAvatarDefinition {
    async run(): Promise<void> {
        const targetUser = this.targetUser || this.user;
        // ... lógica
    }
}
```

## 📝 Convenciones

### ⚠️ Convención Crítica: Nombres de Archivos vs Metadata

**Regla de oro:** Los nombres de archivos y el metadata `@Command` usan formatos diferentes:

| Contexto                | Formato              | Ejemplo                |
| ----------------------- | -------------------- | ---------------------- |
| **Nombre de archivo**   | kebab-case (guiones) | `user-info.command.ts` |
| **Metadata `@Command`** | Espacios             | `name: 'user info'`    |

**¿Por qué esta diferencia?**

- **Archivos con kebab-case**: Evita problemas en sistemas operativos (Windows, Linux, macOS) donde los espacios en rutas pueden causar errores
- **Metadata con espacios**: Discord API requiere espacios para separar comando/grupo/subcomando

**Ejemplo completo:**

```typescript
// Archivo: src/definition/server-config-get.definition.ts (CON GUIONES)
// ✅ Nombre de archivo: server-config-get.definition.ts

@Command({
    name: 'server config get', // ✅ Metadata: CON ESPACIOS
    description: 'Obtiene configuración del servidor',
})
export abstract class ServerConfigGetDefinition extends BaseCommand {
    // ...
}
```

### Límite de Niveles

Discord soporta **máximo 3 niveles** de comandos:

```
Nivel 1: Comando base      (/server)
Nivel 2: Grupo/Subcomando  (config)
Nivel 3: Subcomando        (get)
```

**Válido:**

- ✅ `/user` (1 nivel)
- ✅ `/user info` (2 niveles)
- ✅ `/server config get` (3 niveles)

**Inválido:**

- ❌ `/server admin config get` (4 niveles - excede el límite)

### Nombres de Archivos

**Formato:** kebab-case (lowercase con guiones separando palabras), solo letras, números y guiones.

⚠️ **Importante**: NO usar espacios en nombres de archivos ya que pueden causar problemas de rutas en algunos sistemas operativos.

**Unificado (1 nivel):**

- `config.definition.ts` / `config.command.ts`
- `user.definition.ts` / `user.command.ts`

**Separado (2 niveles):**

- `user-info.definition.ts` / `user-info.command.ts`
- `user-avatar.definition.ts` / `user-avatar.command.ts`
- `config-get.definition.ts` / `config-get.command.ts`

**Separado (3 niveles):**

- `server-config-get.definition.ts` / `server-config-get.command.ts`
- `server-config-set.definition.ts` / `server-config-set.command.ts`
- `server-roles-add.definition.ts` / `server-roles-add.command.ts`

**Válidos:**

- ✅ `config.command.ts` (1 nivel)
- ✅ `user-info.command.ts` (2 niveles)
- ✅ `server-config-get.command.ts` (3 niveles)
- ✅ `delete-all.command.ts` (nombre con guiones)

**Inválidos:**

- ❌ `Config.command.ts` (mayúscula)
- ❌ `user_info.command.ts` (underscore)
- ❌ `user info.command.ts` (espacios - NO permitido)
- ❌ `server-admin-config-get.command.ts` (4 niveles - excede límite Discord)

### Nombres en @Command

**Unificado:**

```typescript
@Command({
    name: 'config', // Nombre base
    subcommands: ['get', 'set', 'delete-all'], // Subcomandos (soporta kebab-case)
})
```

**Separado:**

```typescript
@Command({
    name: 'user info', // ✅ "comando subcomando" con espacio (SOLO en metadata)
    // NO usar 'subcommands'
})

@Command({
    name: 'server config get', // ✅ 3 niveles: "comando grupo subcomando" (SOLO en metadata)
})
```

⚠️ **Nota importante:** Los espacios SOLO se usan en el metadata `name` del decorador `@Command`. Los nombres de archivos SIEMPRE deben usar kebab-case (`user-info.command.ts`, NO `user info.command.ts`).

### Nombres de Métodos

Los métodos de subcomandos siguen la convención `subcommand<CamelCase>`:

**Conversión automática de kebab-case a camelCase:**

- `'get'` → `subcommandGet()`
- `'set'` → `subcommandSet()`
- `'delete-all'` → `subcommandDeleteAll()`
- `'my-long-command'` → `subcommandMyLongCommand()`

**Ejemplo:**

```typescript
@Command({
    name: 'config',
    subcommands: ['get', 'set', 'delete-all'], // ✅ kebab-case permitido
})
export abstract class ConfigDefinition extends BaseCommand {
    async run(): Promise<void> {}

    abstract subcommandGet(): Promise<void>;
    abstract subcommandSet(): Promise<void>;
    abstract subcommandDeleteAll(): Promise<void>; // ✅ Convertido a camelCase
}
```

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
// user-info.command.ts (50+ líneas de lógica)
// user-avatar.command.ts (30+ líneas de lógica)

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
// user-info.definition.ts
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

## 🎯 Ejemplo de 3 Niveles (Comando → Grupo → Subcomando)

Discord soporta agrupar subcomandos en grupos, creando una estructura de 3 niveles.

### Opción A: Archivos Separados (Recomendado)

**Estructura de archivos:**

```
src/
  definition/
    server-config-get.definition.ts
    server-config-set.definition.ts
    server-roles-add.definition.ts
    server-roles-remove.definition.ts
  commands/
    server/
      server-config-get.command.ts
      server-config-set.command.ts
      server-roles-add.command.ts
      server-roles-remove.command.ts
```

⚠️ **Importante**: Los nombres de archivos usan kebab-case (guiones), NO espacios.

**Ejemplo: `/server config get`**

```typescript
// src/definition/server-config-get.definition.ts
import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { CommandCategoryTag } from '@/utils/CommandCategories';

@Command({
    name: 'server config get', // ✅ 3 niveles con espacios (SOLO en metadata)
    description: 'Obtiene una configuración del servidor',
    category: CommandCategoryTag.Admin,
})
export abstract class ServerConfigGetDefinition extends BaseCommand {
    @Arg({
        name: 'clave',
        description: 'La clave de configuración',
        index: 0,
        required: true,
    })
    key!: string;
}
```

```typescript
// src/commands/server/server-config-get.command.ts
import { ServerConfigGetDefinition } from '@/definition/server-config-get.definition';

export class ServerConfigGetCommand extends ServerConfigGetDefinition {
    async run(): Promise<void> {
        await this.reply(`El valor de ${this.key} es: ...`);
    }
}
```

**Resultado en Discord:**

```
/server
  ├─ config (SubcommandGroup)
  │   ├─ get
  │   └─ set
  └─ roles (SubcommandGroup)
      ├─ add
      └─ remove
```

### Opción B: Archivo Unificado con Auto-agrupamiento

El sistema automáticamente agrupa subcomandos con prefijos comunes:

```typescript
// src/definition/server.definition.ts
@Command({
    name: 'server',
    description: 'Comandos de administración del servidor',
    category: CommandCategoryTag.Admin,
    subcommands: [
        'config get', // Grupo: config, Subcomando: get
        'config set', // Grupo: config, Subcomando: set
        'roles add', // Grupo: roles, Subcomando: add
        'roles remove', // Grupo: roles, Subcomando: remove
    ],
})
export abstract class ServerDefinition extends BaseCommand {
    @Arg({
        name: 'clave',
        description: 'Clave de configuración',
        index: 0,
        required: true,
        subcommands: ['config get', 'config set'], // ✅ Solo en estos subcomandos
    })
    key?: string;

    async run(): Promise<void> {}

    // ✅ Métodos con espacios convertidos a camelCase
    abstract subcommandConfigGet(): Promise<void>; // "config get" → ConfigGet
    abstract subcommandConfigSet(): Promise<void>; // "config set" → ConfigSet
    abstract subcommandRolesAdd(): Promise<void>; // "roles add" → RolesAdd
    abstract subcommandRolesRemove(): Promise<void>; // "roles remove" → RolesRemove
}
```

```typescript
// src/commands/admin/server.command.ts
import { ServerDefinition } from '@/definition/server.definition';

export class ServerCommand extends ServerDefinition {
    async subcommandConfigGet(): Promise<void> {
        await this.reply(`Configuración ${this.key}: ...`);
    }

    async subcommandConfigSet(): Promise<void> {
        await this.reply(`Configuración ${this.key} actualizada`);
    }

    async subcommandRolesAdd(): Promise<void> {
        await this.reply('Rol agregado');
    }

    async subcommandRolesRemove(): Promise<void> {
        await this.reply('Rol eliminado');
    }
}
```

**Uso:**

```
/server config get clave    → subcommandConfigGet()
/server config set clave    → subcommandConfigSet()
/server roles add rol       → subcommandRolesAdd()
!server config get clave    → subcommandConfigGet()
```

## 🔍 Ejemplos Completos

Ver los archivos de ejemplo en el proyecto:

### Archivo Unificado

- `/src/definition/config.definition.ts`
- `/src/commands/other/config.command.ts`

### Archivos Separados

- `/src/definition/user-info.definition.ts`
- `/src/commands/user/user-info.command.ts`
- `/src/definition/user-avatar.definition.ts`
- `/src/commands/user/user-avatar.command.ts`

⚠️ **Nota**: Los archivos usan kebab-case (guiones), pero el `name` en `@Command` usa espacios para Discord API.

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
