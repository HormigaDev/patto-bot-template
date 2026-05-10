# Arquitectura Modular del Bot

## 📁 Estructura de Carpetas

```
src/
├── bot.ts                          # Clase principal del bot (inicialización)
├── index.ts                        # Punto de entrada — modo normal
├── sharding.ts                     # Punto de entrada — modo sharding (ShardingManager)
├── commands/                       # Implementaciones de comandos
│   ├── README.md                  # Documentación de patrones y estructura
│   ├── info/                      # Comandos base (producción)
│   │   ├── help.command.ts       # Comando base: /help
│   │   └── ping.command.ts       # Comando base: /ping
│   └── examples/                  # Ejemplos demostrativos
│       ├── components/            # Ejemplos de componentes interactivos
│       │   ├── color.command.ts         # Ejemplo: botones con payload
│       │   ├── feedback.command.ts      # Ejemplo: modal con payload
│       │   └── vote.command.ts          # Ejemplo: RichMessage permanente
│       ├── subcommands/          # Ejemplos de subcomandos (2 niveles)
│       │   ├── config-get.command.ts    # Ejemplo: /config get
│       │   └── config-set.command.ts    # Ejemplo: /config set
│       └── subcommand-groups/    # Ejemplos de grupos (3 niveles)
│           ├── server-config-get.command.ts   # Ejemplo: /server config get
│           ├── server-config-set.command.ts   # Ejemplo: /server config set
│           └── server-user-info.command.ts    # Ejemplo: /server user info
├── config/                        # Configuración de plugins por scope
│   ├── plugin.registry.ts         # Sistema de registro de plugins
│   ├── plugins.config.ts          # Configuración centralizada de plugins
│   └── README.md                  # Documentación completa de scopes
├── core/                          # Núcleo del framework
│   ├── README.md                  # Visión general del núcleo
│   ├── components/                # Wrappers para componentes interactivos
│   │   ├── Button.ts              # Wrapper de botones con routing command/method + payload
│   │   ├── Select.ts              # Wrapper de select menus con routing command/method + payload
│   │   ├── Modal.ts               # Wrapper de modales con routing command/method + payload
│   │   ├── RichMessage.ts         # Agrupa componentes con timeout único y reset por interacción
│   │   ├── index.ts               # Exports de componentes (incluye NEVER_EXPIRES)
│   │   └── README.md              # Documentación completa de componentes
│   ├── decorators/                # Decoradores TypeScript del framework
│   │   ├── command.decorator.ts          # @Command — metadata de comandos base
│   │   ├── subcommand.decorator.ts       # @Subcommand — metadata de subcomandos (2 niveles)
│   │   ├── subcommand-group.decorator.ts # @SubcommandGroup — metadata de grupos (3 niveles)
│   │   ├── argument.decorator.ts         # @Arg — metadata de argumentos
│   │   ├── plugin.decorator.ts           # @UsePlugins — plugins por comando
│   │   ├── permission.decorator.ts       # @RequirePermissions — permisos requeridos del usuario
│   │   ├── bot-permission.decorator.ts   # @BotPermissions — permisos requeridos del bot
│   │   ├── cooldown.decorator.ts         # @Cooldown — tiempo de espera entre usos
│   │   └── README.md                     # Documentación de decoradores
│   ├── handlers/                  # Manejadores de lógica
│   │   ├── command.handler.ts     # Ejecuta comandos con plugins y argumentos
│   │   └── README.md              # Documentación de handlers
│   ├── loaders/                   # Cargadores de recursos
│   │   ├── command.loader.ts      # Escanea sistema de archivos y carga clases de comandos
│   │   ├── slash-command.loader.ts # Registra slash commands en Discord API
│   │   └── README.md              # Documentación de loaders
│   ├── metadata/                  # Capa de acceso a metadata de decoradores
│   │   ├── metadata.store.ts      # Caché de metadata leída desde Reflect (una lectura por clase)
│   │   ├── metadata.handler.ts    # API tipada de alto nivel sobre MetadataStore
│   │   ├── index.ts               # Exports (singleton metadataHandler)
│   │   └── README.md              # Documentación del subsistema de metadata
│   ├── registry/                  # Registries globales
│   │   └── component.registry.ts  # Owners de RichMessage + acceso al PayloadStore
│   ├── resolvers/                 # Resolvedores de tipos y argumentos
│   │   ├── type.resolver.ts       # Coerción de tipos primitivos y Discord
│   │   ├── argument.resolver.ts   # Resolución completa + rawText + parsers
│   │   ├── prefix.resolver.ts     # Obtiene prefijo desde Env
│   │   └── README.md              # Documentación de resolvers
│   ├── store/                     # Stores intercambiables (memoria ↔ Redis)
│   │   ├── cooldown.store.ts      # Contrato CooldownStore + MemoryCooldownStore
│   │   ├── redis.cooldown.store.ts # RedisCooldownStore (para sharding)
│   │   ├── payload.store.ts       # Contrato PayloadStore + MemoryPayloadStore
│   │   ├── redis.payload.store.ts  # RedisPayloadStore (para sharding)
│   │   └── store.registry.ts      # StoreRegistry — punto de configuración de stores
│   └── structures/                # Estructuras base
│       ├── BaseCommand.ts         # Clase base con getEmbed() y helpers
│       ├── BasePlugin.ts          # Clase base para plugins extensibles
│       ├── CommandContext.ts      # Contexto unificado Message/Interaction
│       └── README.md              # Documentación de estructuras
├── definitions/                   # Definiciones de comandos (metadata + args)
│   ├── *.definition.ts            # Clases abstractas con decoradores y @Arg
│   └── README.md                  # Documentación de definiciones
├── error/                         # Errores personalizados
│   ├── ReplyError.ts              # Errores esperados que se muestran al usuario
│   ├── ValidationError.ts         # Errores de validación de argumentos
│   └── README.md                  # Documentación de manejo de errores
├── events/                        # Eventos de Discord
│   ├── ready.event.ts             # Inicialización, registro de comandos y presencia
│   ├── interactionCreate.event.ts # Dispatcher: slash commands + componentes interactivos
│   ├── messageCreate.event.ts     # Maneja text commands + construye commandPath
│   └── README.md                  # Documentación de eventos
├── plugins/                       # Implementaciones de plugins
│   ├── cooldown.plugin.ts         # Plugin de cooldown (usa CooldownStore vía StoreRegistry)
│   ├── permissions.plugin.ts      # Plugin de permisos (@RequirePermissions + @BotPermissions)
│   └── README.md                  # Documentación completa + 15+ ideas
└── utils/                         # Utilidades reutilizables
    ├── CommandCategories.ts       # Definiciones de categorías de comandos
    ├── Times.ts                   # Conversión de tiempo (ms, segundos, minutos, horas)
    ├── Env.ts                     # Validación y carga segura de variables de entorno
    ├── Logger.ts                  # Logger profesional con niveles, colores ANSI y scopes
    ├── Permissions.ts             # Constantes de permisos de Discord (bigint)
    └── README.md                  # Documentación de utilidades
```

### 📝 Nota sobre la Carpeta `commands/`

La carpeta `commands/` en el template incluye:

