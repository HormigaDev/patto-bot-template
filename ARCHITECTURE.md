# Arquitectura Modular del Bot

## 📁 Estructura de Carpetas

```
src/
├── bot.ts                          # Clase principal del bot (inicialización)
├── index.ts                        # Punto de entrada con validación de entorno
├── assets/                         # Recursos estáticos (imágenes, JSON, etc.)
├── commands/                       # Implementaciones de comandos
│   ├── *.command.ts               # Comandos individuales
├── config/                        # Configuración de plugins por scope
│   ├── plugin.registry.ts         # Sistema de registro de plugins
│   ├── plugins.config.ts          # Configuración centralizada de plugins
│   └── README.md                  # Documentación completa de scopes
├── core/                          # Núcleo del framework
│   ├── components/                # Wrappers para componentes interactivos
│   │   ├── Button.ts              # Wrapper para botones con onClick
│   │   ├── Select.ts              # Wrapper para selects con onChange
│   │   ├── Modal.ts               # Wrapper para modales con onSubmit
│   │   ├── RichMessage.ts         # Gestión centralizada de componentes con timeout
│   │   ├── index.ts               # Exports de componentes
│   │   └── README.md              # Documentación completa de componentes
│   ├── decorators/                # Decoradores (@Command, @Arg, @UsePlugins)
│   │   ├── command.decorator.ts   # Define metadata de comandos
│   │   ├── argument.decorator.ts  # Define metadata de argumentos
│   │   ├── plugin.decorator.ts    # Define plugins por comando (@UsePlugins)
│   │   └── README.md              # Documentación de decoradores
│   ├── handlers/                  # Manejadores de lógica
│   │   ├── command.handler.ts     # Ejecuta comandos + plugins
│   │   └── README.md              # Documentación de handlers
│   ├── loaders/                   # Cargadores de recursos
│   │   ├── command.loader.ts      # Carga comandos + rutas desde archivos
│   │   └── slash-command.loader.ts # Registra slash commands en Discord
│   ├── registry/                  # Registries globales
│   │   └── component.registry.ts  # Registry de componentes (id → callback)
│   ├── resolvers/                 # Resolvedores de tipos y argumentos
│   │   ├── type.resolver.ts       # Coerción de tipos primitivos y Discord
│   │   ├── argument.resolver.ts   # Resolución completa + rawText + parsers
│   │   ├── prefix.resolver.ts     # Obtiene prefijo desde Env
│   │   └── README.md              # Documentación de resolvers
│   └── structures/                # Estructuras base
│       ├── BaseCommand.ts         # Clase base con getEmbed() y helpers
│       ├── BasePlugin.ts          # Clase base para plugins extensibles
│       ├── CommandContext.ts      # Contexto unificado Message/Interaction
│       └── README.md              # Documentación de estructuras
├── definition/                    # Definiciones de comandos (metadata + args)
│   ├── *.definition.ts            # Definiciones abstractas
│   └── README.md                  # Documentación de definiciones
├── error/                         # Errores personalizados
│   ├── ReplyError.ts              # Errores que se muestran al usuario
│   ├── ValidationError.ts         # Errores de validación de argumentos
│   └── README.md                  # Documentación de manejo de errores
├── events/                        # Eventos de Discord
│   ├── ready.event.ts             # Inicialización y presencia del bot
│   ├── interactionCreate.event.ts # Maneja slash commands + componentes interactivos
│   ├── messageCreate.event.ts     # Maneja text commands + commandPath
│   └── README.md                  # Documentación de eventos
├── plugins/                       # Implementaciones de plugins
│   ├── cooldown.plugin.ts         # Plugin funcional de cooldown
│   └── README.md                  # Documentación completa + 15+ ideas
└── utils/                         # Utilidades reutilizables
    ├── CommandCategories.ts       # Definiciones de categorías de comandos
    ├── Times.ts                   # Conversión de tiempo (segundos, minutos, etc.)
    ├── Env.ts                     # Validación y carga segura de variables de entorno
    └── README.md                  # Documentación de utilidades
```

## 🏗️ Separación de Responsabilidades

### **1. Bot (`bot.ts`)**

**Responsabilidad**: Inicialización y orquestación del bot

