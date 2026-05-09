# Carpeta: Plugins

## 📖 Descripción

Esta carpeta contiene **plugins** que extienden la funcionalidad de los comandos sin modificar su código. Los plugins se ejecutan en diferentes momentos del ciclo de vida de los comandos:

-   🟦 **`onBeforeRegisterCommand`**: Antes de registrar el comando en Discord API
-   🟦 **`onAfterRegisterCommand`**: Después de registrar el comando en Discord API
-   🔵 **`onBeforeExecute`**: Antes de ejecutar el comando
-   🟢 **`onAfterExecute`**: Después de ejecutar el comando

## 🎯 ¿Qué es un Plugin?

Un plugin es una clase que hereda de `BasePlugin` e implementa uno o más de los siguientes métodos opcionales:

### 🟦 Eventos de Registro

-   **`onBeforeRegisterCommand(commandClass, commandJson)`**: Se ejecuta **antes** de enviar el comando a Discord API
    -   Recibe la **clase del comando** (sin instanciar) y una **copia** del JSON del comando
    -   Retorna: JSON modificado | `false` (cancelar registro) | `null`/`undefined` (usar original)
    -   Útil para: modificar comandos dinámicamente, agregar opciones, traducciones, cancelar registro basado en la clase
-   **`onAfterRegisterCommand(commandClass, registeredCommandJson)`**: Se ejecuta **después** de registrar en Discord API
    -   Recibe la **clase del comando** y el JSON del comando registrado (con ID de Discord)
    -   Útil para: logging, analytics, caché, sincronización con BD

### 🔵 Eventos de Ejecución

-   **`onBeforeExecute(command)`**: Se ejecuta **antes** del comando
    -   `return true`: Continúa con la ejecución del comando
    -   `return false`: Cancela la ejecución silenciosamente (sin mensaje de error)
    -   `throw Error`: Cancela la ejecución y muestra un mensaje de error
-   **`onAfterExecute(command)`**: Se ejecuta **después** del comando (solo si no hubo errores)
    -   Útil para: logging, analytics, cooldowns, recompensas

## 🚀 Casos de Uso

### 🟦 Plugins de Registro (`onBeforeRegisterCommand` / `onAfterRegisterCommand`)

Modificaciones y seguimiento durante el registro de comandos:

-   ✅ **Modificar comandos**: Agregar prefijos, sufijos, opciones dinámicas
-   ✅ **Traducciones**: Cambiar descripciones según idioma
-   ✅ **Ambiente**: Ocultar comandos de debug en producción
-   ✅ **Logging**: Registrar qué comandos se registraron
-   ✅ **Analytics**: Seguimiento de comandos disponibles
-   ✅ **Sincronización**: Guardar IDs de comandos en BD

### 🔵 Plugins de Ejecución (`onBeforeExecute`)

Validaciones y verificaciones **antes** de ejecutar el comando:

-   ✅ **Cooldowns**: Verificar si el usuario puede usar el comando
-   ✅ **Permisos**: Validar roles o permisos específicos
-   ✅ **Rate Limiting**: Limitar uso por usuario/servidor
-   ✅ **Mantenimiento**: Bloquear comandos durante mantenimiento
-   ✅ **Blacklist**: Prevenir uso de usuarios/servidores bloqueados
-   ✅ **Validaciones custom**: Cualquier validación previa

### 🟢 Plugins de Post-Ejecución (`onAfterExecute`)

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
    // Ejecutar ANTES de registrar en Discord API (opcional)
    async onBeforeRegisterCommand(
        commandClass: new (...args: any[]) => BaseCommand,
        commandJson: any,
    ): Promise<any | false | null | undefined> {
        // Acceder a la clase del comando
        console.log(`Registrando: ${commandClass.name}`);

        // Modificar, cancelar o dejar pasar el comando
        return commandJson; // o false, null, undefined
    }

    // Ejecutar DESPUÉS de registrar en Discord API (opcional)
    async onAfterRegisterCommand(
        commandClass: new (...args: any[]) => BaseCommand,
        registeredCommandJson: any,
    ): Promise<void> {
        // Logging, analytics, etc.
        console.log(`${commandClass.name} registrado con ID: ${registeredCommandJson.id}`);
    }

    // Ejecutar ANTES del comando (opcional)
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

El `CooldownPlugin` incluido acepta un `CooldownStore` por inyección de
dependencia. Por defecto usa `MemoryCooldownStore` (in-memory), y cuando
el sharding está habilitado recibe automáticamente un `RedisCooldownStore`
a través de `StoreRegistry`.