- **`info/`**: Comandos básicos de producción (`help`, `ping`)
- **`examples/`**: Ejemplos demostrativos listos para explorar
    - `examples/components/`: Ejemplos de componentes interactivos (botones, modales, RichMessage permanente)
    - `examples/subcommands/`: Ejemplos de comandos de 2 niveles
    - `examples/subcommand-groups/`: Ejemplos de comandos de 3 niveles

**Para tu proyecto:**

- Puedes eliminar la carpeta `examples/` si no la necesitas
- Organiza tus comandos según las [mejores prácticas documentadas](./src/commands/README.md):
    - Comandos base en carpetas por categoría (`info/`, `moderation/`, `economy/`, etc.)
    - Subcomandos en carpeta con nombre del comando padre (`config/get.command.ts`)
    - Grupos en subcarpetas (`server/config/get.command.ts`, `server/user/info.command.ts`)

Ver [documentación de subcomandos](./docs/Subcommands.README.md) y [grupos](./docs/SubcommandGroups.README.md) para más detalles.

---

## 🏗️ Separación de Responsabilidades

### **1. Bot (`bot.ts`)**

**Responsabilidad**: Inicialización y orquestación del bot

- Crea el cliente de Discord con intents configurados
- Usa `Env.get()` para obtener configuración validada
- Determina intents automáticamente según `USE_MESSAGE_CONTENT`
- Inicializa todos los componentes (CommandLoader, CommandHandler, etc.)
- Importa configuración de plugins (`/src/config/plugins.config.ts`)
- Registra eventos
- Coordina el flujo de inicio

**Imports importantes**:

```typescript
import '@/config/plugins.config'; // Carga configuración de plugins
import { Env } from '@/utils/Env'; // Configuración validada
```

### **1.5. Index (`index.ts`)**

**Responsabilidad**: Punto de entrada con validación de entorno

- Carga `reflect-metadata` (necesario para decoradores)
- Carga `dotenv` para variables de entorno
- **Valida configuración con `Env.load()`** (fail-fast)
- Importa `Bot` después de validar
- Inicia el bot

**Orden crítico de ejecución**:

```typescript
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { Env } from '@/utils/Env';

dotenv.config();
Env.load(); // ← ANTES de importar Bot

import { Bot } from './bot'; // ← DESPUÉS de validar

const bot = new Bot();
bot.start();
```

### **1.6. Env (`utils/Env.ts`)**

**Responsabilidad**: Validación y carga segura de variables de entorno

- Valida variables obligatorias (`BOT_TOKEN`, `CLIENT_ID`)
- Proporciona defaults para opcionales (`COMMAND_PREFIX`, `USE_MESSAGE_CONTENT`)
- Convierte tipos (string → boolean/number)
- Muestra mensajes de error claros en español
- Enmascara tokens en logs
- Singleton para una única instancia

**API**:

```typescript
// Una vez al inicio
Env.load(); // Valida y carga

// En cualquier lugar del proyecto
const config = Env.get();
config.BOT_TOKEN; // string
config.USE_MESSAGE_CONTENT; // boolean
config.COMMAND_PREFIX; // string (default: '!')
config.INTENTS; // number | undefined
```

**Variables de entorno**:

| Variable              | Tipo      | Obligatoria | Default | Descripción                       |
| --------------------- | --------- | ----------- | ------- | --------------------------------- |
| `BOT_TOKEN`           | `string`  | ✅          | -       | Token del bot                     |
| `CLIENT_ID`           | `string`  | ✅          | -       | ID de la aplicación               |
| `USE_MESSAGE_CONTENT` | `boolean` | ❌          | `false` | Habilitar comandos de texto       |
| `COMMAND_PREFIX`      | `string`  | ❌          | `!`     | Prefijo para comandos de texto    |
| `INTENTS`             | `number`  | ❌          | auto    | Intents personalizados (avanzado) |

### **2. CommandLoader (`core/loaders/command.loader.ts`)**

**Responsabilidad**: Cargar comandos desde el sistema de archivos

- Escanea el directorio `commands/` recursivamente (usando `fs` nativo)
- Carga las clases de comandos
- **Almacena rutas relativas** de cada comando (para plugin scopes)
- Gestiona aliases
- Busca metadata en clase y padres (herencia)
- **Soporte para jerarquía de comandos**:
    - `@Command`: Comandos base (1 nivel)
    - `@Subcommand`: Subcomandos (2 niveles: `parent-name`)
    - `@SubcommandGroup`: Grupos de subcomandos (3 niveles: `parent-name-subcommand`)
- **Sistema inteligente de almacenamiento**:
    - ≤ 100 comandos: Metadata completa en memoria
    - \> 100 comandos: Sistema de caching con Map
- **Keys en kebab-case** para recuperación consistente
- Proporciona acceso: `getCommand()`, `getCommandPath()`, `getCommandEntry()`
- **Nuevos métodos**:
    - `getSubcommands(parent)`: Obtiene subcomandos de un comando padre
    - `getSubcommandGroups(parent)`: Obtiene grupos organizados por nombre

**Nuevo**: Almacena `CommandEntry` con clase + ruta + metadata completa. Soporte completo para subcomandos y grupos con optimización de memoria.

### **2.5. MetadataStore / MetadataHandler (`core/metadata/`)**

**Responsabilidad**: Acceso centralizado y cacheado a toda la metadata de decoradores

- **MetadataStore**: lee metadata desde `Reflect` una sola vez por clase y la cachea en `Map<Constructor, CommandMetadataEntry>` — sin relecturas redundantes en runtime
- **MetadataHandler**: API tipada de alto nivel sobre `MetadataStore`; todos los componentes del framework la usan para leer metadata sin llamar a `Reflect` directamente
- Cubre todos los decoradores: `@Command`, `@Subcommand`, `@SubcommandGroup`, `@Arg`, `@Cooldown`, `@RequirePermissions`, `@BotPermissions`, `@UsePlugins`
- Gestiona herencia automáticamente (clase abstracta de definición → clase de implementación)
- Singleton `metadataHandler` exportado desde `@/core/metadata`

```typescript
import { metadataHandler } from '@/core/metadata';

const cooldown = metadataHandler.getCooldown(PingCommand);
const perms   = metadataHandler.getRequiredPermissions(BanCommand);
const args    = metadataHandler.getArguments(SayCommand);
const type    = metadataHandler.getCommandType(ServerConfigGetCommand);
// → 'subcommand-group'
```

### **3. SlashCommandLoader (`core/loaders/slash-command.loader.ts`)**

**Responsabilidad**: Registrar comandos slash en Discord API

- Convierte metadata de comandos a formato Discord
- Mapea tipos TypeScript a tipos de Discord
- **Agrupación automática de subcomandos**:
    - Agrupa por `parent` todos los comandos relacionados
    - Construye estructura jerárquica de hasta 3 niveles
    - Soporta mezcla de subcomandos simples y grupos
- **Procesamiento de plugins** en comandos anidados
- Registra comandos en la API de Discord con estructura correcta

**Nuevo**: Soporte completo para subcomandos y grupos de subcomandos con agrupación inteligente.

### **4. CommandHandler (`core/handlers/command.handler.ts`)**

**Responsabilidad**: Ejecutar comandos con plugins y argumentos

- Instancia el comando
- Inyecta contexto y argumentos
- **Obtiene plugins** de dos fuentes:

1. Plugins de `@UsePlugins` (decorador) - Máxima prioridad
2. Plugins de scope (PluginRegistry) - Segunda prioridad

- **Ejecuta plugins**:
- `onBeforeExecute` en orden normal
- `command.run()` (el comando)
- `onAfterExecute` en orden INVERSO
- Maneja errores de ejecución y validación

**Nuevo**: Integración completa del sistema de plugins

### **5. ArgumentResolver (`core/resolvers/argument.resolver.ts`)**

**Responsabilidad**: Resolver y validar argumentos

- Obtiene valores raw de la fuente (Message o Interaction)
- **Maneja `rawText`**: Captura todo el texto después del comando
- **Maneja `parser`**: Tipos personalizados con validación
- Delega resolución de tipos a TypeResolver
- Ejecuta validaciones personalizadas
- Retorna argumentos resueltos

**Nuevo**: Soporte para `rawText` y `parser` personalizado

### **6. TypeResolver (`core/resolvers/type.resolver.ts`)**

**Responsabilidad**: Coerción y resolución de tipos

- Tipos primitivos: String, Number, Boolean, Array
- Tipos Discord: User, Member, Channel, Role
- Parsea menciones y IDs
- Hace fetch en Discord API cuando es necesario

### **6.5. PrefixResolver (`core/resolvers/prefix.resolver.ts`)**

**Responsabilidad**: Obtener prefijo de comandos de texto

- Usa `Env.get().COMMAND_PREFIX` para obtener prefijo configurado
- Centralizado en un solo lugar
- Default: `!`

```typescript
import { Env } from '@/utils/Env';

export function getPrefix(): string {
    return Env.get().COMMAND_PREFIX;
}
```

### **6.6. StoreRegistry (`core/store/store.registry.ts`)**

**Responsabilidad**: Punto de configuración centralizado de implementaciones de stores

- Registra las implementaciones concretas de `CooldownStore` usadas en el proceso
- Por defecto usa `MemoryCooldownStore` (in-memory, adecuado para single-instance)
- En modo sharding, `index.ts` reemplaza las implementaciones por sus equivalentes Redis **antes** de que `plugins.config.ts` sea evaluado — garantizando que los plugins reciban el store correcto desde el inicio
- `ComponentRegistry` tiene su propio método `useStore()` para el `PayloadStore` (mismo patrón)

**Stores disponibles**:

| Store           | Implementaciones in-memory       | Implementaciones Redis         | Usado por           |
| --------------- | -------------------------------- | ------------------------------ | ------------------- |
| `CooldownStore` | `MemoryCooldownStore`            | `RedisCooldownStore`           | `CooldownPlugin`    |
| `PayloadStore`  | `MemoryPayloadStore`             | `RedisPayloadStore`            | `ComponentRegistry` |

```typescript
// En index.ts — configurar Redis antes de importar Bot (solo si SHARDING_ENABLED=true)
StoreRegistry.useCooldownStore(new RedisCooldownStore(redis));
ComponentRegistry.useStore(new RedisPayloadStore(redis));

// En plugins.config.ts — el store ya está configurado cuando se instancia el plugin
new CooldownPlugin(StoreRegistry.getCooldownStore())
```

### **7. PluginRegistry (`config/plugin.registry.ts`)**

**Responsabilidad**: Gestionar plugins por scope

- **Tres scopes**:
- `Folder`: Solo comandos en una carpeta específica
- `DeepFolder`: Carpeta y todas sus subcarpetas
- `Specified`: Lista específica de comandos
- Matching inteligente de rutas
- API: `register()`, `getPluginsForCommand()`, `clear()`, `getAll()`

**Nuevo**: Sistema completo de scopes para plugins

### **8. BasePlugin (`core/structures/BasePlugin.ts`)**

**Responsabilidad**: Clase base para plugins extensibles

- **4 métodos opcionales** que cubren el ciclo de vida completo:

**🟦 Fase de Registro** (al iniciar el bot):

- `onBeforeRegisterCommand(commandClass, commandJson)`: Antes de registrar en Discord API
    - Recibe clase del comando (sin instanciar) y copia del JSON del comando
    - Retorna: JSON modificado | `false` (cancelar) | `null`/`undefined` (original)
    - **⚠️ IMPORTANTE**: Debe retornar un NUEVO objeto (inmutabilidad) - El JSON original NO se modifica
    - Útil para: modificar comandos, traducciones, filtros por ambiente, acceso a metadata
    - Ejemplo: `PermissionsPlugin` lee metadata de `@RequirePermissions` y agrega `default_member_permissions`
- `onAfterRegisterCommand(commandClass, registeredCommandJson)`: Después de registrar en Discord API
    - Recibe clase del comando y JSON con ID de Discord
    - Útil para: logging, analytics, guardar IDs en BD, mapear clases a IDs

**🔵 Fase de Ejecución** (cuando un usuario ejecuta el comando):

- `onBeforeExecute(command)`: Antes del comando
    - Retorna `true` para continuar, `false` para cancelar silenciosamente
    - Útil para: cooldowns, permisos, validaciones, rate limiting
    - Ejemplo: `PermissionsPlugin` valida que el miembro tenga los permisos requeridos
- `onAfterExecute(command)`: Después del comando
    - Solo se ejecuta si no hubo errores
    - Útil para: logging, analytics, recompensas

**Nuevo**: Sistema de plugins con 4 eventos cubriendo registro y ejecución. **PermissionsPlugin** incluido con 20 tests (unit + integration).

### **9. BaseCommand (`core/structures/BaseCommand.ts`)**

**Responsabilidad**: Clase base para todos los comandos

- Propiedades inyectadas: `ctx`, `user`, `channel`
- Método abstracto: `run()`
- Helpers:
- `reply()`: Responde al usuario
- `send()`: Envía mensaje al canal
- **`getEmbed(type)`**: Crea embeds preconfigurados (error, success, warning, info)
- Soporte para plugins (`onBeforeExecute`, `onAfterExecute`)

**Nuevo**: Método `getEmbed()` para embeds consistentes

### **10. Events (`events/*.event.ts`)**

**Responsabilidad**: Manejar eventos de Discord

- **ready**: Inicialización del bot, registro de comandos y presencia personalizada
- **interactionCreate**: Procesa slash commands + **construye keys kebab-case** + pasa `commandPath` al handler
    - Detecta subcomandos y grupos automáticamente
    - Construye key: `comando-grupo-subcomando` o `comando-subcomando`
- **messageCreate**: Procesa comandos de texto + **construye keys kebab-case** + pasa `commandPath` al handler
    - Prioriza grupos (3 niveles) sobre subcomandos (2 niveles)
    - Construye key consistente con slash commands

**Nuevo**: Los eventos construyen keys kebab-case y pasan `commandPath` para que el handler aplique plugins de scope

## 🔄 Flujo de Ejecución

### Inicio del Bot (Registro de Comandos):