-   Crea el cliente de Discord con intents configurados
-   Usa `Env.get()` para obtener configuración validada
-   Determina intents automáticamente según `USE_MESSAGE_CONTENT`
-   Inicializa todos los componentes (CommandLoader, CommandHandler, etc.)
-   Importa configuración de plugins (`/src/config/plugins.config.ts`)
-   Registra eventos
-   Coordina el flujo de inicio

**Imports importantes**:

```typescript
import '@/config/plugins.config'; // Carga configuración de plugins
import { Env } from '@/utils/Env'; // Configuración validada
```

### **1.5. Index (`index.ts`)**

**Responsabilidad**: Punto de entrada con validación de entorno

-   Carga `reflect-metadata` (necesario para decoradores)
-   Carga `dotenv` para variables de entorno
-   **Valida configuración con `Env.load()`** (fail-fast)
-   Importa `Bot` después de validar
-   Inicia el bot

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

-   Valida variables obligatorias (`BOT_TOKEN`, `CLIENT_ID`)
-   Proporciona defaults para opcionales (`COMMAND_PREFIX`, `USE_MESSAGE_CONTENT`)
-   Convierte tipos (string → boolean/number)
-   Muestra mensajes de error claros en español
-   Enmascara tokens en logs
-   Singleton para una única instancia

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

-   Escanea el directorio `commands/` recursivamente (usando `fs` nativo)
-   Carga las clases de comandos
-   **Almacena rutas relativas** de cada comando (para plugin scopes)
-   Gestiona aliases
-   Busca metadata en clase y padres (herencia)
-   Proporciona acceso: `getCommand()`, `getCommandPath()`, `getCommandEntry()`

**Nuevo**: Almacena `CommandEntry` con clase + ruta

### **3. SlashCommandLoader (`core/loaders/slash-command.loader.ts`)**

**Responsabilidad**: Registrar comandos slash en Discord API

-   Convierte metadata de comandos a formato Discord
-   Mapea tipos TypeScript a tipos de Discord
-   Registra comandos en la API de Discord

### **4. CommandHandler (`core/handlers/command.handler.ts`)**

**Responsabilidad**: Ejecutar comandos con plugins y argumentos

-   Instancia el comando
-   Inyecta contexto y argumentos
-   **Obtiene plugins** de dos fuentes:

1. Plugins de `@UsePlugins` (decorador) - Máxima prioridad
2. Plugins de scope (PluginRegistry) - Segunda prioridad

-   **Ejecuta plugins**:
-   `onBeforeExecute` en orden normal
-   `command.run()` (el comando)
-   `onAfterExecute` en orden INVERSO
-   Maneja errores de ejecución y validación

**Nuevo**: Integración completa del sistema de plugins

### **5. ArgumentResolver (`core/resolvers/argument.resolver.ts`)**

**Responsabilidad**: Resolver y validar argumentos

-   Obtiene valores raw de la fuente (Message o Interaction)
-   **Maneja `rawText`**: Captura todo el texto después del comando
-   **Maneja `parser`**: Tipos personalizados con validación
-   Delega resolución de tipos a TypeResolver
-   Ejecuta validaciones personalizadas
-   Retorna argumentos resueltos

**Nuevo**: Soporte para `rawText` y `parser` personalizado

### **6. TypeResolver (`core/resolvers/type.resolver.ts`)**

**Responsabilidad**: Coerción y resolución de tipos

-   Tipos primitivos: String, Number, Boolean, Array
-   Tipos Discord: User, Member, Channel, Role
-   Parsea menciones y IDs
-   Hace fetch en Discord API cuando es necesario

### **6.5. PrefixResolver (`core/resolvers/prefix.resolver.ts`)**

**Responsabilidad**: Obtener prefijo de comandos de texto

-   Usa `Env.get().COMMAND_PREFIX` para obtener prefijo configurado
-   Centralizado en un solo lugar
-   Default: `!`

```typescript
import { Env } from '@/utils/Env';

export function getPrefix(): string {
    return Env.get().COMMAND_PREFIX;
}
```

### **7. PluginRegistry (`config/plugin.registry.ts`)**

**Responsabilidad**: Gestionar plugins por scope

-   **Tres scopes**:
-   `Folder`: Solo comandos en una carpeta específica
-   `DeepFolder`: Carpeta y todas sus subcarpetas
-   `Specified`: Lista específica de comandos
-   Matching inteligente de rutas
-   API: `register()`, `getPluginsForCommand()`, `clear()`, `getAll()`

