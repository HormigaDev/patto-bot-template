# Carpeta: Config

## 📖 Descripción

Esta carpeta contiene la **configuración de plugins por scope**. Aquí defines qué plugins se aplican a qué comandos, sin necesidad de modificar el código de cada comando individual.

## 🏗️ Estructura

```
config/
├── plugin.registry.ts     # Sistema de registro de plugins
└── plugins.config.ts      # Configuración de tus plugins
```

## 🎯 ¿Qué es un Scope?

Un **scope** define el alcance de aplicación de un plugin. Existen 3 tipos:

| Scope        | Descripción                                                   | Ejemplo                     |
| ------------ | ------------------------------------------------------------- | --------------------------- |
| `Folder`     | Comandos **solo** en una carpeta específica (sin subcarpetas) | `/src/commands/admin/`      |
| `DeepFolder` | Comandos en una carpeta **y todas sus subcarpetas**           | `/src/commands/`            |
| `Specified`  | Lista **específica** de clases de comandos                    | `[BanCommand, KickCommand]` |

## 🔧 Cómo Configurar Plugins

### Archivo: `plugins.config.ts`

Este es el archivo donde registras tus plugins con sus scopes.

### Ejemplo 1: Plugin Global (Todos los Comandos)

```typescript
import { PluginRegistry, PluginScope } from './plugin.registry';
import { CooldownPlugin } from '@/plugins/cooldown.plugin';

PluginRegistry.register({
    plugin: new CooldownPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: '', // Raíz = todos los comandos
});
```

**Resultado**: El cooldown se aplicará a **todos** los comandos del bot.

### Ejemplo 2: Plugin para una Carpeta Específica

```typescript
import { RolePermissionPlugin } from '@/plugins/role-permission.plugin';

PluginRegistry.register({
    plugin: new RolePermissionPlugin(),
    scope: PluginScope.Folder,
    folderPath: 'admin', // Solo /src/commands/admin/
});
```

**Resultado**: Solo los comandos directamente en `/src/commands/admin/` tendrán verificación de roles.

**No afecta a**:

-   `/src/commands/admin/advanced/ban.command.ts` (subcarpeta)
-   `/src/commands/moderation/kick.command.ts` (otra carpeta)

### Ejemplo 3: Plugin para Carpeta y Subcarpetas

```typescript
import { CommandLoggerPlugin } from '@/plugins/command-logger.plugin';

PluginRegistry.register({
    plugin: new CommandLoggerPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: 'moderation',
});
```

**Resultado**: Todos los comandos en `/src/commands/moderation/` y sus subcarpetas se registrarán en logs.

**Afecta a**:

-   `/src/commands/moderation/ban.command.ts`
-   `/src/commands/moderation/kick.command.ts`
-   `/src/commands/moderation/advanced/timeout.command.ts`
-   `/src/commands/moderation/reports/view.command.ts`

### Ejemplo 4: Plugin para Comandos Específicos

```typescript
import { AuditLogPlugin } from '@/plugins/audit-log.plugin';
import { BanCommand } from '@/commands/ban.command';
import { KickCommand } from '@/commands/kick.command';
import { TimeoutCommand } from '@/commands/timeout.command';

PluginRegistry.register({
    plugin: new AuditLogPlugin(),
    scope: PluginScope.Specified,
    commands: [BanCommand, KickCommand, TimeoutCommand],
});
```

**Resultado**: Solo esos 3 comandos específicos registrarán acciones en el audit log.

## 🎨 Combinando Múltiples Scopes

Puedes registrar múltiples plugins con diferentes scopes:

```typescript
// Plugin global: Cooldown para todos
PluginRegistry.register({
    plugin: new CooldownPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: '',
});

// Plugin para carpeta: Permisos para admin
PluginRegistry.register({
    plugin: new RolePermissionPlugin(),
    scope: PluginScope.Folder,
    folderPath: 'admin',
});

// Plugin específico: Audit log para comandos críticos
PluginRegistry.register({
    plugin: new AuditLogPlugin(),
    scope: PluginScope.Specified,
    commands: [BanCommand, UnbanCommand, KickCommand],
});
```

**Resultado**:

-   **BanCommand** (en `/commands/admin/ban.command.ts`):

    -   ✅ CooldownPlugin (global)
    -   ✅ RolePermissionPlugin (carpeta admin)
    -   ✅ AuditLogPlugin (específico)

-   **PingCommand** (en `/commands/ping.command.ts`):
    -   ✅ CooldownPlugin (global)
    -   ❌ RolePermissionPlugin (no está en admin)
    -   ❌ AuditLogPlugin (no especificado)

## ⚡ Prioridad de Plugins

### Orden de Ejecución

Cuando un comando tiene múltiples plugins (de scope y de decorador), el orden es:

1. **Plugins de `@UsePlugins`** (decorador)
2. **Plugins de scope** (registry, en orden de registro)

**Nota:** Este orden aplica tanto para eventos de **registro** como de **ejecución**.

### Ciclo de Vida Completo

Los plugins se ejecutan en **dos fases** del ciclo de vida:

#### 🟦 Fase de Registro (Inicio del Bot)

```
1. SlashCommandLoader.registerSlashCommands()
   ↓
2. Para cada comando:
   - Ejecuta onBeforeRegisterCommand (decorador → scope)
   - Registra en Discord API (si no fue cancelado)
   - Ejecuta onAfterRegisterCommand (decorador → scope)
```

#### 🔵 Fase de Ejecución (Cuando un Usuario Usa el Comando)

```
1. Usuario ejecuta comando
   ↓
2. CommandHandler detecta el comando
   ↓
3. Ejecuta onBeforeExecute (decorador → scope)
   ↓
4. Ejecuta command.run() (si todos retornaron true)
   ↓
5. Ejecuta onAfterExecute (scope → decorador, inverso)
```

### Ejemplo Completo

```typescript
// En plugins.config.ts
PluginRegistry.register({
    plugin: new EnvironmentFilterPlugin(),  // [A]
    scope: PluginScope.DeepFolder,
    folderPath: '',
});

PluginRegistry.register({
    plugin: new CommandLoggerPlugin(),      // [B]
    scope: PluginScope.Folder,
    folderPath: 'admin',
});

// En el comando
@Command({ name: 'ban' })
@UsePlugins(TranslationPlugin)              // [C]
export class BanCommand extends BaseCommand {
    async run() { ... }
}
```

**Orden de ejecución en REGISTRO:**

```
onBeforeRegisterCommand:
  1. TranslationPlugin (C) - Decorador
  2. EnvironmentFilterPlugin (A) - Scope global
  3. CommandLoggerPlugin (B) - Scope folder
  → Discord API registra el comando

onAfterRegisterCommand:
  4. TranslationPlugin (C)
  5. EnvironmentFilterPlugin (A)
  6. CommandLoggerPlugin (B)
```

**Orden de ejecución en EJECUCIÓN:**

```
onBeforeExecute:
  1. TranslationPlugin (C) - Decorador
  2. EnvironmentFilterPlugin (A) - Scope global
  3. CommandLoggerPlugin (B) - Scope folder
  4. BanCommand.run() ← Comando

onAfterExecute (inverso):
  5. CommandLoggerPlugin (B)
  6. EnvironmentFilterPlugin (A)
  7. TranslationPlugin (C)
```

## 🔍 Rutas de Carpetas

Las rutas son **relativas a `/src/commands/`**.

### Ejemplos de Rutas

| Comando Real                                  | `folderPath` para Folder | `folderPath` para DeepFolder |
| --------------------------------------------- | ------------------------ | ---------------------------- |
| `/src/commands/ping.command.ts`               | `''` (raíz)              | `''` (raíz)                  |
| `/src/commands/admin/ban.command.ts`          | `'admin'`                | `'admin'`                    |
| `/src/commands/admin/roles/assign.command.ts` | `'admin/roles'`          | `'admin'`                    |
| `/src/commands/economy/balance.command.ts`    | `'economy'`              | `'economy'`                  |

### ✅ Rutas Válidas

```typescript
folderPath: ''; // Raíz
folderPath: 'admin'; // Carpeta admin
folderPath: 'admin/roles'; // Subcarpeta
folderPath: 'moderation'; // Carpeta moderation
```

### ❌ Rutas Inválidas

```typescript
folderPath: '/admin'; // ❌ No usar slash inicial
folderPath: 'admin/'; // ❌ No usar slash final
folderPath: '/src/commands/admin'; // ❌ No usar ruta absoluta
```

## 📝 Ejemplo Completo de Configuración

```typescript
// src/config/plugins.config.ts
import { PluginRegistry, PluginScope } from './plugin.registry';

// Importar plugins
import { CooldownPlugin } from '@/plugins/cooldown.plugin';
import { CommandLoggerPlugin } from '@/plugins/command-logger.plugin';
import { RolePermissionPlugin } from '@/plugins/role-permission.plugin';
import { RateLimitPlugin } from '@/plugins/rate-limit.plugin';
import { AuditLogPlugin } from '@/plugins/audit-log.plugin';

// Importar comandos para Specified
import { BanCommand } from '@/commands/moderation/ban.command';
import { KickCommand } from '@/commands/moderation/kick.command';
import { UnbanCommand } from '@/commands/moderation/unban.command';

/**
 * 1. Cooldown global para evitar spam
 */
PluginRegistry.register({
    plugin: new CooldownPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: '', // Todos los comandos
});

/**
 * 2. Rate limit más estricto para comandos de economía
 */
PluginRegistry.register({
    plugin: new RateLimitPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: 'economy',
});

/**
 * 3. Logging para todos los comandos de moderación
 */
PluginRegistry.register({
    plugin: new CommandLoggerPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: 'moderation',
});

/**
 * 4. Permisos por rol solo para carpeta admin
 */
PluginRegistry.register({
    plugin: new RolePermissionPlugin(),
    scope: PluginScope.Folder,
    folderPath: 'admin',
});

/**
 * 5. Audit log para acciones críticas específicas
 */
PluginRegistry.register({
    plugin: new AuditLogPlugin(),
    scope: PluginScope.Specified,
    commands: [BanCommand, KickCommand, UnbanCommand],
});
```