```
Bot.start()
    ↓
SlashCommandLoader.registerSlashCommands()
    ↓
Para cada comando:
    ↓
    CommandLoader.getCommandEntry() [incluye ruta]
    ↓
    Obtener plugins:
        ├─ @UsePlugins (decorador) [PRIORIDAD 1]
        └─ PluginRegistry (scope)  [PRIORIDAD 2]
    ↓
    🟦 onBeforeRegisterCommand (todos los plugins)
        ├─ Recibe copia del JSON del comando
        ├─ Puede modificar (retorna objeto)
        ├─ Puede cancelar (retorna false)
        └─ Puede dejar original (retorna null/undefined)
    ↓
    Discord API: Registrar comando (si no fue cancelado)
    ↓
    🟦 onAfterRegisterCommand (todos los plugins)
        └─ Recibe JSON registrado con ID de Discord
```

### Slash Command (Ejecución):

```
InteractionCreate Event
    ↓
Detectar estructura del comando:
    ├─ Comando base: commandName
    ├─ Subcomando: commandName-subcommand
    └─ Grupo: commandName-group-subcommand
    ↓
Construir key en kebab-case
    Ejemplo: /server config get → "server-config-get"
    ↓
CommandLoader.getCommandEntry(key) [incluye ruta + metadata]
    ↓
CommandHandler.executeCommand(interaction, class, undefined, path)
    ↓
ArgumentResolver.resolveArguments()
    ↓
    ├─ TypeResolver (tipos Discord ya resueltos por Discord.js)
    ├─ Parser personalizado (si existe)
    └─ Validación personalizada
    ↓
Obtener plugins:
    ├─ @UsePlugins (decorador) [PRIORIDAD 1]
    └─ PluginRegistry (scope)  [PRIORIDAD 2]
    ↓
🔵 Ejecutar onBeforeExecute (orden normal)
    ↓
Command.run()
    ↓
🟢 Ejecutar onAfterExecute (orden INVERSO)
```

### Text Command (Ejecución):

```
MessageCreate Event
    ↓
Parse texto (prefijo + argumentos)
    Ejemplo: "!server config get" → ["server", "config", "get"]
    ↓
Intentar recuperar en orden de prioridad:
    1. Grupo (3 niveles): "server-config-get"
    2. Subcomando (2 niveles): "server-config"
    3. Comando base: "server"
    ↓
Construir key en kebab-case y recuperar
    ↓
CommandLoader.getCommandEntry(key) [incluye ruta + metadata]
    ↓
Ajustar argumentos según nivel encontrado:
    ├─ Grupo: args.slice(3) → argumentos después de 3 palabras
    ├─ Subcomando: args.slice(2) → argumentos después de 2 palabras
    └─ Base: args.slice(1) → argumentos después del comando
    ↓
CommandHandler.executeCommand(message, class, args, path)
    ↓
ArgumentResolver.resolveArguments()
    ↓
    ├─ rawText? → extractRawText()
    ├─ TypeResolver.resolveDiscordType() (parsear menciones/IDs)
    ├─ TypeResolver.coerceType() (tipos primitivos)
    ├─ Parser personalizado (si existe)
    └─ Validación personalizada
    ↓
Obtener plugins:
    ├─ @UsePlugins (decorador) [PRIORIDAD 1]
    └─ PluginRegistry (scope)  [PRIORIDAD 2]
    ↓
🔵 Ejecutar onBeforeExecute (orden normal)
    ↓
Command.run()
    ↓
🟢 Ejecutar onAfterExecute (orden INVERSO)
```

### Flujo de Plugins (Detallado):

#### 🟦 Fase de Registro (Al iniciar el bot):

```
Comando: BanCommand en /src/commands/admin/ban.command.ts

Configuración:
  - @UsePlugins(TranslationPlugin)
  - Registry: EnvironmentFilterPlugin (global)
  - Registry: CommandLoggerPlugin (carpeta admin)

Registro:
  1. TranslationPlugin.onBeforeRegisterCommand()     ← Decorador
  2. EnvironmentFilterPlugin.onBeforeRegisterCommand() ← Scope global
  3. CommandLoggerPlugin.onBeforeRegisterCommand()   ← Scope folder
  4. Discord API registra el comando (si no fue cancelado)
  5. TranslationPlugin.onAfterRegisterCommand()      ← Decorador
  6. EnvironmentFilterPlugin.onAfterRegisterCommand() ← Scope global
  7. CommandLoggerPlugin.onAfterRegisterCommand()    ← Scope folder
```

#### 🔵🟢 Fase de Ejecución (Cuando un usuario usa el comando):

```
Comando: BanCommand en /src/commands/admin/ban.command.ts

Configuración:
  - @UsePlugins(PermissionPlugin, AuditLogPlugin)
  - Registry: CooldownPlugin (global)
  - Registry: LoggerPlugin (carpeta admin)

Ejecución:
  1. PermissionPlugin.onBeforeExecute()    ← Decorador
  2. AuditLogPlugin.onBeforeExecute()      ← Decorador
  3. CooldownPlugin.onBeforeExecute()      ← Scope global
  4. LoggerPlugin.onBeforeExecute()        ← Scope folder
  5. BanCommand.run()                      ← COMANDO
  6. LoggerPlugin.onAfterExecute()         ← Inverso
  7. CooldownPlugin.onAfterExecute()       ← Inverso
  8. AuditLogPlugin.onAfterExecute()       ← Inverso
  9. PermissionPlugin.onAfterExecute()     ← Inverso
```

## ✅ Ventajas de esta Arquitectura

1. **Separación de Responsabilidades**: Cada clase tiene una única responsabilidad clara
2. **Testeable**: Componentes pueden ser testeados de forma aislada
3. **Mantenible**: Cambios en una parte no afectan a otras
4. **Escalable**: Fácil agregar nuevos loaders, resolvers, plugins o eventos
5. **Reutilizable**: Componentes pueden ser usados en otros proyectos
6. **Clean Code**: Archivos pequeños y enfocados
7. **Extensible**: Sistema de plugins permite agregar funcionalidad sin modificar código
8. **Flexible**: Múltiples formas de configurar plugins (decorador, scope)
9. **Type-Safe**: TypeScript con strict mode y tipos completos
10. **Documentado**: Cada carpeta tiene su README.md con ejemplos

## 🎯 Principios Aplicados

- **Single Responsibility Principle** (SRP)
- **Separation of Concerns** (SoC)
- **Dependency Injection**
- **Factory Pattern** (Loaders)
- **Strategy Pattern** (Resolvers)
- **Observer Pattern** (Events)
- **Decorator Pattern** (@Command, @Arg, @UsePlugins)
- **Registry Pattern** (PluginRegistry)
- **Template Method Pattern** (BaseCommand, BasePlugin)

## 🆕 Características Nuevas

### 1. **Subcomandos y Grupos de Subcomandos** (v1.1.0)

Sistema completo para organizar comandos en jerarquías de hasta 3 niveles:

#### Tipos de Comandos

- **Comandos Base** (`@Command`): 1 nivel - `/ping`, `/help`
- **Subcomandos** (`@Subcommand`): 2 niveles - `/config get`, `/config set`
- **Grupos de Subcomandos** (`@SubcommandGroup`): 3 niveles - `/server config get`, `/server user info`

#### 🤖 Comandos Fantasma (Sin Overhead)

> **Importante:** **NO necesitas crear archivos base** para subcomandos/grupos. El sistema crea automáticamente "comandos fantasma" en Discord.

**Ejemplo:**