**Nuevo**: Sistema completo de scopes para plugins

### **8. BasePlugin (`core/structures/BasePlugin.ts`)**

**Responsabilidad**: Clase base para plugins extensibles

-   **4 métodos opcionales** que cubren el ciclo de vida completo:

**🟦 Fase de Registro** (al iniciar el bot):

-   `onBeforeRegisterCommand(commandClass, commandJson)`: Antes de registrar en Discord API
    -   Recibe clase del comando (sin instanciar) y copia del JSON del comando
    -   Retorna: JSON modificado | `false` (cancelar) | `null`/`undefined` (original)
    -   **⚠️ IMPORTANTE**: Debe retornar un NUEVO objeto (inmutabilidad) - El JSON original NO se modifica
    -   Útil para: modificar comandos, traducciones, filtros por ambiente, acceso a metadata
    -   Ejemplo: `PermissionsPlugin` lee metadata de `@RequirePermissions` y agrega `default_member_permissions`
-   `onAfterRegisterCommand(commandClass, registeredCommandJson)`: Después de registrar en Discord API
    -   Recibe clase del comando y JSON con ID de Discord
    -   Útil para: logging, analytics, guardar IDs en BD, mapear clases a IDs

**🔵 Fase de Ejecución** (cuando un usuario ejecuta el comando):

-   `onBeforeExecute(command)`: Antes del comando
    -   Retorna `true` para continuar, `false` para cancelar silenciosamente
    -   Útil para: cooldowns, permisos, validaciones, rate limiting
    -   Ejemplo: `PermissionsPlugin` valida que el miembro tenga los permisos requeridos
-   `onAfterExecute(command)`: Después del comando
    -   Solo se ejecuta si no hubo errores
    -   Útil para: logging, analytics, recompensas

**Nuevo**: Sistema de plugins con 4 eventos cubriendo registro y ejecución. **PermissionsPlugin** incluido con 20 tests (unit + integration).

### **9. BaseCommand (`core/structures/BaseCommand.ts`)**

**Responsabilidad**: Clase base para todos los comandos

-   Propiedades inyectadas: `ctx`, `user`, `channel`
-   Método abstracto: `run()`
-   Helpers:
-   `reply()`: Responde al usuario
-   `send()`: Envía mensaje al canal
-   **`getEmbed(type)`**: Crea embeds preconfigurados (error, success, warning, info)
-   Soporte para plugins (`onBeforeExecute`, `onAfterExecute`)

**Nuevo**: Método `getEmbed()` para embeds consistentes

### **10. Events (`events/*.event.ts`)**

**Responsabilidad**: Manejar eventos de Discord

-   **ready**: Inicialización del bot, registro de comandos y presencia personalizada
-   **interactionCreate**: Procesa slash commands + **pasa `commandPath`** al handler
-   **messageCreate**: Procesa comandos de texto + **pasa `commandPath`** al handler

**Nuevo**: Los eventos pasan `commandPath` para que el handler aplique plugins de scope

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
CommandLoader.getCommandEntry() [NUEVO: incluye ruta]
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
    ↓
CommandLoader.getCommandEntry() [NUEVO: incluye ruta]
    ↓
CommandHandler.executeCommand(message, class, args, path)
    ↓
ArgumentResolver.resolveArguments()
    ↓
    ├─ rawText? → extractRawText() [NUEVO]
    ├─ TypeResolver.resolveDiscordType() (parsear menciones/IDs)
    ├─ TypeResolver.coerceType() (tipos primitivos)
    ├─ Parser personalizado (si existe) [NUEVO]
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

-   **Single Responsibility Principle** (SRP)
-   **Separation of Concerns** (SoC)
-   **Dependency Injection**
-   **Factory Pattern** (Loaders)
-   **Strategy Pattern** (Resolvers)
-   **Observer Pattern** (Events)
-   **Decorator Pattern** (@Command, @Arg, @UsePlugins)
-   **Registry Pattern** (PluginRegistry)
-   **Template Method Pattern** (BaseCommand, BasePlugin)

## 🆕 Características Nuevas

### 1. **Sistema de Plugins**

Permite extender la funcionalidad de comandos sin modificar su código:

-   **BasePlugin**: Clase base con 4 métodos opcionales:
    -   🟦 `onBeforeRegisterCommand`: Modificar/cancelar comandos antes de registrar en Discord
    -   🟦 `onAfterRegisterCommand`: Logging/analytics después de registrar en Discord
    -   🔵 `onBeforeExecute`: Validaciones antes de ejecutar el comando
    -   🟢 `onAfterExecute`: Acciones después de ejecutar el comando
-   **@UsePlugins**: Decorador para plugins específicos por comando
-   **PluginRegistry**: Sistema de scopes (Folder, DeepFolder, Specified)
-   **Prioridad**: Decorador primero, luego scope (aplica en registro y ejecución)
-   **Orden inverso**: `onAfterExecute` se ejecuta en orden inverso
-   **Ciclo completo**: Plugins ahora cubren desde el registro hasta la ejecución

### 2. **Raw Text Capture**

Captura todo el texto después del comando sin necesidad de comillas:

```typescript
@Arg({ name: 'mensaje', rawText: true })
public mensaje!: string;

// Usuario: !say Hola mundo sin comillas
// mensaje = "Hola mundo sin comillas"
```

-   Solo para text commands
-   Excluye argumentos previos automáticamente
-   En slash commands funciona como argumento normal

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

-   Obligatorio para tipos no primitivos/Discord
-   Validación automática de tipo
-   Mensajes de error claros

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

-   ✅ Validación al inicio del bot (fail-fast)
-   ✅ Type-safe con TypeScript
-   ✅ Mensajes de error claros en español
-   ✅ Tokens enmascarados en logs
-   ✅ Defaults centralizados

```typescript
// En index.ts
Env.load(); // Valida y termina si falta algo

// En cualquier archivo
const config = Env.get();
config.BOT_TOKEN; // Garantizado string, nunca undefined
```

### 8. **RichMessage - Gestión Avanzada de Componentes**

Sistema optimizado para manejar componentes interactivos con un solo timeout global:

```typescript
const richMessage = new RichMessage()
    .addButton(
        Button.primary('Aceptar').onClick(async (i) => {
            /* ... */
        }),
    )
    .addButton(
        Button.danger('Rechazar').onClick(async (i) => {
            /* ... */
        }),
    )
    .setTimeout(30_000); // 30 segundos para TODOS los componentes

await this.reply(
    richMessage.toReplyOptions({
        content: '¿Aceptas los términos?',
    }),
);
```

**Ventajas:**

-   ✅ Un timeout para N componentes (mejor performance)
-   ✅ Cleanup automático de callbacks
-   ✅ Métodos builder pattern
-   ✅ Compatible con reply/send/edit

## 📊 Comparación: Antes vs Ahora

| Característica                 | Antes                        | Ahora                               |
| ------------------------------ | ---------------------------- | ----------------------------------- |
| **Plugins**                    | ❌ No existían               | ✅ Sistema completo con scopes      |
| **Decorador de plugins**       | ❌ No                        | ✅ @UsePlugins                      |
| **Raw text**                   | ❌ Requerían comillas        | ✅ Captura automática               |
| **Parsers personalizados**     | ❌ Solo primitivos/Discord   | ✅ Tipos personalizados             |
| **Rutas de comandos**          | ❌ No se guardaban           | ✅ Almacenadas para scopes          |
| **getEmbed()**                 | ❌ new EmbedBuilder() manual | ✅ Helper con colores               |
| **Configuración centralizada** | ❌ Dispersa                  | ✅ /src/config/ + Env.ts            |
| **Componentes interactivos**   | ❌ Archivos separados        | ✅ Wrappers con callbacks inline    |
| **Registry de componentes**    | ❌ customId manual           | ✅ Registry automático              |
| **Gestión de timeouts**        | ❌ N timeouts para N botones | ✅ 1 timeout global con RichMessage |
| **Validación de env**          | ⚠️ Manual con process.env    | ✅ Centralizada con Env.ts          |
| **Manejo de errores**          | ⚠️ Básico                    | ✅ ValidationError + ReplyError     |
| **Testing**                    | ❌ No existía                | ✅ Jest + 57 tests pasando          |
| **Documentación**              | ⚠️ Básica                    | ✅ Completa en cada carpeta         |

---

## 🎨 Sistema de Componentes Interactivos

### **Problema Resuelto**

Antes, crear botones y selects requería:

-   ❌ Crear archivos separados (`*.button.ts`, `*.select.ts`)
-   ❌ Gestionar customIds manualmente
-   ❌ Pasar información en los IDs
-   ❌ Código disperso y difícil de mantener

