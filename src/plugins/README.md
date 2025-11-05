# Carpeta: Plugins

## 📖 Descripción

Esta carpeta contiene **plugins** que extienden la funcionalidad de los comandos sin modificar su código. Los plugins se ejecutan **antes** (`onBeforeExecute`) o **después** (`onAfterExecute`) de la ejecución de un comando.

## 🎯 ¿Qué es un Plugin?

Un plugin es una clase que hereda de `BasePlugin` e implementa uno o ambos métodos:

-   🔵 **`onBeforeExecute`**: Se ejecuta **antes** del comando y retorna un booleano
    -   `return true`: Continúa con la ejecución del comando
    -   `return false`: Cancela la ejecución silenciosamente (sin mensaje de error)
    -   `throw Error`: Cancela la ejecución y muestra un mensaje de error
-   🟢 **`onAfterExecute`**: Se ejecuta **después** del comando (solo si no hubo errores)

## 🚀 Casos de Uso

### 🔵 Plugins `onBeforeExecute`

Validaciones y verificaciones **antes** de ejecutar el comando:

-   ✅ **Cooldowns**: Verificar si el usuario puede usar el comando
-   ✅ **Permisos**: Validar roles o permisos específicos
-   ✅ **Rate Limiting**: Limitar uso por usuario/servidor
-   ✅ **Mantenimiento**: Bloquear comandos durante mantenimiento
-   ✅ **Blacklist**: Prevenir uso de usuarios/servidores bloqueados
-   ✅ **Validaciones custom**: Cualquier validación previa

### 🟢 Plugins `onAfterExecute`

Acciones **después** de ejecutar exitosamente el comando:

-   ✅ **Logging**: Registrar uso de comandos
-   ✅ **Analytics**: Estadísticas de uso
-   ✅ **Cooldown**: Establecer cooldown después de usar comando
-   ✅ **Recompensas**: Dar puntos/experiencia por usar comandos
-   ✅ **Notificaciones**: Alertar admins de comandos críticos
-   ✅ **Cleanup**: Limpiar recursos temporales

## 🏗️ Estructura de un Plugin

```typescript
import { BasePlugin } from '@/core/structures/BasePlugin';
import { BaseCommand } from '@/core/structures/BaseCommand';

export class MiPlugin extends BasePlugin {
    // Ejecutar ANTES del comando
    async onBeforeExecute(command: BaseCommand): Promise<boolean> {
        // Validaciones aquí

        // Opción 1: Cancelar con mensaje de error
        if (someCondition) {
            throw new ReplyError('Mensaje de error');
        }

        // Opción 2: Cancelar silenciosamente (sin mensaje)
        if (anotherCondition) {
            return false;
        }

        // Opción 3: Continuar con la ejecución
        return true;
    }

    // Ejecutar DESPUÉS del comando (opcional)
    async onAfterExecute(command: BaseCommand): Promise<void> {
        // Acciones después de ejecutar
    }
}
```

## 📝 Ejemplo 1: Plugin de Cooldown

```typescript
// src/plugins/cooldown.plugin.ts
import { BasePlugin } from '@/core/structures/BasePlugin';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { ReplyError } from '@/error/ReplyError';

export class CooldownPlugin extends BasePlugin {
    private cooldowns = new Map<string, number>();
    private readonly cooldownTime = 5000; // 5 segundos

    async onBeforeExecute(command: BaseCommand): Promise<boolean> {
        const key = `${command.user.id}-${command.constructor.name}`;
        const now = Date.now();
        const cooldownEnd = this.cooldowns.get(key);

        if (cooldownEnd && now < cooldownEnd) {
            const timeLeft = Math.ceil((cooldownEnd - now) / 1000);
            throw new ReplyError(
                `⏱️ Debes esperar ${timeLeft}s antes de usar este comando de nuevo.`,
            );
        }

        return true; // Continuar con la ejecución
    }

    async onAfterExecute(command: BaseCommand): Promise<void> {
        const key = `${command.user.id}-${command.constructor.name}`;
        const cooldownEnd = Date.now() + this.cooldownTime;
        this.cooldowns.set(key, cooldownEnd);

        // Limpiar cooldown después de tiempo
        setTimeout(() => {
            this.cooldowns.delete(key);
        }, this.cooldownTime);
    }
}
```