```typescript
// ✅ Solo defines esto:
@Subcommand({ parent: 'config', name: 'get', ... })
// NO necesitas crear config.command.ts

@SubcommandGroup({ parent: 'server', name: 'user', subcommand: 'info', ... })
// NO necesitas crear server.command.ts
```

**El sistema automáticamente:**

1. Detecta padres sin comando base
2. Crea comando fantasma en Discord: `{ name: 'config', description: 'Comandos de config' }`
3. Log: `👻 Comando fantasma creado: "config" (solo contenedor de subcomandos)`
4. Registra todos los subcomandos/grupos correctamente

**Beneficios:** Sin archivos vacíos, mejor DX, menos verboso, sin overhead innecesario.

#### Jerarquía de Decoradores

El sistema prioriza automáticamente:

1. `@SubcommandGroup` (máxima prioridad)
2. `@Subcommand`
3. `@Command` (si no hay otros)

#### Keys en Kebab-Case

Todos los comandos se identifican con keys consistentes:

- Comando base: `help`
- Subcomando: `config-get` (parent: config, name: get)
- Grupo: `server-config-get` (parent: server, name: config, subcommand: get)

#### Sistema Inteligente de Almacenamiento

- **Umbral configurable** (default: 100 comandos)
- **≤ 100 comandos**: Metadata completa en memoria (máximo rendimiento)
- **> 100 comandos**: Sistema de caching con Map (optimización de memoria)

#### Métodos de Recuperación

```typescript
// Obtener subcomandos de un padre
const subcommands = loader.getSubcommands('config');
// Map<'config-get', CommandEntry>, Map<'config-set', CommandEntry>

// Obtener grupos de subcomandos
const groups = loader.getSubcommandGroups('server');
// Map<'config', Map<'server-config-get', CommandEntry>>

// Recuperación por key
const cmd = loader.getCommandEntry('server-config-get');
```

#### Agrupación Automática en Discord

El `SlashCommandLoader` agrupa automáticamente comandos por `parent`:

- Subcomandos simples bajo el comando padre
- Grupos con sus subcomandos anidados
- Soporte para hasta 25 grupos y 25 subcomandos por grupo

#### Documentación

- 📄 [Guía de Subcomandos](../docs/Subcommands.README.md)
- 📄 [Guía de Grupos de Subcomandos](../docs/SubcommandGroups.README.md)
- 📄 [README de Commands](../src/commands/README.md)

### 2. **Sistema de Plugins**

Permite extender la funcionalidad de comandos sin modificar su código:

- **BasePlugin**: Clase base con 4 métodos opcionales:
    - 🟦 `onBeforeRegisterCommand`: Modificar/cancelar comandos antes de registrar en Discord
    - 🟦 `onAfterRegisterCommand`: Logging/analytics después de registrar en Discord
    - 🔵 `onBeforeExecute`: Validaciones antes de ejecutar el comando
    - 🟢 `onAfterExecute`: Acciones después de ejecutar el comando
- **@UsePlugins**: Decorador para plugins específicos por comando
- **PluginRegistry**: Sistema de scopes (Folder, DeepFolder, Specified)
- **Prioridad**: Decorador primero, luego scope (aplica en registro y ejecución)
- **Orden inverso**: `onAfterExecute` se ejecuta en orden inverso
- **Ciclo completo**: Plugins ahora cubren desde el registro hasta la ejecución

### 2. **Raw Text Capture**

Captura todo el texto después del comando sin necesidad de comillas:

```typescript
@Arg({ name: 'mensaje', rawText: true })
public mensaje!: string;

// Usuario: !say Hola mundo sin comillas
// mensaje = "Hola mundo sin comillas"
```

- Solo para text commands
- Excluye argumentos previos automáticamente
- En slash commands funciona como argumento normal

### 3. **Custom Type Parsers**

Soporte para tipos personalizados con validación:

```typescript
@Arg({
    name: 'jugador',
    parser: (val) => MinecraftPlayer.fromString(val),
    type: () => MinecraftPlayer,
})
public jugador!: MinecraftPlayer;
```

- Obligatorio para tipos no primitivos/Discord
- Validación automática de tipo
- Mensajes de error claros

### 4. **Plugin Scopes**

Configuración centralizada de plugins:

```typescript
// Scope Global
PluginRegistry.register({
    plugin: new CooldownPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: '', // Todos los comandos
});

// Scope Folder
PluginRegistry.register({
    plugin: new PermissionPlugin(),
    scope: PluginScope.Folder,
    folderPath: 'admin', // Solo /src/commands/admin/*.command.ts
});

// Scope Specified
PluginRegistry.register({
    plugin: new AuditLogPlugin(),
    scope: PluginScope.Specified,
    commands: [BanCommand, KickCommand],
});
```

### 5. **Helpers en BaseCommand**

```typescript
// Embeds preconfigurados
const embed = this.getEmbed('error').setTitle('❌ Error').setDescription('Algo salió mal');

// Tipos: 'error', 'success', 'warning', 'info'
// Colores automáticos + timestamp
```

### 6. **Rutas de Comandos**

CommandLoader ahora almacena las rutas relativas de cada comando para el sistema de plugins:

```typescript
const entry = commandLoader.getCommandEntry('ban');
// { class: BanCommand, path: 'admin/ban' }
```

### 7. **Validación de Variables de Entorno**

Sistema centralizado de validación con `Env.ts`:

- ✅ Validación al inicio del bot (fail-fast)
- ✅ Type-safe con TypeScript
- ✅ Mensajes de error claros en español
- ✅ Tokens enmascarados en logs
- ✅ Defaults centralizados

```typescript
// En index.ts
Env.load(); // Valida y termina si falta algo

// En cualquier archivo
const config = Env.get();
config.BOT_TOKEN; // Garantizado string, nunca undefined
```

### 8. **RichMessage - Gestión Avanzada de Componentes**

Sistema optimizado para manejar componentes interactivos con un solo timeout global. Los handlers son **métodos estáticos** del comando; sólo el payload (datos serializables) se persiste en el `PayloadStore`:

```typescript
// Handlers estáticos en la clase del comando
public static async buttonAccept(interaction: ButtonInteraction): Promise<void> {
    await interaction.update({ content: '✅ Aceptado', components: [] });
}

public static async buttonReject(interaction: ButtonInteraction): Promise<void> {
    await interaction.update({ content: '❌ Rechazado', components: [] });
}

// En run(): constructor en lugar de builder chain
const richMessage = new RichMessage({
    content: '¿Aceptas los términos?',
    components: [
        new Button({ label: 'Aceptar', variant: ButtonVariant.Success, command: 'terms', method: 'buttonAccept' }),
        new Button({ label: 'Rechazar', variant: ButtonVariant.Danger, command: 'terms', method: 'buttonReject' }),
    ],
    timeout: 30_000,
});

await richMessage.send(this.ctx);
```

**Ventajas:**

- ✅ 1 timeout para N componentes (mejor performance)
- ✅ Handlers como métodos estáticos: cero closures vivas por instancia
- ✅ Payload serializable: intercambiable por Redis/Mongo sin tocar el código
- ✅ Compatible con `send()`, `edit()`

## 📊 Comparación: Antes vs Ahora