Ahora con el sistema de componentes:

-   ✅ **Callbacks inline** dentro del comando
-   ✅ **Registry automático** de customId → función
-   ✅ **Type-safe** con tipos completos de Discord.js
-   ✅ **Sin boilerplate** ni archivos extra
-   ✅ **RichMessage** para gestión avanzada con timeout único

### **Componentes Disponibles**

#### 1. Button Wrapper

Crea botones con variantes predefinidas:

```typescript
import { Button, ButtonVariant } from '@/core/components';

// Variantes disponibles
const primary = Button.primary('Label', '🔵');
const success = Button.success('Label', '✅');
const danger = Button.danger('Label', '⛔');
const secondary = Button.secondary('Label', '⚪');
const link = Button.link('Label', 'https://...', '🔗');

// Con callback
const button = Button.primary('Click me').onClick(async (interaction) => {
    await interaction.reply('¡Clickeado!');
});
```

#### 2. Select Wrapper

Crea select menus con onChange:

```typescript
import { Select } from '@/core/components';

const select = new Select({
    placeholder: 'Elige una opción',
    options: [
        { label: 'Opción 1', value: 'opt1', emoji: '1️⃣' },
        { label: 'Opción 2', value: 'opt2', emoji: '2️⃣' },
    ],
}).onChange(async (interaction, values) => {
    // values = ['opt1'] o ['opt2']
    await interaction.reply(`Seleccionaste: ${values[0]}`);
});
```

#### 3. Modal Wrapper

Crea modales (formularios) con onSubmit:

```typescript
import { Modal } from '@/core/components';

const modal = new Modal({
    title: 'Formulario de Contacto',
    fields: [
        {
            customId: 'name',
            label: 'Nombre',
            style: TextInputStyle.Short,
            required: true,
        },
        {
            customId: 'message',
            label: 'Mensaje',
            style: TextInputStyle.Paragraph,
            required: true,
        },
    ],
}).onSubmit(async (interaction, values) => {
    // values = { name: 'Juan', message: 'Hola mundo' }
    await interaction.reply(`Gracias ${values.name}!`);
});

// Mostrar modal
await interaction.showModal(modal.getBuilder());
```

#### 4. RichMessage - Gestión Avanzada

Gestión centralizada de múltiples componentes con un solo timeout:

```typescript
import { RichMessage, Button } from '@/core/components';

const richMessage = new RichMessage()
    .addButton(
        Button.primary('Aceptar').onClick(async (i) => {
            await i.update({ content: '✅ Aceptado', components: [] });
        }),
    )
    .addButton(
        Button.danger('Rechazar').onClick(async (i) => {
            await i.update({ content: '❌ Rechazado', components: [] });
        }),
    )
    .addSelect(
        new Select({
            placeholder: 'Opciones adicionales',
            options: [
                /* ... */
            ],
        }).onChange(async (i, values) => {
            await i.reply(`Seleccionaste: ${values.join(', ')}`);
        }),
    )
    .setTimeout(30_000) // 30 segundos para TODOS los componentes
    .onTimeout(() => {
        console.log('Componentes expirados y limpiados');
    });

// Enviar con reply/send/edit
await this.reply(
    richMessage.toReplyOptions({
        content: '¿Qué deseas hacer?',
        embeds: [embed],
    }),
);
```

**Ventajas de RichMessage:**

-   ✅ **1 timeout** para N componentes (vs N timeouts)
-   ✅ **Cleanup automático** de callbacks del registry
-   ✅ **Builder pattern** con métodos encadenados
-   ✅ **Compatible** con `reply()`, `send()`, `editReply()`
-   ✅ **Callback onTimeout** para limpieza personalizada
-   ✅ **Mejor performance** - reduce carga del event loop

### **ComponentRegistry**

Registry global que almacena componentes automáticamente:

```typescript
// Interno - los wrappers lo usan automáticamente
ComponentRegistry.registerButton(customId, callback);
ComponentRegistry.registerSelect(customId, callback);

// Obtener estadísticas
const stats = ComponentRegistry.getStats();
// { buttons: 5, selects: 2, modals: 0, total: 7 }
```

### **Event Handler**

El evento `interactionCreate.event.ts` maneja todas las interacciones en un solo lugar:

```typescript
// En interactionCreate.event.ts
async execute(interaction: Interaction) {
    // Slash commands
    if (interaction.isChatInputCommand()) {
        // Ejecutar comando
    }

    // Botones
    if (interaction.isButton()) {
        const callback = ComponentRegistry.getButton(interaction.customId);
        if (callback) await callback(interaction);
    }

    // Selects
    if (interaction.isStringSelectMenu()) {
        const callback = ComponentRegistry.getSelect(interaction.customId);
        if (callback) await callback(interaction, interaction.values);
    }
}
```

**Ventajas:**

-   ✅ Un solo evento para todo
-   ✅ Flujo profesional y limpio
-   ✅ Fácil de mantener

### **Ejemplo Completo: Paginación con RichMessage**

```typescript
export class ListCommand extends ListDefinition {
    public async run(): Promise<void> {
        let page = 0;
        const totalPages = 5;

        const richMessage = new RichMessage();

        const prevBtn = Button.secondary('◀️ Anterior').onClick(async (interaction) => {
            if (page > 0) {
                page--;
                await interaction.update({
                    embeds: [createEmbed(page)],
                });
            }
        });

        const nextBtn = Button.secondary('Siguiente ▶️').onClick(async (interaction) => {
            if (page < totalPages - 1) {
                page++;
                await interaction.update({
                    embeds: [createEmbed(page)],
                });
            }
        });

        richMessage
            .addButton(prevBtn)
            .addButton(nextBtn)
            .setTimeout(60_000) // 1 minuto para ambos botones
            .onTimeout(() => {
                console.log('Paginación expirada');
            });

        await this.reply(
            richMessage.toReplyOptions({
                embeds: [createEmbed(page)],
            }),
        );
    }
}
```

### **Ejemplo: Formulario con Modal**

```typescript
export class ReportCommand extends ReportDefinition {
    public async run(): Promise<void> {
        const modal = new Modal({
            title: 'Reportar Usuario',
            fields: [
                {
                    customId: 'user',
                    label: 'ID del Usuario',
                    style: TextInputStyle.Short,
                    required: true,
                    placeholder: '123456789',
                },
                {
                    customId: 'reason',
                    label: 'Razón del Reporte',
                    style: TextInputStyle.Paragraph,
                    required: true,
                    minLength: 10,
                    maxLength: 1000,
                },
            ],
        }).onSubmit(async (interaction, values) => {
            const userId = values.user;
            const reason = values.reason;

            // Procesar reporte
            await this.processReport(userId, reason);

            await interaction.reply({
                content: '✅ Reporte enviado correctamente',
                ephemeral: true,
            });
        });

        // Los modales se muestran desde interacciones
        if (this.ctx.isInteraction) {
            await this.ctx.source.showModal(modal.getBuilder());
        }
    }
}
```

### **Ventajas del Sistema**

1. **Sin archivos extra**: Todo en el mismo comando
2. **Type-safe**: TypeScript valida los tipos
3. **Limpio**: Callbacks inline, sin pasar datos en IDs
4. **Mantenible**: Código relacionado junto
5. **Automático**: Registry y cleanup automático
6. **Flexible**: Soporta botones, selects, modales
7. **Optimizado**: RichMessage con timeout único
8. **Performance**: Menos carga en el event loop

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

-   Se captura en `CommandHandler`
-   Se muestra al usuario como embed de error
-   No se loggea como error crítico

#### 2. ReplyError

Errores esperados que se muestran al usuario (permisos, cooldowns, etc):

```typescript
import { ReplyError } from '@/error/ReplyError';

if (!hasPermission) {
    throw new ReplyError('No tienes permisos para usar este comando');
}
```

-   Se captura en `CommandHandler` y plugins
-   Se muestra al usuario como mensaje normal
-   No se loggea como error crítico

#### 3. Errores Generales

Errores inesperados del sistema:

```typescript
throw new Error('Error inesperado');
```

-   Se captura en `CommandHandler`
-   Se loggea en consola
-   Se muestra mensaje genérico al usuario

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

-   **Jest 29** con soporte completo para TypeScript
-   **57 tests** pasando (unit + integration)
-   **Mocks de Discord.js** pre-configurados
-   **Path aliases** (`@/`, `@tests/*`) funcionando
-   **CI/CD** con GitHub Actions
-   **Debug** en VSCode configurado

### **Estructura de Tests**