```typescript
// src/plugins/cooldown.plugin.ts
import { BasePlugin } from '@/core/structures/BasePlugin';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { MemoryCooldownStore, type CooldownStore } from '@/core/store/cooldown.store';

export class CooldownPlugin extends BasePlugin {
    private readonly store: CooldownStore;

    constructor(store: CooldownStore = new MemoryCooldownStore()) {
        super();
        this.store = store;
    }

    async onBeforeExecute(command: BaseCommand): Promise<boolean> {
        const key = `${command.user.id}-${command.id}`;
        const expiry = await this.store.get(key);
        if (expiry === undefined || expiry < Date.now()) {
            if (expiry !== undefined) await this.store.delete(key);
            return true;
        }
        // ... mostrar mensaje de cooldown
        return false;
    }

    async onAfterExecute(command: BaseCommand): Promise<void> {
        const key = `${command.user.id}-${command.id}`;
        await this.store.set(key, Date.now() + cooldownMs);
    }
}
```

**Para usar con Redis en modo sharding** no hay que cambiar nada en el plugin;
`StoreRegistry` y `plugins.config.ts` manejan la inyección automáticamente:

```typescript
// src/config/plugins.config.ts — ya configurado en el template
import { StoreRegistry } from '@/core/store/store.registry';

PluginRegistry.register({
    plugin: new CooldownPlugin(StoreRegistry.getCooldownStore()),
    // ^^ devuelve RedisCooldownStore si SHARDING_ENABLED=true,
    //    o MemoryCooldownStore en caso contrario
    scope: PluginScope.Specified,
    folderPath: '',
});
```

## 📝 Ejemplo 2: Plugin de Permisos (PermissionsPlugin)

**El plugin de permisos está incluido en el template** y es uno de los más útiles. Gestiona permisos de Discord automáticamente.

```typescript
// src/plugins/permissions.plugin.ts
import { REQUIRE_PERMISSIONS_METADATA_KEY } from '@/core/decorators/permission.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { BasePlugin } from '@/core/structures/BasePlugin';

export class PermissionsPlugin extends BasePlugin {
    // 🟦 Fase de Registro: Agrega default_member_permissions al comando
    async onBeforeRegisterCommand(
        commandClass: new (...args: any[]) => BaseCommand,
        commandJson: any,
    ): Promise<any | false | null | undefined> {
        const metadata = Reflect.getMetadata(REQUIRE_PERMISSIONS_METADATA_KEY, commandClass) as
            | bigint[]
            | undefined;

        if (metadata) {
            // ⚠️ IMPORTANTE: Retornar un NUEVO objeto (inmutabilidad)
            const modifiedJson = {
                ...commandJson,
                default_member_permissions: metadata.reduce((a, b) => a | b, BigInt(0)).toString(),
            };

            return modifiedJson; // JSON original NO modificado
        }
    }

    // 🔵 Fase de Ejecución: Valida permisos del usuario
    async onBeforeExecute(command: BaseCommand): Promise<boolean> {
        const requiredPermissions = Reflect.getMetadata(
            REQUIRE_PERMISSIONS_METADATA_KEY,
            command.constructor,
        ) as bigint[] | undefined;

        if (requiredPermissions) {
            const member = command.ctx.member;

            for (const permission of requiredPermissions) {
                if (!member.permissions.has(permission)) {
                    const embed = command.getEmbed('error');
                    embed.setTitle('Permisos insuficientes');
                    embed.setDescription(
                        'No tienes los permisos necesarios para ejecutar este comando.',
                    );

                    await command.reply({ embeds: [embed] });
                    return false;
                }
            }
        }
        return true;
    }
}
```

**Uso con decorador:**

```typescript
import { RequirePermissions } from '@/core/decorators/permission.decorator';
import { Permissions } from '@/utils/Permissions';

@Command({ name: 'ban', description: 'Banea un usuario' })
@RequirePermissions(Permissions.BanMembers)
export class BanCommand extends BaseCommand {
    async run(): Promise<void> {
        // Usuario ya validado con permisos
    }
}
```

**Características clave:**

-   ✅ Inmutable: NO modifica el `commandJson` original
-   ✅ Dual validation: En registro (Discord API) y ejecución (runtime)
-   ✅ 20 tests completos garantizando correcto funcionamiento

**Documentación completa**: Ver [`permissions.plugin.README.md`](./permissions.plugin.README.md)

## 📝 Ejemplo 3: Plugin de Logging

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