| Característica                 | Antes                        | Ahora                                         |
| ------------------------------ | ---------------------------- | --------------------------------------------- |
| **Plugins**                    | ❌ No existían               | ✅ Sistema completo con scopes                |
| **Decorador de plugins**       | ❌ No                        | ✅ @UsePlugins                                |
| **Raw text**                   | ❌ Requerían comillas        | ✅ Captura automática                         |
| **Parsers personalizados**     | ❌ Solo primitivos/Discord   | ✅ Tipos personalizados                       |
| **Rutas de comandos**          | ❌ No se guardaban           | ✅ Almacenadas para scopes                    |
| **getEmbed()**                 | ❌ new EmbedBuilder() manual | ✅ Helper con colores                         |
| **Configuración centralizada** | ❌ Dispersa                  | ✅ /src/config/ + Env.ts                      |
| **Componentes interactivos**   | ❌ Archivos separados        | ✅ Handlers estáticos en la clase del comando |
| **Registry de componentes**    | ❌ customId manual           | ✅ CustomId `cmd:method:id` + PayloadStore    |
| **Gestión de timeouts**        | ❌ N timeouts para N botones | ✅ 1 timeout global con RichMessage           |
| **Validación de env**          | ⚠️ Manual con process.env    | ✅ Centralizada con Env.ts                    |
| **Manejo de errores**          | ⚠️ Básico                    | ✅ ValidationError + ReplyError               |
| **Testing**                    | ❌ No existía                | ✅ Jest + 125 tests pasando                   |
| **Documentación**              | ⚠️ Básica                    | ✅ Completa en cada carpeta                   |

---

## 🎨 Sistema de Componentes Interactivos

### **Problema Resuelto**

El enfoque anterior basado en callbacks (`.onClick(closure)`) escalaba mal:

- ❌ 1 closure por instancia de componente — en 1.000 servidores con 100 componentes activos = 100.000 closures vivas en el heap
- ❌ Imposible mover el estado a un store distribuido (Redis/Mongo)
- ❌ Restart del bot = todas las sesiones perdidas
- ❌ Imposible auditar qué handlers están activos

El sistema actual separa **código** (handlers estáticos) de **estado** (payloads serializables):

- ✅ **Handlers como métodos estáticos** en la clase del comando — K métodos por clase, no N closures por instancia
- ✅ **Payload serializable** almacenado en `PayloadStore` — intercambiable por Redis/Mongo sin tocar el código
- ✅ **CustomId con routing** `<commandKey>:<methodName>:<id>` — lookup O(1)
- ✅ **RichMessage** con timeout único y reset automático por interacción

### **Arquitectura Interna**

```
core/
├── components/
│   ├── Button.ts              # Wrapper de botón
│   ├── Select.ts              # Wrapper de select menu
│   ├── Modal.ts               # Wrapper de modal
│   ├── RichMessage.ts         # Agrupa componentes con timeout único y reset por interacción
│   └── index.ts               # Barrel (incluye NEVER_EXPIRES)
├── registry/
│   └── component.registry.ts  # Owners (RichMessage) + acceso al PayloadStore
└── store/
    ├── cooldown.store.ts       # Contrato CooldownStore + MemoryCooldownStore
    ├── redis.cooldown.store.ts # RedisCooldownStore (para sharding)
    ├── payload.store.ts        # Contrato PayloadStore + MemoryPayloadStore
    ├── redis.payload.store.ts  # RedisPayloadStore (para sharding)
    └── store.registry.ts       # StoreRegistry — punto de configuración de stores
```

### **Contrato del customId**

Formato: `<commandKey>:<methodName>:<id>`

| Segmento     | Descripción                                                      | Ejemplo          |
| ------------ | ---------------------------------------------------------------- | ---------------- |
| `commandKey` | Clave kebab-case bajo la que `CommandLoader` registra al comando | `help`           |
| `methodName` | Nombre del método estático (prefijo `button`/`select`/`modal`)   | `selectCategory` |
| `id`         | `nanoid(10)` para unicidad de la instancia                       | `xR3p9kLm2Q`     |

El dispatcher en `interactionCreate.event.ts`:

1. Parsea `customId` → `commandKey`, `methodName`, `id`
2. Valida que `methodName` empiece con el prefijo correcto para el tipo de interacción
3. Resuelve la clase del comando vía `CommandLoader.getCommand(commandKey)`
4. Ubica el método estático en la clase
5. Recupera el payload por `customId` desde `PayloadStore`
6. Invoca `Class.method(interaction, [values,] payload)`

### **Convención de Nombres de Handlers**

```typescript
public static async buttonXxx(interaction, payload)             // botón
public static async selectXxx(interaction, values, payload)     // select
public static async modalXxx(interaction, payload)              // modal
```

El dispatcher rechaza la interacción si el prefijo no coincide con el tipo recibido.

### **Componentes Disponibles**

#### 1. Button

```typescript
import { Button, ButtonVariant } from '@/core/components';
import type { ButtonInteraction } from 'discord.js';

interface GreetPayload {
    name: string;
}

export class GreetCommand extends GreetDefinition {
    public static async buttonGreet(
        interaction: ButtonInteraction,
        payload: GreetPayload | undefined,
    ): Promise<void> {
        if (payload === undefined) {
            // payload === undefined ⇒ expirado (null/false/0/'' son válidos)
            await BaseCommand.replyEphemeral(interaction, 'Esta interacción expiró.');
            return;
        }
        await interaction.reply(`Hola, ${payload.name}!`);
    }

    async run() {
        const button = new Button<GreetPayload>({
            label: 'Saludar',
            variant: ButtonVariant.Primary,
            command: 'greet',
            method: 'buttonGreet',
            payload: { name: this.user.username },
        });

        const richMsg = new RichMessage({ components: [button], timeout: Times.minutes(2) });
        await richMsg.send(this.ctx);
    }
}
```

**Variantes disponibles:**

```typescript
ButtonVariant.Primary; // Azul
ButtonVariant.Secondary; // Gris
ButtonVariant.Success; // Verde
ButtonVariant.Danger; // Rojo
ButtonVariant.Link; // Link (sin handler ni payload)
```

**Helpers estáticos:**

```typescript
Button.primary(label, command, method, payload?, emoji?)
Button.secondary(label, command, method, payload?, emoji?)
Button.success(label, command, method, payload?, emoji?)
Button.danger(label, command, method, payload?, emoji?)
Button.link(label, url, emoji?)   // sin handler
```

#### 2. Select

```typescript
import { Select } from '@/core/components';
import type { StringSelectMenuInteraction } from 'discord.js';

interface MenuPayload {
    menu: string;
}

export class FooCommand extends FooDefinition {
    public static async selectPick(
        interaction: StringSelectMenuInteraction,
        values: string[],
        payload: MenuPayload | undefined,
    ): Promise<void> {
        if (payload === undefined) {
            await BaseCommand.replyEphemeral(interaction, 'Expirado.');
            return;
        }
        await interaction.reply(`En ${payload.menu} elegiste: ${values[0]}`);
    }

    async run() {
        const select = new Select<MenuPayload>({
            command: 'foo',
            method: 'selectPick',
            payload: { menu: 'principal' },
            placeholder: 'Elige una opción',
            options: [
                { label: 'Opción 1', value: 'opt1', emoji: '1️⃣' },
                { label: 'Opción 2', value: 'opt2', emoji: '2️⃣' },
            ],
        });
        // agregar a un RichMessage...
    }
}
```