```
tests/
├── unit/              # Tests unitarios (utils, errors)
│   ├── utils/
│   │   ├── Times.test.ts           # 11 tests
│   │   ├── CommandCategories.test.ts # 9 tests
│   │   └── Env.test.ts             # 18 tests
│   └── error/
│       ├── ValidationError.test.ts  # 6 tests
│       └── ReplyError.test.ts       # 6 tests
├── integration/       # Tests de integración
│   └── core/
│       └── CommandContext.test.ts   # 7 tests
├── e2e/              # Tests end-to-end (placeholders)
├── mocks/            # Mocks reutilizables
│   └── discord.mock.ts
├── fixtures/         # Datos de prueba
└── helpers/          # Utilidades para tests
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

-   📁 [`/src/commands/`](src/commands/README.md) - Implementaciones de comandos
-   📁 [`/src/definition/`](src/definition/README.md) - Definiciones de comandos
-   📁 [`/src/plugins/`](src/plugins/README.md) - Sistema de plugins (15+ ideas)
-   📁 [`/src/utils/`](src/utils/README.md) - Utilidades (Times, CommandCategories, Env)
-   📁 [`/src/error/`](src/error/README.md) - Manejo de errores
-   📁 [`/src/core/decorators/`](src/core/decorators/README.md) - @Command, @Arg, @UsePlugins
-   📁 [`/src/core/handlers/`](src/core/handlers/README.md) - CommandHandler
-   📁 [`/src/core/loaders/`](src/core/loaders/README.md) - CommandLoader y SlashCommandLoader
-   📁 [`/src/core/resolvers/`](src/core/resolvers/README.md) - Resolución de tipos y argumentos
-   📁 [`/src/core/structures/`](src/core/structures/README.md) - BaseCommand, BasePlugin, CommandContext
-   📁 [`/src/core/components/`](src/core/components/README.md) - Button, Select, Modal, RichMessage
-   📁 [`/tests/`](tests/README.md) - Testing completo con Jest

### **Ejemplos Funcionales**

-   **Comando básico**: [`/src/commands/ping.command.ts`](src/commands/ping.command.ts)
-   **Raw text**: [`/src/commands/say.command.ts`](src/commands/say.command.ts)
-   **Plugin funcional**: [`/src/plugins/cooldown.plugin.ts`](src/plugins/cooldown.plugin.ts)
-   **Configuración de plugins**: [`/src/config/plugins.config.ts`](src/config/plugins.config.ts)
-   **Componentes interactivos**: Ver ejemplos en [`/src/core/components/README.md`](src/core/components/README.md)
-   **Tests**: [`/tests/unit/utils/Env.test.ts`](tests/unit/utils/Env.test.ts)

### **Archivos de Configuración**

-   **Variables de entorno**: [`.env.template`](.env.template)
-   **TypeScript**: [`tsconfig.json`](tsconfig.json), [`tsconfig.test.json`](tsconfig.test.json)
-   **Jest**: [`jest.config.ts`](jest.config.ts)
-   **GitHub Actions**: [`.github/workflows/test.yml`](.github/workflows/test.yml)
-   **VSCode Debug**: [`.vscode/launch.json`](.vscode/launch.json)

---

## 📈 Estado Actual del Proyecto

### ✅ Implementado

-   Sistema de comandos completo (slash + text)
-   Sistema de plugins con scopes
-   Componentes interactivos (Button, Select, Modal, RichMessage)
-   Validación de variables de entorno (Env.ts)
-   Manejo de errores (ValidationError, ReplyError)
-   Testing completo (57 tests pasando)
-   CI/CD con GitHub Actions
-   Documentación completa
-   Path aliases funcionando
-   Raw text capture
-   Custom type parsers

### 🚀 Próximas Mejoras Sugeridas

-   [ ] Sistema de permisos avanzado
-   [ ] Base de datos (MongoDB/SQLite)
-   [ ] Sistema de logs robusto
-   [ ] Comandos de administración
-   [ ] Dashboard web
-   [ ] Internacionalización (i18n)
-   [ ] Sistema de economía
-   [ ] Comandos de música
-   [ ] Comandos de moderación avanzados
-   [ ] Sistema de niveles y XP

---

**Última actualización:** 5 de Noviembre, 2025  
**Versión del proyecto:** 1.0.0  
**Tests:** 57/57 pasando ✅
