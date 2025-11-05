# Carpeta: Core

## 📖 Descripción

Esta carpeta contiene el **núcleo del framework** de comandos. Aquí reside toda la infraestructura que hace funcionar el sistema de comandos del bot.

## 🏗️ Estructura

```
core/
├── decorators/          # Decoradores (@Command, @Arg)
│   ├── command.decorator.ts
│   └── argument.decorator.ts
├── handlers/            # Manejadores de lógica
│   └── command.handler.ts
├── loaders/             # Cargadores de recursos
│   ├── command.loader.ts
│   └── slash-command.loader.ts
├── resolvers/           # Resolvedores de tipos
│   ├── type.resolver.ts
│   └── argument.resolver.ts
└── structures/          # Estructuras base
    ├── BaseCommand.ts
    ├── BasePlugin.ts
    └── CommandContext.ts
```

## 📂 Subcarpetas

### `/decorators/`

Decoradores TypeScript para definir comandos y argumentos.

**Archivos:**

-   `command.decorator.ts` - Decorador `@Command` para metadatos de comandos
-   `argument.decorator.ts` - Decorador `@Arg` para definir argumentos

**Ver:** [README de decorators](/src/core/decorators/README.md)

---

### `/handlers/`

Manejadores que ejecutan la lógica central del sistema.

**Archivos:**

-   `command.handler.ts` - Ejecuta comandos, inyecta contexto y maneja errores

**Ver:** [README de handlers](/src/core/handlers/README.md)

---

### `/loaders/`

Cargadores que escanean, cargan y registran comandos.

**Archivos:**

-   `command.loader.ts` - Carga comandos desde el sistema de archivos
-   `slash-command.loader.ts` - Registra comandos en Discord API

**Ver:** [README de loaders](/src/core/loaders/README.md)

---

### `/resolvers/`

Resolvedores que convierten valores raw a tipos específicos.

**Archivos:**

-   `type.resolver.ts` - Coerción de tipos primitivos y Discord
-   `argument.resolver.ts` - Resolución completa de argumentos con validación

**Ver:** [README de resolvers](/src/core/resolvers/README.md)

---

### `/structures/`

Clases base y estructuras fundamentales.

**Archivos:**

-   `BaseCommand.ts` - Clase abstracta base para todos los comandos
-   `BasePlugin.ts` - Clase abstracta base para plugins extensibles
-   `CommandContext.ts` - Contexto unificado de ejecución de comandos

**Ver:** [README de structures](/src/core/structures/README.md)

---

## 🔄 Flujo de Ejecución