#### 3. Modal

```typescript
import { Modal, TextInputStyle } from '@/core/components';
import type { ModalSubmitInteraction } from 'discord.js';

interface ContactPayload {
    topic: string;
}

export class ContactCommand extends ContactDefinition {
    public static async modalContact(
        interaction: ModalSubmitInteraction,
        payload: ContactPayload | undefined,
    ): Promise<void> {
        if (payload === undefined) {
            await BaseCommand.replyEphemeral(interaction, 'Formulario expirado.');
            return;
        }
        const name = interaction.fields.getTextInputValue('name');
        await interaction.reply(`Gracias ${name}! Tema: ${payload.topic}`);
    }

    async run() {
        const modal = new Modal<ContactPayload>({
            command: 'contact',
            method: 'modalContact',
            title: 'Formulario de contacto',
            payload: { topic: 'soporte' },
            fields: [
                { customId: 'name', label: 'Nombre', style: TextInputStyle.Short, required: true },
                {
                    customId: 'message',
                    label: 'Mensaje',
                    style: TextInputStyle.Paragraph,
                    required: true,
                },
            ],
        });

        // Modales no pasan por RichMessage: commit manual + showModal
        await modal.commit(Times.minutes(5));
        if (this.ctx.isInteraction) {
            await this.ctx.source.showModal(modal.getBuilder());
        }
    }
}
```

#### 4. RichMessage

Agrupa varios componentes bajo un único timeout global.

```typescript
import { RichMessage, Button, ButtonVariant, Select, NEVER_EXPIRES } from '@/core/components';
import { Times } from '@/utils/Times';

const richMsg = new RichMessage({
    embeds: [embed],
    components: [button1, button2, select],
    timeout: Times.minutes(2),
});

await richMsg.send(this.ctx);
```

**Ciclo de vida de `send()`:**

1. Persiste el payload de cada componente en el `PayloadStore` con TTL = timeout
2. Registra al `RichMessage` como owner de cada `customId` en `ComponentRegistry`
3. Envía el mensaje al canal/contexto/interacción
4. Arranca el timeout global

**Reset automático por interacción:** el dispatcher invoca `owner.onComponentInteraction(customId)` antes del handler, lo que refresca el TTL de los payloads y reinicia el timeout global. No hay que hacerlo manualmente.

**Edit:**

```typescript
await richMsg.edit({
    embeds: [newEmbed],
    components: [newButton1, newButton2],
    timeout: Times.seconds(30),
});
```

**Modo permanente (sin expiración):**

```typescript
import { NEVER_EXPIRES } from '@/core/components';

const richMsg = new RichMessage({
    components: [roleButton], // sin payload
    timeout: NEVER_EXPIRES,
});
```

> Restricción: un `RichMessage` permanente **no puede** tener componentes con payload. Sin TTL el store crecería sin límite.

### **ComponentRegistry**

Gestiona los owners (`RichMessage`) y provee acceso al `PayloadStore`. No almacena callbacks:

```typescript
// Obtener el RichMessage owner desde un handler estático
import { ComponentRegistry, RichMessage } from '@/core/components';

const owner = ComponentRegistry.getOwner(interaction.customId);
if (owner instanceof RichMessage) {
    await owner.edit({ embeds: [...], components: [...] });
}

// Configurar un store distribuido (al inicio del bot, antes de crear componentes)
ComponentRegistry.useStore(new RedisPayloadStore());
```

### **PayloadStore**

Contrato de persistencia intercambiable definido en `core/store/payload.store.ts`:

```typescript
interface PayloadStore {
    set(id: string, payload: unknown, ttlMs?: number): Promise<void>;
    get<T = unknown>(id: string): Promise<T | undefined>;
    delete(id: string): Promise<void>;
    has(id: string): Promise<boolean>;
}
```

Implementación por defecto: `MemoryPayloadStore` (in-memory + timers de TTL). Para Redis:

```typescript
ComponentRegistry.useStore(new RedisPayloadStore());
```

> Convención obligatoria: `get()` devuelve `undefined` **sólo si** la entrada no existe o expiró. `null`, `false`, `0`, `''` son payloads válidos.

### **Event Handler (Dispatcher)**

El evento `interactionCreate.event.ts` despacha componentes en O(1):

```typescript
// En interactionCreate.event.ts
if (interaction.isButton()) {
    const [commandKey, methodName] = interaction.customId.split(':');
    const owner = ComponentRegistry.getOwner(interaction.customId);
    owner?.onComponentInteraction(interaction.customId); // reset TTL + timeout
    const CommandClass = CommandLoader.getCommand(commandKey);
    const payload = await PayloadStore.get(interaction.customId);
    await CommandClass[methodName](interaction, payload);
}
```

**Ventajas:**

- ✅ Lookup O(1) — sin recorrer un Map de funciones
- ✅ Handlers auditables — son métodos estáticos en código (grep-eables)
- ✅ Restart-safe con store externo (Redis/Mongo)

### **Ejemplo Completo: Paginación con RichMessage**

```typescript
export class ListCommand extends ListDefinition {
    public static async buttonPrev(
        interaction: ButtonInteraction,
        payload: { page: number; total: number } | undefined,
    ): Promise<void> {
        if (payload === undefined) {
            await BaseCommand.replyEphemeral(interaction, 'Paginación expirada.');
            return;
        }
        const newPage = Math.max(0, payload.page - 1);
        const owner = ComponentRegistry.getOwner(interaction.customId);
        if (owner instanceof RichMessage) {
            await owner.edit({
                embeds: [createEmbed(newPage)],
                components: [
                    Button.secondary('◀️', 'list', 'buttonPrev', {
                        page: newPage,
                        total: payload.total,
                    }),
                    Button.secondary('▶️', 'list', 'buttonNext', {
                        page: newPage,
                        total: payload.total,
                    }),
                ],
            });
        }
    }

    public static async buttonNext(
        interaction: ButtonInteraction,
        payload: { page: number; total: number } | undefined,
    ): Promise<void> {
        if (payload === undefined) {
            await BaseCommand.replyEphemeral(interaction, 'Paginación expirada.');
            return;
        }
        const newPage = Math.min(payload.total - 1, payload.page + 1);
        const owner = ComponentRegistry.getOwner(interaction.customId);
        if (owner instanceof RichMessage) {
            await owner.edit({
                embeds: [createEmbed(newPage)],
                components: [
                    Button.secondary('◀️', 'list', 'buttonPrev', {
                        page: newPage,
                        total: payload.total,
                    }),
                    Button.secondary('▶️', 'list', 'buttonNext', {
                        page: newPage,
                        total: payload.total,
                    }),
                ],
            });
        }
    }

    public async run(): Promise<void> {
        const totalPages = 5;
        const richMessage = new RichMessage({
            embeds: [createEmbed(0)],
            components: [
                Button.secondary('◀️ Anterior', 'list', 'buttonPrev', {
                    page: 0,
                    total: totalPages,
                }),
                Button.secondary('Siguiente ▶️', 'list', 'buttonNext', {
                    page: 0,
                    total: totalPages,
                }),
            ],
            timeout: Times.minutes(1),
        });
        await richMessage.send(this.ctx);
    }
}
```