## 📝 Ejemplo 2: Plugin de Permisos por Rol

```typescript
// src/plugins/role-permission.plugin.ts
import { BasePlugin } from '@/core/structures/BasePlugin';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { ReplyError } from '@/error/ReplyError';

export class RolePermissionPlugin extends BasePlugin {
    private requiredRoles = ['Admin', 'Moderador'];

    async onBeforeExecute(command: BaseCommand): Promise<boolean> {
        const member = command.ctx.member;

        if (!member) {
            throw new ReplyError('Este comando solo funciona en servidores');
        }

        const hasRole = this.requiredRoles.some((roleName) =>
            member.roles.cache.some((role) => role.name === roleName),
        );

        if (!hasRole) {
            throw new ReplyError(
                `⛔ Necesitas uno de estos roles: ${this.requiredRoles.join(', ')}`,
            );
        }

        return true; // Continuar con la ejecución
    }
}
```

## 📝 Ejemplo 3: Plugin de Logging

```typescript
// src/plugins/command-logger.plugin.ts
import { BasePlugin } from '@/core/structures/BasePlugin';
import { BaseCommand } from '@/core/structures/BaseCommand';

export class CommandLoggerPlugin extends BasePlugin {
    async onBeforeExecute(command: BaseCommand): Promise<boolean> {
        console.log(
            `📥 [${new Date().toISOString()}] ${command.user.tag} está ejecutando: ${
                command.constructor.name
            }`,
        );
        return true; // Continuar con la ejecución
    }

    async onAfterExecute(command: BaseCommand): Promise<void> {
        console.log(
            `✅ [${new Date().toISOString()}] ${command.user.tag} completó: ${
                command.constructor.name
            }`,
        );
    }
}
```

## 📝 Ejemplo 4: Plugin de Rate Limiting

```typescript
// src/plugins/rate-limit.plugin.ts
import { BasePlugin } from '@/core/structures/BasePlugin';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { ReplyError } from '@/error/ReplyError';

export class RateLimitPlugin extends BasePlugin {
    private usage = new Map<string, number[]>();
    private readonly maxRequests = 3;
    private readonly timeWindow = 10000; // 10 segundos

    async onBeforeExecute(command: BaseCommand): Promise<boolean> {
        const key = command.user.id;
        const now = Date.now();
        const userRequests = this.usage.get(key) || [];

        // Filtrar requests dentro de la ventana de tiempo
        const recentRequests = userRequests.filter(
            (timestamp) => now - timestamp < this.timeWindow,
        );

        if (recentRequests.length >= this.maxRequests) {
            throw new ReplyError(
                `🚫 Has usado demasiados comandos. Espera ${Math.ceil(this.timeWindow / 1000)}s.`,
            );
        }

        // Agregar request actual
        recentRequests.push(now);
        this.usage.set(key, recentRequests);

        return true; // Continuar con la ejecución
    }
}
```

## � Ejemplo 5: Plugin de Cancelación Silenciosa

Este ejemplo muestra cómo cancelar un comando **sin mostrar ningún mensaje de error** al usuario:

```typescript
// src/plugins/silent-cooldown.plugin.ts
import { BasePlugin } from '@/core/structures/BasePlugin';
import { BaseCommand } from '@/core/structures/BaseCommand';

export class SilentCooldownPlugin extends BasePlugin {
    private cooldowns = new Map<string, number>();
    private readonly cooldownTime = 3000; // 3 segundos

    async onBeforeExecute(command: BaseCommand): Promise<boolean> {
        const key = `${command.user.id}-${command.constructor.name}`;
        const now = Date.now();
        const cooldownEnd = this.cooldowns.get(key);

        // Si está en cooldown, cancelar SILENCIOSAMENTE
        if (cooldownEnd && now < cooldownEnd) {
            return false; // ❌ Cancela sin mostrar error
        }

        // Establecer cooldown
        this.cooldowns.set(key, now + this.cooldownTime);

        return true; // ✅ Continuar con la ejecución
    }
}
```

