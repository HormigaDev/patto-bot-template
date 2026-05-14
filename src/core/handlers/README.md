# Carpeta: Handlers

## 📖 Descripción

Los **handlers** (manejadores) son responsables de ejecutar la lógica central del sistema. En este caso, el `CommandHandler` ejecuta comandos y maneja errores.

## 🏗️ Estructura

```
handlers/
└── command.handler.ts    # Ejecuta comandos y maneja errores
```

## 🎯 CommandHandler

### Responsabilidad Única

**Ejecutar comandos** con sus argumentos resueltos, **ejecutar plugins**, y manejar errores.

### Métodos Públicos

#### `executeCommand(source, TCommandClass, textArgs?, commandPath?)`

Ejecuta un comando con sus argumentos y plugins.

**Parámetros:**

- `source`: `Message | ChatInputCommandInteraction` - Fuente del comando
- `TCommandClass`: `CommandClass` - Clase del comando a ejecutar
- `textArgs?`: `any[]` - Argumentos parseados (solo para text commands)
- `commandPath?`: `string` - Ruta del comando (para plugins de scope)

**Flujo:**

```
1. Instanciar comando
2. Crear CommandContext
3. Inyectar ctx, user, channel
4. Resolver argumentos (via ArgumentResolver)
5. Inyectar argumentos resueltos
6. Obtener plugins (@UsePlugins + scope)
7. Ejecutar onBeforeExecute de plugins (orden normal)
8. Ejecutar command.run()
9. Ejecutar onAfterExecute de plugins (orden INVERSO)
10. Manejar errores
```

**Ejemplo de uso:**

```typescript
const handler = new CommandHandler();
await handler.executeCommand(
    interaction,
    PingCommand,
    undefined,
    'ping', // Ruta relativa a /src/commands/
);
```

### Sistema de Plugins

#### Obtención de Plugins

El handler obtiene plugins de dos fuentes con diferentes prioridades:

**1. Plugins de `@UsePlugins` (máxima prioridad)**

```typescript
@UsePlugins(CooldownPlugin, PermissionPlugin)
export class MyCommand extends BaseCommand {}
```

**2. Plugins de Scope (registry)**

```typescript
// En /src/config/plugins.config.ts
PluginRegistry.register({
    plugin: new LoggerPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: 'admin',
});
```

#### Orden de Ejecución

**onBeforeExecute** (orden normal):

1. Plugins de `@UsePlugins` (en orden especificado)
2. Plugins de scope (en orden de registro)

**onAfterExecute** (orden INVERSO):

1. Plugins de scope (inverso)
2. Plugins de `@UsePlugins` (inverso)

**Ejemplo:**

```typescript
// Scope
PluginRegistry.register({ plugin: new LoggerPlugin() }); // [A]
PluginRegistry.register({ plugin: new AnalyticsPlugin() }); // [B]

// Decorador
@UsePlugins(CooldownPlugin, PermissionPlugin) // [C, D]
export class MyCommand extends BaseCommand {}
```

**Ejecución:**

```
1. CooldownPlugin.onBeforeExecute() (C)
2. PermissionPlugin.onBeforeExecute() (D)
3. LoggerPlugin.onBeforeExecute() (A)
4. AnalyticsPlugin.onBeforeExecute() (B)
5. MyCommand.run() ← Comando
6. AnalyticsPlugin.onAfterExecute() (B - inverso)
7. LoggerPlugin.onAfterExecute() (A - inverso)
8. PermissionPlugin.onAfterExecute() (D - inverso)
9. CooldownPlugin.onAfterExecute() (C - inverso)
```

#### Cancelación de Comandos

Si un plugin lanza un error en `onBeforeExecute`:

- ❌ El comando **NO se ejecuta**
- ❌ `onAfterExecute` **NO se llama**
- ✅ El error se maneja normalmente

```typescript
class PermissionPlugin extends BasePlugin {
    async onBeforeExecute(command: BaseCommand): Promise<void> {
        if (!hasPermission) {
            throw new ReplyError('Sin permisos');
            // El comando se cancela aquí
        }
    }
}
```

### Manejo de Errores

El handler maneja tres tipos de errores:

**Nota:** la implementación actual usa i18n para los mensajes al usuario. Si tu bot no usa i18n, en [src/core/handlers/command.handler.ts](src/core/handlers/command.handler.ts) hay versiones hardcoded comentadas de `handleValidationError` y `handleExecutionError` para alternar.

#### 1. ValidationError

Errores de validación de argumentos.

**Respuesta:**

- Embed con título "Error de uso"
- Color: rojo (#ca5c5c)
- Mensaje descriptivo
- Footer con el usuario

#### 2. ReplyError

Errores esperados que deben mostrarse al usuario.

**Respuesta:**

- Embed con título "Error"
- Color: rojo (#ca5c5c)
- Mensaje del error
- Footer con el usuario

#### 3. Error Genérico

Errores inesperados.

**Respuesta:**

- Embed con título "Error"
- Mensaje genérico
- Log en consola del error real
- Footer con el usuario

### Colores de Embeds

```typescript
private colors = {
    error: '#ca5c5c',      // Rojo
    success: '#6ec06c',    // Verde
    warning: '#d49954',    // Amarillo
    info: '#5180d6',       // Azul
};
```

### Flujo Completo

```
executeCommand()
    ↓
Instanciar comando
    ↓
Crear CommandContext(source)
    ↓
Inyectar: ctx, user, channel
    ↓
ArgumentResolver.resolveArguments()
    ↓
    ├─ ValidationError? → handleValidationError()
    └─ Éxito → Continuar
    ↓
Inyectar argumentos resueltos
    ↓
command.run()
    ↓
    ├─ ReplyError? → handleExecutionError()
    ├─ Error? → handleExecutionError()
    └─ Éxito → Fin
```

## 📚 Recursos Relacionados

- `/src/core/resolvers/argument.resolver.ts` - Resuelve argumentos
- `/src/core/structures/CommandContext.ts` - Contexto de comandos
- `/src/error/` - Tipos de errores