### **Ventajas del Sistema**

| Antes (`.onClick(closure)`)               | Ahora (`command + method + payload`)        |
| ----------------------------------------- | ------------------------------------------- |
| 1 closure por instancia                   | 1 método estático compartido por todas      |
| Memoria del proceso crece con el uso      | Payload se puede mover a Redis              |
| El dispatcher recorre un Map de funciones | Lookup O(1) por `commandKey` + `methodName` |
| Imposible auditar handlers vivos          | Los handlers son código fijo, grep-eables   |
| Restart del bot = sesiones perdidas       | Con store externo, sobreviven al restart    |

## 🛡️ Sistema de Manejo de Errores

### **Tipos de Errores**

#### 1. ValidationError

Errores de validación de argumentos que se muestran al usuario:

```typescript
import { ValidationError } from '@/error/ValidationError';

if (age < 18) {
    throw new ValidationError('Debes ser mayor de 18 años');
}
```

- Se captura en `CommandHandler`
- Se muestra al usuario como embed de error
- No se loggea como error crítico

#### 2. ReplyError

Errores esperados que se muestran al usuario (permisos, cooldowns, etc):

```typescript
import { ReplyError } from '@/error/ReplyError';

if (!hasPermission) {
    throw new ReplyError('No tienes permisos para usar este comando');
}
```

- Se captura en `CommandHandler` y plugins
- Se muestra al usuario como mensaje normal
- No se loggea como error crítico

#### 3. Errores Generales

Errores inesperados del sistema:

```typescript
throw new Error('Error inesperado');
```

- Se captura en `CommandHandler`
- Se loggea en consola
- Se muestra mensaje genérico al usuario

### **Flujo de Manejo**

```
Comando ejecutándose
    ↓
Error lanzado
    ↓
    ├─ ValidationError → Embed de error al usuario
    ├─ ReplyError → Mensaje normal al usuario
    └─ Error genérico → Log + mensaje genérico
```

## 🧪 Sistema de Testing

### **Infraestructura**

- **Jest 29** con soporte completo para TypeScript
- **125 tests** pasando (unit + integration + e2e)
- **Mocks de Discord.js** pre-configurados
- **Path aliases** (`@/`, `@tests/*`) funcionando
- **CI/CD** con GitHub Actions
- **Debug** en VSCode configurado

### **Estructura de Tests**

```
tests/
├── unit/              # Tests unitarios (106 tests)
│   ├── utils/
│   │   ├── Times.test.ts              # 11 tests
│   │   ├── CommandCategories.test.ts  # 9 tests
│   │   └── Env.test.ts                # 46 tests
│   ├── error/
│   │   ├── ValidationError.test.ts    # 6 tests
│   │   └── ReplyError.test.ts         # 6 tests
│   └── plugins/
│       ├── permissions.plugin.test.ts # 13 tests
│       └── cooldown.plugin.test.ts    # 15 tests
├── integration/       # Tests de integración (14 tests)
│   ├── core/
│   │   └── CommandContext.test.ts     # 7 tests
│   └── plugins/
│       └── permissions.plugin.test.ts # 7 tests
├── e2e/               # Tests end-to-end con mocks (5 tests)
│   └── bot.e2e.test.ts
├── mocks/             # Mocks reutilizables
│   └── discord.mock.ts
├── fixtures/          # Datos de prueba
└── helpers/           # Utilidades para tests
```

### **Comandos de Testing**

```bash
npm test                    # Todos los tests
npm run test:coverage       # Con cobertura
npm run test:watch          # Modo watch
npm run test:unit           # Solo unit
npm run test:integration    # Solo integration
npm run test:e2e            # Solo e2e
```

## 🔗 Recursos Relacionados

### **Documentación por Carpeta**

Cada carpeta tiene su `README.md` completo:

- 📁 [`/src/commands/`](src/commands/README.md) - Implementaciones de comandos
- 📁 [`/src/definition/`](src/definition/README.md) - Definiciones de comandos
- 📁 [`/src/plugins/`](src/plugins/README.md) - Sistema de plugins (15+ ideas)
- 📁 [`/src/utils/`](src/utils/README.md) - Utilidades (Times, CommandCategories, Env)
- 📁 [`/src/error/`](src/error/README.md) - Manejo de errores
- 📁 [`/src/core/decorators/`](src/core/decorators/README.md) - @Command, @Arg, @UsePlugins
- 📁 [`/src/core/handlers/`](src/core/handlers/README.md) - CommandHandler
- 📁 [`/src/core/loaders/`](src/core/loaders/README.md) - CommandLoader y SlashCommandLoader
- 📁 [`/src/core/resolvers/`](src/core/resolvers/README.md) - Resolución de tipos y argumentos
- 📁 [`/src/core/structures/`](src/core/structures/README.md) - BaseCommand, BasePlugin, CommandContext
- 📁 [`/src/core/components/`](src/core/components/README.md) - Button, Select, Modal, RichMessage
- 📁 [`/tests/`](tests/README.md) - Testing completo con Jest

### **Ejemplos Funcionales**

- **Comando básico**: [`/src/commands/ping.command.ts`](src/commands/ping.command.ts)
- **Raw text**: [`/src/commands/say.command.ts`](src/commands/say.command.ts)
- **Plugin funcional**: [`/src/plugins/cooldown.plugin.ts`](src/plugins/cooldown.plugin.ts)
- **Configuración de plugins**: [`/src/config/plugins.config.ts`](src/config/plugins.config.ts)
- **Componentes interactivos**: Ver ejemplos en [`/src/core/components/README.md`](src/core/components/README.md)
- **Tests**: [`/tests/unit/utils/Env.test.ts`](tests/unit/utils/Env.test.ts)

### **Archivos de Configuración**

- **Variables de entorno**: [`.env.template`](.env.template)
- **TypeScript**: [`tsconfig.json`](tsconfig.json), [`tsconfig.test.json`](tsconfig.test.json)
- **Jest**: [`jest.config.ts`](jest.config.ts)
- **GitHub Actions**: [`.github/workflows/test.yml`](.github/workflows/test.yml)
- **VSCode Debug**: [`.vscode/launch.json`](.vscode/launch.json)

---

## 📈 Estado Actual del Proyecto

### ✅ Implementado

- Sistema de comandos completo (slash + text)
- Sistema de plugins con scopes
- Componentes interactivos (Button, Select, Modal, RichMessage)
- Validación de variables de entorno (Env.ts)
- Manejo de errores (ValidationError, ReplyError)
- Testing completo (125 tests pasando)
- CI/CD con GitHub Actions
- Documentación completa
- Path aliases funcionando
- Raw text capture
- Custom type parsers

### 🚀 Próximas Mejoras Sugeridas

- [ ] Sistema de permisos avanzado
- [ ] Base de datos (MongoDB/SQLite)
- [ ] Sistema de logs robusto
- [ ] Comandos de administración
- [ ] Dashboard web
- [ ] Internacionalización (i18n)
- [ ] Sistema de economía
- [ ] Comandos de música
- [ ] Comandos de moderación avanzados
- [ ] Sistema de niveles y XP

---

**Última actualización:** 5 de Noviembre, 2025  
**Versión del proyecto:** 1.0.0  
**Tests:** 125/125 pasando ✅