**Comparación:**

-   ✅ `return true` → El comando se ejecuta normalmente
-   ❌ `return false` → El comando se cancela sin mensaje de error (silencioso)
-   💥 `throw new ReplyError(...)` → El comando se cancela y se muestra un embed de error

## �🔧 Cómo Registrar Plugins

Existen **dos formas** de registrar plugins, con diferentes prioridades:

### ✅ Método 1: Por Scope (Recomendado)

Configuración centralizada en `/src/config/plugins.config.ts`.

**Ventajas:**

-   ✅ Centralizado en un solo archivo
-   ✅ Aplica a múltiples comandos
-   ✅ Fácil de mantener
-   ✅ Soporte para carpetas y comandos específicos

```typescript
// src/config/plugins.config.ts
import { PluginRegistry, PluginScope } from './plugin.registry';
import { CooldownPlugin } from '@/plugins/cooldown.plugin';

// Global: Todos los comandos
PluginRegistry.register({
    plugin: new CooldownPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: '', // Raíz = todos los comandos
});

// Carpeta específica: Solo /src/commands/admin/
PluginRegistry.register({
    plugin: new RolePermissionPlugin(),
    scope: PluginScope.Folder,
    folderPath: 'admin',
});

// Comandos específicos
import { BanCommand } from '@/commands/ban.command';
import { KickCommand } from '@/commands/kick.command';

PluginRegistry.register({
    plugin: new AuditLogPlugin(),
    scope: PluginScope.Specified,
    commands: [BanCommand, KickCommand],
});
```

**Ver:** [`/src/config/README.md`](../config/README.md) para documentación completa de scopes.

### ✅ Método 2: Por Decorador

Usando el decorador `@UsePlugins` directamente en el comando.

**Ventajas:**

-   ✅ Configuración visible en el comando
-   ✅ Máxima prioridad de ejecución
-   ✅ Ideal para plugins únicos de un comando

```typescript
// src/commands/ban.command.ts
import { Command } from '@/core/decorators/command.decorator';
import { UsePlugins } from '@/core/decorators/plugin.decorator';
import { BanDefinition } from '@/definition/ban.definition';
import { RolePermissionPlugin } from '@/plugins/role-permission.plugin';
import { AuditLogPlugin } from '@/plugins/audit-log.plugin';

@Command({ name: 'ban' })
@UsePlugins(RolePermissionPlugin, AuditLogPlugin)
export class BanCommand extends BanDefinition {
    async run(): Promise<void> {
        // Lógica del comando
    }
}
```

### 🔄 Combinando Ambos Métodos

Puedes usar ambos métodos simultáneamente. El orden de ejecución es:

1. **Plugins de `@UsePlugins`** (decorador) - Máxima prioridad
2. **Plugins de scope** (registry) - En orden de registro

**Ejemplo:**

```typescript
// En /src/config/plugins.config.ts
PluginRegistry.register({
    plugin: new CooldownPlugin(),      // [A]
    scope: PluginScope.DeepFolder,
    folderPath: '',
});

PluginRegistry.register({
    plugin: new LoggerPlugin(),        // [B]
    scope: PluginScope.Folder,
    folderPath: 'admin',
});

// En el comando
@Command({ name: 'ban' })
@UsePlugins(PermissionPlugin)          // [C]
export class BanCommand extends BanDefinition {
    async run() { ... }
}
```

**Orden de ejecución:**

```
onBeforeExecute:
  1. PermissionPlugin (C) - @UsePlugins
  2. CooldownPlugin (A) - Scope global
  3. LoggerPlugin (B) - Scope folder
  4. BanCommand.run() ← El comando se ejecuta

onAfterExecute (orden INVERSO):
  5. LoggerPlugin (B)
  6. CooldownPlugin (A)
  7. PermissionPlugin (C)
```

## ⚠️ Importante: Manejo de Errores

### ✅ Cancelar Ejecución del Comando

Si `onBeforeExecute` lanza un error, el comando **NO se ejecuta** y `onAfterExecute` **NO se llama**:

```typescript
async onBeforeExecute(command: BaseCommand): Promise<void> {
    if (!valid) {
        // Esto cancela la ejecución
        throw new ReplyError('No puedes usar este comando');
    }
}
```

### ❌ Si el Comando Falla

Si el comando lanza un error durante `run()`, `onAfterExecute` **NO se ejecuta**:

```typescript
async run(): Promise<void> {
    throw new Error('Algo falló');
    // onAfterExecute NO se ejecutará
}
```

### ✅ Solo en Éxito

`onAfterExecute` solo se ejecuta si todo fue exitoso:

```typescript
async onAfterExecute(command: BaseCommand): Promise<void> {
    // Solo se ejecuta si el comando se completó sin errores
    console.log('✅ Comando ejecutado exitosamente');
}
```

## 🎨 Combinando Múltiples Plugins

### Por Scope

```typescript
// En /src/config/plugins.config.ts
PluginRegistry.register({
    plugin: new RolePermissionPlugin(),
    scope: PluginScope.Folder,
    folderPath: 'admin',
});

PluginRegistry.register({
    plugin: new CooldownPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: '',
});

PluginRegistry.register({
    plugin: new CommandLoggerPlugin(),
    scope: PluginScope.Folder,
    folderPath: 'admin',
});
```

### Por Decorador

```typescript
@Command({ name: 'admin' })
@UsePlugins(RolePermissionPlugin, CooldownPlugin, CommandLoggerPlugin)
export class AdminCommand extends AdminDefinition {
    // ...
}
```

### Híbrido (Scope + Decorador)

```typescript
// Scope global en config
PluginRegistry.register({
    plugin: new CooldownPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: '',
});

// Decorador específico por comando
@Command({ name: 'ban' })
@UsePlugins(AuditLogPlugin, PermissionPlugin)
export class BanCommand extends BanDefinition {
    // ...
}
```

**Orden de ejecución:**

1. `AuditLogPlugin.onBeforeExecute()` (decorador)
2. `PermissionPlugin.onBeforeExecute()` (decorador)
3. `CooldownPlugin.onBeforeExecute()` (scope)
4. `BanCommand.run()` ← El comando
5. `CooldownPlugin.onAfterExecute()` (inverso)
6. `PermissionPlugin.onAfterExecute()` (inverso)
7. `AuditLogPlugin.onAfterExecute()` (inverso)

## 💡 Ideas de Plugins

### Seguridad

-   🔒 **NSFW Filter**: Bloquear comandos NSFW en canales no-NSFW
-   🔒 **Whitelist**: Solo permitir comandos en ciertos servidores
-   🔒 **Maintenance Mode**: Deshabilitar comandos durante mantenimiento

### Economía/Gamificación

-   💰 **Currency Cost**: Cobrar por usar comandos
-   ⭐ **XP Reward**: Dar experiencia por usar comandos
-   🎁 **Daily Bonus**: Recompensas diarias

### Moderación

-   📝 **Audit Log**: Registrar comandos de moderación
-   🚫 **Auto-ban**: Banear automáticamente por uso abusivo
-   ⚠️ **Warning System**: Sistema de advertencias

### Analytics

-   📊 **Usage Stats**: Estadísticas de uso de comandos
-   📈 **Performance Monitor**: Medir tiempo de ejecución
-   🔍 **Error Tracker**: Rastrear errores comunes

### UX

-   💬 **Typing Indicator**: Mostrar "escribiendo..." en comandos largos
-   ⏱️ **Timeout Warning**: Avisar si el comando tarda mucho
-   🔄 **Auto-delete**: Eliminar respuestas después de X segundos

## 📚 Recursos Relacionados

-   `/src/core/structures/BasePlugin.ts` - Clase base de plugins
-   `/src/core/structures/BaseCommand.ts` - Clase base de comandos
-   `/src/core/decorators/plugin.decorator.ts` - Decorador @UsePlugins
-   `/src/config/` - Configuración de plugins por scope
-   `/src/config/README.md` - Documentación completa de scopes
-   `/src/error/` - Errores personalizados
-   `ARCHITECTURE.md` - Arquitectura del sistema

---

**🎉 Con plugins, las posibilidades son infinitas!**
