# Arquitectura Modular del Bot

## 📁 Estructura de Carpetas

```
src/
├── bot.ts                          # Clase principal del bot (inicialización)
├── index.ts                        # Punto de entrada
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
│   └── ValidationError.ts         # Errores de validación de argumentos
├── events/                        # Eventos de Discord
│   ├── ready.event.ts             # Inicialización y presencia del bot
│   ├── interactionCreate.event.ts # Maneja slash commands + botones/selects/modales
│   ├── messageCreate.event.ts     # Maneja text commands + commandPath
│   └── README.md                  # Documentación de eventos
└── plugins/                       # Implementaciones de plugins
    ├── cooldown.plugin.ts         # Plugin funcional de cooldown
    └── README.md                  # Documentación completa + 15+ ideas
```

## 🏗️ Separación de Responsabilidades

### **1. Bot (`bot.ts`)**

**Responsabilidad**: Inicialización y orquestación del bot

-   Crea el cliente de Discord
-   Inicializa todos los componentes (CommandLoader, CommandHandler, etc.)
-   Importa configuración de plugins (`/src/config/plugins.config.ts`)
-   Registra eventos
-   Coordina el flujo de inicio

**Imports importantes**:

```typescript
import '@/config/plugins.config'; // Carga configuración de plugins
```

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

-   Métodos opcionales:
-   `onBeforeExecute(command)`: Antes del comando
-   `onAfterExecute(command)`: Después del comando
-   Permite crear plugins reutilizables (cooldown, permisos, logging, etc.)

**Nuevo**: Sistema de plugins extensibles

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

### Slash Command:

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
Ejecutar onBeforeExecute (orden normal)
    ↓
Command.run()
    ↓
Ejecutar onAfterExecute (orden INVERSO)
```

### Text Command:

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
Ejecutar onBeforeExecute (orden normal)
    ↓
Command.run()
    ↓
Ejecutar onAfterExecute (orden INVERSO)
```

### Flujo de Plugins (Detallado):

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

-   **BasePlugin**: Clase base con `onBeforeExecute` y `onAfterExecute`
-   **@UsePlugins**: Decorador para plugins específicos por comando
-   **PluginRegistry**: Sistema de scopes (Folder, DeepFolder, Specified)
-   **Prioridad**: Decorador primero, luego scope
-   **Orden inverso**: `onAfterExecute` se ejecuta en orden inverso

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

## 📊 Comparación: Antes vs Ahora

| Característica                 | Antes                        | Ahora                            |
| ------------------------------ | ---------------------------- | -------------------------------- |
| **Plugins**                    | ❌ No existían               | ✅ Sistema completo con scopes   |
| **Decorador de plugins**       | ❌ No                        | ✅ @UsePlugins                   |
| **Raw text**                   | ❌ Requerían comillas        | ✅ Captura automática            |
| **Parsers personalizados**     | ❌ Solo primitivos/Discord   | ✅ Tipos personalizados          |
| **Rutas de comandos**          | ❌ No se guardaban           | ✅ Almacenadas para scopes       |
| **getEmbed()**                 | ❌ new EmbedBuilder() manual | ✅ Helper con colores            |
| **Configuración centralizada** | ❌ Dispersa                  | ✅ /src/config/                  |
| **Componentes interactivos**   | ❌ Archivos separados        | ✅ Wrappers con callbacks inline |
| **Registry de componentes**    | ❌ customId manual           | ✅ Registry automático           |
| **Documentación**              | ⚠️ Básica                    | ✅ Completa en cada carpeta      |

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

### **Ejemplo Completo: Paginación**

```typescript
export class ListCommand extends ListDefinition {
    public async run(): Promise<void> {
        let page = 0;
        const totalPages = 5;

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

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            prevBtn.getBuilder(),
            nextBtn.getBuilder(),
        );

        await this.reply({
            embeds: [createEmbed(page)],
            components: [row],
        });
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

## 🔗 Recursos Relacionados

-   **Documentación por Carpeta**: Cada carpeta tiene su `README.md`
-   **Ejemplos Funcionales**: `/src/commands/say.command.ts`, `/src/commands/announce.command.ts`
-   **Plugin Funcional**: `/src/plugins/cooldown.plugin.ts`
-   **Configuración de Ejemplo**: `/src/config/plugins.config.ts`