## 🆚 Scope vs Decorador `@UsePlugins`

| Característica   | Scope (Registry)                | `@UsePlugins` (Decorador)           |
| ---------------- | ------------------------------- | ----------------------------------- |
| **Ubicación**    | `/src/config/plugins.config.ts` | En cada comando                     |
| **Alcance**      | Múltiples comandos              | Un solo comando                     |
| **Centralizado** | ✅ Sí                           | ❌ No                               |
| **Flexibilidad** | Carpetas o comandos             | Solo el comando decorado            |
| **Prioridad**    | Segunda (después de decorador)  | Primera                             |
| **Cuándo usar**  | Configuración global/por módulo | Configuración específica de comando |

### Recomendaciones

**Usa Scope (Registry) para:**

-   ✅ Plugins comunes (cooldown, logging)
-   ✅ Configuración por módulo (admin, moderation, economy)
-   ✅ Mantener código limpio y centralizado

**Usa `@UsePlugins` para:**

-   ✅ Plugins muy específicos de un comando
-   ✅ Configuración única que no se repite
-   ✅ Override de comportamiento por comando

## 🔧 API de PluginRegistry

### `register(config: PluginConfig)`

Registra una configuración de plugin.

```typescript
PluginRegistry.register({
    plugin: new MiPlugin(),
    scope: PluginScope.Folder,
    folderPath: 'admin',
});
```

### `getPluginsForCommand(commandClass, commandPath)`

Obtiene todos los plugins aplicables a un comando.

```typescript
const plugins = PluginRegistry.getPluginsForCommand(BanCommand, 'moderation/ban');
// Retorna: BasePlugin[]
```

### `clear()`

Limpia el registro (útil para testing).

```typescript
PluginRegistry.clear();
```

### `getAll()`

Obtiene todas las configuraciones registradas.

```typescript
const configs = PluginRegistry.getAll();
// Retorna: PluginConfig[]
```

## 💡 Ejemplos de Configuraciones Comunes

### Configuración Básica (Un Bot Simple)

```typescript
import { CooldownPlugin } from '@/plugins/cooldown.plugin';

// Solo cooldown global
PluginRegistry.register({
    plugin: new CooldownPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: '',
});
```

### Configuración Intermedia (Bot con Módulos)

```typescript
// Cooldown global
PluginRegistry.register({
    plugin: new CooldownPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: '',
});

// Permisos para admin
PluginRegistry.register({
    plugin: new RolePermissionPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: 'admin',
});

// Logging para moderación
PluginRegistry.register({
    plugin: new CommandLoggerPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: 'moderation',
});
```

### Configuración Avanzada (Bot Empresarial)

```typescript
// 1. Cooldown global
PluginRegistry.register({
    plugin: new CooldownPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: '',
});

// 2. Rate limit para economía
PluginRegistry.register({
    plugin: new RateLimitPlugin({ max: 3, window: 10000 }),
    scope: PluginScope.DeepFolder,
    folderPath: 'economy',
});

// 3. Permisos para admin
PluginRegistry.register({
    plugin: new AdminPermissionPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: 'admin',
});

// 4. Logging para moderación
PluginRegistry.register({
    plugin: new DetailedLoggerPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: 'moderation',
});

// 5. Audit log para acciones críticas
PluginRegistry.register({
    plugin: new AuditLogPlugin(),
    scope: PluginScope.Specified,
    commands: [BanCommand, UnbanCommand, KickCommand, DeleteChannelCommand],
});

// 6. Analytics global
PluginRegistry.register({
    plugin: new AnalyticsPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: '',
});
```

## 📚 Recursos Relacionados

-   `/src/plugins/` - Implementaciones de plugins
-   `/src/core/decorators/plugin.decorator.ts` - Decorador @UsePlugins
-   `/src/core/handlers/command.handler.ts` - Ejecución de plugins
-   `/src/core/structures/BasePlugin.ts` - Clase base de plugins

---

**🎯 Con esta configuración, tienes control total sobre qué plugins se ejecutan y dónde!**
