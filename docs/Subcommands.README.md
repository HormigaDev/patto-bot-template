# 📘 Subcomandos

Los **subcomandos** permiten agrupar funcionalidades relacionadas bajo un comando padre, creando una estructura de 2 niveles: `comando subcomando`.

## 📋 Índice

- [¿Qué son los Subcomandos?](#-qué-son-los-subcomandos)
- [Cuándo Usar Subcomandos](#-cuándo-usar-subcomandos)
- [Sintaxis Básica](#-sintaxis-básica)
- [Ejemplos Prácticos](#-ejemplos-prácticos)
- [Estructura de Archivos](#-estructura-de-archivos)
- [Uso en Discord](#-uso-en-discord)
- [Mejores Prácticas](#-mejores-prácticas)
- [Diferencias con Grupos](#-diferencias-con-grupos-de-subcomandos)

---

## 🎯 ¿Qué son los Subcomandos?

Los subcomandos son comandos que existen dentro de un comando padre, permitiendo organizar funcionalidades relacionadas de manera jerárquica.

**Estructura:** `comando subcomando [argumentos]`

**Ejemplo:**

```
/config get
/config set theme dark
!config get
!config set theme dark
```

---

## 🤔 Cuándo Usar Subcomandos

Usa subcomandos cuando:

✅ Tienes funcionalidades relacionadas que comparten un contexto  
✅ Quieres evitar la proliferación de comandos en el nivel raíz  
✅ Necesitas agrupar operaciones CRUD (get, set, delete, etc.)  
✅ Las operaciones son simples y no requieren más anidamiento

❌ **NO uses subcomandos cuando:**

- Necesitas más de 2 niveles de anidamiento → Usa `@SubcommandGroup`
- Los comandos no están relacionados → Usa comandos base separados
- Tienes muchos subcomandos (>10) → Considera reorganizar en grupos

---

## 📝 Sintaxis Básica

### Decorador `@Subcommand`

```typescript
import { Subcommand } from '@/core/decorators/subcommand.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@Subcommand({
    parent: 'config', // Nombre del comando padre
    name: 'get', // Nombre del subcomando
    description: 'Ver config', // Descripción del subcomando
    category: 'Utility', // (Opcional) Categoría
})
export class ConfigGetCommand extends BaseCommand {
    async run(): Promise<void> {
        await this.reply('Configuración actual...');
    }
}
```

### Propiedades del Decorador

| Propiedad     | Tipo       | Requerido | Descripción                    |
| ------------- | ---------- | --------- | ------------------------------ |
| `parent`      | `string`   | ✅        | Nombre del comando padre       |
| `name`        | `string`   | ✅        | Nombre del subcomando          |
| `description` | `string`   | ✅        | Descripción visible en Discord |
| `category`    | `Category` | ❌        | Categoría para organización    |

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Subcomandos de Configuración

```typescript
// src/commands/config/get.command.ts
import { Subcommand } from '@/core/decorators/subcommand.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@Subcommand({
    parent: 'config',
    name: 'get',
    description: 'Ver la configuración actual',
    category: 'Utility',
})
export class ConfigGetCommand extends BaseCommand {
    async run(): Promise<void> {
        const config = await this.getServerConfig();
        await this.reply(`Configuración actual:\n${config}`);
    }
}
```

```typescript
// src/commands/config/set.command.ts
import { Subcommand } from '@/core/decorators/subcommand.decorator';
import { Arg } from '@/core/decorators/argument.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@Subcommand({
    parent: 'config',
    name: 'set',
    description: 'Cambiar la configuración',
    category: 'Utility',
})
export class ConfigSetCommand extends BaseCommand {
    @Arg({
        name: 'key',
        description: 'Clave de configuración',
        required: true,
        options: [
            { label: 'Tema', value: 'theme' },
            { label: 'Idioma', value: 'language' },
            { label: 'Prefijo', value: 'prefix' },
        ],
    })
    key!: string;

    @Arg({
        name: 'value',
        description: 'Nuevo valor',
        required: true,
    })
    value!: string;

    async run(): Promise<void> {
        await this.updateConfig(this.key, this.value);
        await this.reply(`✅ Configuración actualizada: ${this.key} = ${this.value}`);
    }
}
```

### Ejemplo 2: Subcomandos de Moderación

```typescript
// src/commands/moderation/warn.command.ts
import { Subcommand } from '@/core/decorators/subcommand.decorator';
import { Arg } from '@/core/decorators/argument.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { User } from 'discord.js';

@Subcommand({
    parent: 'mod',
    name: 'warn',
    description: 'Advertir a un usuario',
    category: 'Moderation',
})
export class ModWarnCommand extends BaseCommand {
    @Arg({
        name: 'user',
        description: 'Usuario a advertir',
        required: true,
        type: () => User,
    })
    user!: User;

    @Arg({
        name: 'reason',
        description: 'Razón de la advertencia',
        required: false,
        rawText: true, // Captura todo el texto restante
    })
    reason?: string;

    async run(): Promise<void> {
        const reason = this.reason || 'Sin razón especificada';
        await this.warnUser(this.user, reason);
        await this.reply(`⚠️ ${this.user.tag} ha sido advertido.\nRazón: ${reason}`);
    }
}
```

---

## 📁 Estructura de Archivos

### Organización Recomendada

```
src/commands/
├── config/                    # Carpeta del comando padre (SIN archivo base)
│   ├── get.command.ts        # Subcomando: config get
│   ├── set.command.ts        # Subcomando: config set
│   └── reset.command.ts      # Subcomando: config reset
├── mod/                       # Carpeta de moderación (SIN archivo base)
│   ├── warn.command.ts       # Subcomando: mod warn
│   ├── kick.command.ts       # Subcomando: mod kick
│   └── ban.command.ts        # Subcomando: mod ban
└── info/                      # Comandos base simples
    ├── help.command.ts
    └── ping.command.ts
```

> **⚡ Importante:** **NO necesitas crear un archivo `config.command.ts` o `mod.command.ts`**. El sistema crea automáticamente el comando padre como "fantasma" en Discord. Solo crea los archivos de los subcomandos.

### Ventajas de esta Estructura

✅ **Sin overhead** - No creas archivos vacíos innecesarios  
✅ **DX mejorada** - Solo defines lo que realmente ejecuta lógica  
✅ **Organización clara** - Cada comando padre tiene su propia carpeta  
✅ **Fácil mantenimiento** - Todos los subcomandos relacionados están juntos  
✅ **Escalabilidad** - Fácil agregar más subcomandos  
✅ **Menos verboso** - Código limpio y al grano

---

## 🎮 Uso en Discord

### Slash Commands

Discord agrupa automáticamente los subcomandos:

```
/config
  ├─ get      Ver la configuración actual
  ├─ set      Cambiar la configuración
  └─ reset    Restaurar configuración por defecto
```

### Text Commands

Los usuarios pueden usar el prefijo configurado:

```
!config get
!config set theme dark
!config reset
```

---

## ✨ Mejores Prácticas

### 1. Nombrado Consistente

```typescript
// ✅ BIEN - Verbos claros y consistentes
@Subcommand({ parent: 'user', name: 'create', ... })
@Subcommand({ parent: 'user', name: 'delete', ... })
@Subcommand({ parent: 'user', name: 'update', ... })

// ❌ EVITAR - Nombres inconsistentes
@Subcommand({ parent: 'user', name: 'make', ... })
@Subcommand({ parent: 'user', name: 'remove', ... })
@Subcommand({ parent: 'user', name: 'change', ... })
```

### 2. Descripciones Claras

```typescript
// ✅ BIEN - Descripción específica y útil
@Subcommand({
    parent: 'config',
    name: 'set',
    description: 'Cambiar un valor de configuración del servidor',
})

// ❌ EVITAR - Descripción vaga
@Subcommand({
    parent: 'config',
    name: 'set',
    description: 'Configurar algo',
})
```

### 3. Límite de Subcomandos

- **Máximo recomendado:** 10 subcomandos por comando padre
- Si necesitas más, considera usar grupos de subcomandos

### 4. Argumentos Apropiados

```typescript
// ✅ BIEN - Argumentos específicos para el subcomando
@Subcommand({ parent: 'config', name: 'set', ... })
export class ConfigSetCommand extends BaseCommand {
    @Arg({ name: 'key', required: true, options: [...] })
    key!: string;

    @Arg({ name: 'value', required: true })
    value!: string;
}

// ❌ EVITAR - Demasiados argumentos opcionales
@Subcommand({ parent: 'config', name: 'set', ... })
export class ConfigSetCommand extends BaseCommand {
    @Arg({ name: 'key', required: false })
    key?: string;

    @Arg({ name: 'value', required: false })
    value?: string;

    @Arg({ name: 'option1', required: false })
    option1?: string;
    // ... más argumentos
}
```

### 5. Categorización Lógica

```typescript
// Agrupa subcomandos relacionados bajo el mismo padre
@Subcommand({ parent: 'server', name: 'info', category: 'Info' })
@Subcommand({ parent: 'server', name: 'stats', category: 'Info' })
@Subcommand({ parent: 'server', name: 'members', category: 'Info' })
```

---

## 🔄 Diferencias con Grupos de Subcomandos

| Característica     | Subcomandos                      | Grupos de Subcomandos                 |
| ------------------ | -------------------------------- | ------------------------------------- |
| **Niveles**        | 2 (`comando subcomando`)         | 3 (`comando grupo subcomando`)        |
| **Decorador**      | `@Subcommand`                    | `@SubcommandGroup`                    |
| **Uso típico**     | Operaciones simples              | Operaciones complejas organizadas     |
| **Límite Discord** | 25 por comando                   | 25 grupos, 25 subcomandos por grupo   |
| **Cuándo usar**    | Funcionalidad simple relacionada | Múltiples categorías de funcionalidad |

### Ejemplo de Cuándo Usar Cada Uno

**Usa `@Subcommand`:**

```
/config get
/config set
/config reset
```

**Usa `@SubcommandGroup`:**

```
/server config get
/server config set
/server user info
/server user list
```

---

## 📚 Recursos Adicionales

- [Grupos de Subcomandos](./SubcommandGroups.README.md) - Para anidamiento de 3 niveles
- [Decoradores de Comandos](../src/core/decorators/README.md) - Documentación de decoradores
- [Ejemplos de Comandos](../src/commands/README.md) - Más ejemplos prácticos

---

## ❓ FAQ

### ¿Puedo mezclar comandos base con subcomandos?

Sí, puedes tener comandos base (`@Command`) y subcomandos (`@Subcommand`) en la misma aplicación.

### ¿Los subcomandos heredan permisos del comando padre?

No automáticamente. Debes aplicar `@RequirePermissions` a cada subcomando si lo necesitas.

### ¿Cuántos subcomandos puedo tener?

Discord permite hasta 25 opciones por comando, pero recomendamos máximo 10 para mejor UX.

### ¿Puedo tener argumentos en el comando padre?

No, en Discord los argumentos solo se definen en los subcomandos, no en el comando padre.

### ¿Necesito crear un comando base para los subcomandos?

**No es necesario.** El sistema crea automáticamente "comandos fantasma" cuando detecta subcomandos sin comando base:

```typescript
// Solo defines esto:
@Subcommand({
    parent: 'config',  // No existe como @Command
    name: 'get',
    description: 'Ver configuración'
})
```

El sistema:

1. Detecta que `config` no existe como comando base
2. Crea automáticamente `/config` en Discord como contenedor
3. Registra `get` como subcomando de `config`
4. Log: `👻 Comando fantasma creado: "config" (solo contenedor de subcomandos)`

**Ventaja:** No necesitas crear archivos vacíos solo como contenedores.

---

**Versión:** 1.1.0  
**Última actualización:** 2025-11-12