```
┌─────────────────────────────────────────────────────────────┐
│                    INICIO DEL BOT                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  CommandLoader                                              │
│  • Escanea /src/commands/                                   │
│  • Lee metadatos de @Command                                │
│  • Registra comandos en Map                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  SlashCommandLoader                                         │
│  • Convierte metadatos a formato Discord                    │
│  • Registra en Discord API                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│           COMANDO RECIBIDO (Interaction o Message)          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Plugins (onBeforeExecute)                                  │
│  • Validaciones previas (Cooldowns, Permisos, etc.)        │
│  • Si lanza error, se cancela la ejecución                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  CommandHandler                                             │
│  • Instancia el comando                                     │
│  • Crea CommandContext                                      │
│  • Inyecta ctx, user, channel                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  ArgumentResolver                                           │
│  • Obtiene valores raw                                      │
│  • Valida argumentos requeridos                            │
│  • Llama a TypeResolver                                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  TypeResolver                                               │
│  • Coerce tipos primitivos (String, Number, Boolean)       │
│  • Resuelve tipos Discord (User, Channel, Role, Member)    │
│  • Parsea menciones y IDs                                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  ArgumentResolver (continuación)                            │
│  • Ejecuta validaciones personalizadas                      │
│  • Retorna argumentos resueltos                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  CommandHandler (continuación)                              │
│  • Inyecta argumentos en el comando                        │
│  • Ejecuta comando.run()                                    │
│  • Maneja errores                                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Plugins (onAfterExecute)                                   │
│  • Acciones post-ejecución (Logging, Analytics, etc.)      │
│  • Solo se ejecuta si no hubo errores                      │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Principios de Diseño

### 1. Single Responsibility Principle (SRP)

Cada clase tiene una única responsabilidad:

-   **CommandLoader**: Solo carga comandos
-   **CommandHandler**: Solo ejecuta comandos
-   **TypeResolver**: Solo resuelve tipos
-   **ArgumentResolver**: Solo resuelve argumentos

### 2. Separation of Concerns (SoC)

La lógica está separada por dominio:

-   **Decorators**: Metadatos
-   **Loaders**: Carga de recursos
-   **Resolvers**: Transformación de tipos
-   **Handlers**: Ejecución
-   **Structures**: Abstracciones base

### 3. Dependency Injection

Los componentes reciben sus dependencias:

```typescript
// CommandHandler no crea sus dependencias
constructor(private commandLoader: CommandLoader) {}
```

### 4. Factory Pattern

Los loaders actúan como factories:

```typescript
commandLoader.getCommand('ask'); // Factory de comandos
```

### 5. Strategy Pattern

Los resolvers son estrategias intercambiables:

```typescript
TypeResolver.coerceType(value, String); // Estrategia para String
TypeResolver.coerceType(value, Number); // Estrategia para Number
```

## 🚫 ¿Qué NO va aquí?

-   ❌ Implementaciones de comandos específicos → `/src/commands/`
-   ❌ Definiciones de comandos → `/src/definition/`
-   ❌ Implementaciones de plugins → `/src/plugins/`
-   ❌ Manejo de eventos de Discord → `/src/events/`
-   ❌ Lógica de negocio del bot → `/src/commands/`
-   ❌ Configuraciones → Variables de entorno

## ✅ ¿Qué SÍ va aquí?

-   ✅ Infraestructura reutilizable
-   ✅ Clases base y abstractas (BaseCommand, BasePlugin)
-   ✅ Decoradores del framework
-   ✅ Sistema de carga y registro
-   ✅ Resolución de tipos
-   ✅ Manejo de errores del framework

## 🔧 Extensibilidad

### Agregar un Nuevo Tipo de Discord

Edita `/resolvers/type.resolver.ts`:

```typescript
case 'attachment': {
    // Lógica para resolver attachments
    return await resolveAttachment(value);
}
```

### Agregar Nueva Validación Global

Edita `/resolvers/argument.resolver.ts`:

```typescript
// Agregar validación global antes de validaciones personalizadas
if (globalValidation(value)) {
    throw new ValidationError('Validación global falló');
}
```

### Agregar Nuevo Decorador

Crea archivo en `/decorators/`:

```typescript
export function MyDecorator(options: IMyOptions) {
    return function (target: any, propertyKey?: string) {
        // Tu lógica aquí
    };
}
```

### Crear un Plugin Reutilizable

Los plugins se crean extendiendo `BasePlugin`:

```typescript
// src/plugins/my-plugin.plugin.ts
import { BasePlugin } from '@/core/structures/BasePlugin';
import { BaseCommand } from '@/core/structures/BaseCommand';

export class MyPlugin extends BasePlugin {
    async onBeforeExecute(command: BaseCommand): Promise<void> {
        // Validaciones antes del comando
    }

    async onAfterExecute(command: BaseCommand): Promise<void> {
        // Acciones después del comando
    }
}
```

**Ver:** [README de plugins](/src/plugins/README.md)

## 📚 Testing

El core está diseñado para ser fácil de testear:

```typescript
// Los componentes son inyectables
const mockLoader = new MockCommandLoader();
const handler = new CommandHandler(mockLoader);

// Los resolvers son estáticos
const result = TypeResolver.coerceType('123', Number);
expect(result.value).toBe(123);
```

## 📖 Recursos Relacionados

-   `ARCHITECTURE.md` - Arquitectura completa del sistema
-   `/src/commands/` - Implementaciones de comandos
-   `/src/definition/` - Definiciones de comandos
-   `/src/plugins/` - Plugins extensibles
-   `/src/events/` - Eventos de Discord
