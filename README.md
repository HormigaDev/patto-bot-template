![Banner](./assets/patto-banner.png)

# Patto Bot Template

<div align="center">

![Discord.js](https://img.shields.io/badge/discord.js-v14-blue?style=for-the-badge&logo=discord)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)
![Jest](https://img.shields.io/badge/Jest-29-C21325?style=for-the-badge&logo=jest)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
[![Donar con PayPal](https://img.shields.io/badge/Donar-PayPal-005EA6?style=for-the-badge&logo=paypal&logoColor=white)](https://www.paypal.com/donate/?hosted_button_id=UCL7EE2G44KPQ)

**Template moderno y escalable para bots de Discord con TypeScript**

[Características](#-características) • [Instalación](#-instalación) • [Uso](#-uso) • [Sharding](#-sharding) • [Testing](#testing) • [Documentación](#-documentación) • [Arquitectura](#-arquitectura)

---

</div>

---

## 🌟 Características

### 🎯 Sistema de Comandos Avanzado

- ✅ **Decoradores TypeScript** para definición declarativa de comandos
- ✅ **Slash Commands** (/comando) - Siempre disponibles
- ✅ **Text Commands** (!comando) - Opcionales y configurables
- ✅ **Subcomandos** (`@Subcommand`) - Organiza comandos en 2 niveles: `/config get`
- ✅ **Grupos de Subcomandos** (`@SubcommandGroup`) - Jerarquía de 3 niveles: `/server config get`
- ✅ **Resolución automática** de argumentos con validación
- ✅ **Raw Text Capture** - Captura texto completo sin comillas (ej: `!say Hola mundo`)
- ✅ **Options/Choices** - Argumentos con valores predefinidos y dropdown en slash commands
- ✅ **Aliases** para comandos de texto
- ✅ **Tipos Discord** (User, Role, Channel, Member) resueltos automáticamente
- ✅ **Custom Type Parsers** para tipos personalizados (ej: MinecraftPlayer, CustomDate)
- ✅ **Sistema de Plugins** extensible con decoradores y scopes
- ✅ **Plugin Scopes** - Aplica plugins por carpeta, comando, o globalmente
- ✅ **Sistema de Permisos** - Decorador `@RequirePermissions` con validación automática

### 🎨 Componentes Interactivos

- ✅ **Button / Select / Modal wrappers** - Constructores tipados, sin archivos separados por componente
- ✅ **Handlers como métodos estáticos** - Vivien en la clase del comando con prefijo `button*` / `select*` / `modal*`. Cero closures por instancia
- ✅ **Payload por instancia** - Sólo se serializa el dato; las funciones nunca se duplican en memoria
- ✅ **PayloadStore swappable** - Implementación in-memory por defecto, intercambiable por Redis/Mongo respetando el contrato
- ✅ **CustomId con routing** - Formato `<commandKey>:<methodName>:<id>` resuelve al handler en O(1) vía `CommandLoader`
- ✅ **RichMessage** - Agrupa componentes con timeout único y reset automático en cada interacción
- ✅ **TTL por payload** - Eviction automática; `payload === undefined` marca expiración
- ✅ **Type-Safe** - Genéricos `<P>` para botones, selects y modales

### 🏗️ Arquitectura Limpia

- ✅ **Principios SOLID** aplicados
- ✅ **Separación de responsabilidades** (Loaders, Handlers, Resolvers, Plugins)
- ✅ **Código modular** y fácil de testear
- ✅ **Decoradores reutilizables** (@Command, @Arg, @UsePlugins)
- ✅ **Context unificado** para Messages e Interactions
- ✅ **Plugins reutilizables** (Cooldowns, Permisos, Logging, etc.)

### 🌐 Sharding (para +2.500 servidores)

- ✅ **ShardingManager integrado** — entry point dedicado (`src/sharding.ts`) con respawn automático
- ✅ **Scripts listos** — `npm run dev:sharding` y `npm run start:sharding`
- ✅ **Stores distribuidos con Redis** — `RedisCooldownStore` y `RedisPayloadStore` vía `ioredis`
- ✅ **StoreRegistry** — inyección de stores antes de cargar plugins, sin acoplamiento
- ✅ **CooldownStore swappable** — en memoria por defecto; intercambiable por Redis sin modificar plugins
- ✅ **Tag `[SHARD X]`** en todos los logs del proceso worker automáticamente
- ✅ **Bootstrap asíncrono** — Redis se configura antes de evaluar `plugins.config.ts`

### 🛠️ Developer Experience

- ✅ **TypeScript** con strict mode
- ✅ **Path aliases** (@/core, @/commands, etc.)
- ✅ **Hot reload** en desarrollo (ts-node)
- ✅ **Testing completo** (Unit, Integration, E2E con Jest)
- ✅ **Mocks incluidos** para Discord.js
- ✅ **Documentación completa** por carpeta
- ✅ **Ejemplos listos para usar**
- ✅ **Logger profesional** (`Logger`) con niveles, colores ANSI y scopes por módulo

### ⚙️ Configuración Flexible

- ✅ **Variables de entorno** para configuración
- ✅ **Intents automáticos** según características usadas
- ✅ **Presencias personalizables** con templates
- ✅ **Manejo robusto de errores**
- ✅ **Nivel de logging configurable** vía `LOG_LEVEL` (DEBUG / INFO / WARN / ERROR / FATAL / SILENT)

---

## 📋 Requisitos Previos

- **Node.js** v18 o superior
- **npm** o **yarn**
- **Bot de Discord** creado en [Discord Developer Portal](https://discord.com/developers/applications)

---

## 🚀 Instalación

Tienes dos opciones para instalar Patto Bot Template:

### 🎯 Opción 1: Con `@patto/cli` (Recomendado)

La forma más rápida y sencilla usando la herramienta oficial:

```bash
# Instalar @patto/cli globalmente
npm install -g @patto/cli
# o con pnpm (recomendado)
pnpm add -g @patto/cli

# Crear un nuevo proyecto
patto init mi-bot-discord

# Entrar al proyecto
cd mi-bot-discord
```

**✨ Ventajas:**

- ✅ Setup automático en 2-3 minutos
- ✅ Generación de código integrada (comandos, subcomandos, plugins)
- ✅ Análisis estático del proyecto (`patto lint`, `patto doctor`, `patto check`)
- ✅ Validaciones y mejores prácticas incluidas

**📚 Guía completa:** Ver [`docs/Patto_CLI_Installation.README.md`](docs/Patto_CLI_Installation.README.md)

---

### 📦 Opción 2: Instalación Manual

Si prefieres clonar el repositorio manualmente:

#### 1. Clonar el Repositorio

```bash
git clone https://github.com/HormigaDev/patto-bot-template.git
cd patto-bot-template
```

#### 2. Instalar Dependencias

```bash
npm install
```

---

### 3. Configurar Variables de Entorno (Ambas opciones)

Copia el template de configuración:

```bash
cp .env.template .env
```

Edita `.env` con tus credenciales:

```env
# Variables OBLIGATORIAS
BOT_TOKEN=tu_token_aqui        # Token del bot
CLIENT_ID=tu_client_id_aqui    # ID de la aplicación

# Variables OPCIONALES
USE_MESSAGE_CONTENT=true       # true = habilitar comandos de texto | false/vacío = solo slash commands
COMMAND_PREFIX=!               # Prefijo para comandos de texto (default: !)
INTENTS=                       # Intents personalizados (dejar vacío para automático)
LOG_LEVEL=INFO                 # Nivel de logging: DEBUG, INFO, WARN, ERROR, FATAL, SILENT

# Sharding (solo si el bot supera ~2.500 servidores)
SHARDING_ENABLED=false         # true = activar ShardingManager (requiere REDIS_URL)
REDIS_URL=                     # URL de Redis (redis:// o rediss://); obligatoria con SHARDING_ENABLED=true
TOTAL_SHARDS=auto              # Número de shards o 'auto' para que Discord lo calcule
```

**Validación automática:** El bot valida todas las variables al iniciar y muestra errores claros si falta algo obligatorio.

### 4. Configurar Discord Developer Portal

#### Habilitar Intents Privilegiados

Si configuraste `USE_MESSAGE_CONTENT=true`:

1. Ve a [Discord Developer Portal](https://discord.com/developers/applications)
2. Selecciona tu aplicación
3. Ve a **Bot** → **Privileged Gateway Intents**
4. Activa: ✅ **MESSAGE CONTENT INTENT**
5. Guarda los cambios

#### Invitar el Bot

Genera una URL de invitación:

1. Ve a **OAuth2** → **URL Generator**
2. Selecciona scopes:
    - ✅ `bot`
    - ✅ `applications.commands`
3. Selecciona permisos del bot según tus necesidades
4. Copia la URL generada y úsala para invitar el bot

---

## 🎮 Uso

### Desarrollo

Inicia el bot en modo desarrollo con hot reload:

```bash
npm run dev
```

### Producción

Compila y ejecuta:

```bash
npm run build
npm start
```

### Sharding (producción con +2.500 servidores)

Asegúrate de configurar `SHARDING_ENABLED=true` y `REDIS_URL` en tu `.env`, luego:

```bash
# Desarrollo
npm run dev:sharding

# Producción (requiere build previo)
npm run build
npm run start:sharding
```

> **¿Cuándo usar sharding?** Discord obliga a activar sharding cuando el bot supera los 2.500 servidores. Para bots más pequeños, usa el entry point normal (`npm run dev` / `npm start`).

### Testing

El proyecto incluye una infraestructura completa de testing con Jest y TypeScript:

```bash
# Todos los tests
npm test

# Tests con cobertura detallada
npm run test:coverage

# Tests en modo watch (desarrollo)
npm run test:watch

# Tests por categoría
npm run test:unit          # Solo tests unitarios
npm run test:integration   # Solo tests de integración
npm run test:e2e          # Solo tests end-to-end
```

### Linting y Formateo

Mantén el código limpio y consistente:

```bash
# Ejecutar linter (ESLint)
npm run lint

# Auto-fix de problemas de linting
npm run lint -- --fix

# Formatear código con Prettier
npm run format
```

**💡 Tip**: Ejecuta `npm run lint` y `npm run format` antes de hacer commits para asegurar calidad de código.

#### 🧪 Infraestructura de Testing

- **Jest 29** con soporte completo para TypeScript
- **Mocks de Discord.js** pre-configurados (User, Guild, Message, Interaction, etc.)
- **Path aliases** (`@/`, `@tests/*`) funcionando en tests
- **Coverage reports** con umbrales configurables
- **CI/CD** con GitHub Actions (tests automáticos en cada push/PR)
- **Debug en VSCode** configurado para tests

#### 📂 Estructura de Tests

```
tests/
├── unit/           # Tests unitarios (utils, errors, etc.)
├── integration/    # Tests de integración (commands, handlers)
├── e2e/           # Tests end-to-end (flujos completos)
├── mocks/         # Mocks reutilizables de Discord.js
├── fixtures/      # Datos de prueba
└── helpers/       # Utilidades para tests
```

**Documentación completa:** Ver [`/tests/README.md`](tests/README.md) para ejemplos, guías de escritura de tests y mejores prácticas.

---

## 📖 Crear tu Primer Comando

### 1. Crear la Definición

Crea `src/definition/ping.definition.ts`:

```typescript
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { Category } from '@/utils/CommandCategories';

@Command({
    name: 'ping',
    description: 'Verifica la latencia del bot',
    category: Category.Info, // Opcional (default: Other)
    aliases: ['latencia', 'pong'],
})
export abstract class PingDefinition extends BaseCommand {
    // Sin argumentos para este comando
}
```

### 2. Crear la Implementación

Crea `src/commands/ping.command.ts`:

```typescript
import { EmbedBuilder } from 'discord.js';
import { PingDefinition } from '@/definition/ping.definition';

export class PingCommand extends PingDefinition {
    public async run(): Promise<void> {
        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setDescription(`Latencia: ${this.ctx.client.ws.ping}ms`)
            .setColor('#5180d6')
            .setFooter({
                text: this.user.username,
                iconURL: this.user.displayAvatarURL(),
            });

        await this.reply({ embeds: [embed] });
    }
}
```

### 3. ¡Listo!

El comando se carga automáticamente. Reinicia el bot y prueba:

- Slash: `/ping`
- Texto: `!ping`, `!latencia`, `!pong`

---

## 🎯 Subcomandos y Grupos de Subcomandos

Este template soporta **subcomandos** y **grupos de subcomandos** para organizar comandos complejos.

> **💡 Nota importante:** NO necesitas crear un archivo base (como `config.command.ts` o `server.command.ts`). El sistema crea automáticamente "comandos fantasma" en Discord cuando detecta subcomandos sin comando base. Esto **reduce overhead, mejora la DX y evita código verboso innecesario**.

### Subcomandos (2 niveles)

Para comandos relacionados simples: `/config get`, `/config set`

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
        await this.reply('Configuración actual...');
    }
}
```

### Grupos de Subcomandos (3 niveles)

Para sistemas complejos: `/server config get`, `/server user info`

```typescript
// src/commands/server/config/get.command.ts
import { SubcommandGroup } from '@/core/decorators/subcommand-group.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@SubcommandGroup({
    parent: 'server',
    name: 'config',
    subcommand: 'get',
    description: 'Ver la configuración del servidor',
})
export class ServerConfigGetCommand extends BaseCommand {
    async run(): Promise<void> {
        await this.reply('Configuración del servidor...');
    }
}
```

### 📁 Organización Recomendada

```
src/commands/
├── info/                      # Comandos base simples
│   ├── help.command.ts       # /help
│   └── ping.command.ts       # /ping
├── config/                    # Subcomandos (2 niveles)
│   ├── get.command.ts        # /config get
│   ├── set.command.ts        # /config set
│   └── reset.command.ts      # /config reset
└── server/                    # Grupos de subcomandos (3 niveles)
    ├── config/               # Grupo: config
    │   ├── get.command.ts    # /server config get
    │   └── set.command.ts    # /server config set
    └── user/                 # Grupo: user
        ├── info.command.ts   # /server user info
        └── list.command.ts   # /server user list
```

### 🤖 Sistema de Comandos Fantasma

Cuando defines subcomandos o grupos **sin un comando base**, el sistema automáticamente:

1. ✅ Detecta que el comando padre no existe
2. ✅ Crea un "comando fantasma" en Discord como contenedor
3. ✅ Registra todos los subcomandos/grupos correctamente
4. ✅ Muestra en logs: `👻 Comando fantasma creado: "config" (solo contenedor de subcomandos)`

**Beneficios:**

- 🚀 Sin overhead de archivos vacíos
- 🎯 DX mejorada - solo código funcional
- 📦 Menos verboso y más limpio
- ⚡ Automático - sin configuración adicional

### 📚 Guías Detalladas

- 📄 [**Guía de Subcomandos**](docs/Subcommands.README.md) - Comandos de 2 niveles
- 📄 [**Guía de Grupos de Subcomandos**](docs/SubcommandGroups.README.md) - Comandos de 3 niveles

---

## 🔒 Ejemplo: Comando con Permisos

El template incluye un **sistema de permisos** integrado. Usa el decorador `@RequirePermissions`:

```typescript
import { Command } from '@/core/decorators/command.decorator';
import { RequirePermissions } from '@/core/decorators/permission.decorator';
import { Permissions } from '@/utils/Permissions';
import { Arg } from '@/core/decorators/argument.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { User } from 'discord.js';

@Command({
    name: 'ban',
    description: 'Banea un usuario del servidor',
})
@RequirePermissions(Permissions.BanMembers)
export class BanCommand extends BaseCommand {
    @Arg({
        name: 'usuario',
        description: 'Usuario a banear',
        index: 0,
        required: true,
    })
    public usuario!: User;

    @Arg({
        name: 'razon',
        description: 'Razón del baneo',
        index: 1,
        required: false,
    })
    public razon?: string;

    public async run(): Promise<void> {
        // Usuario ya validado con permisos
        await this.usuario.ban({ reason: this.razon || 'No especificada' });

        const embed = this.getEmbed('success')
            .setTitle('✅ Usuario Baneado')
            .setDescription(`${this.usuario.tag} ha sido baneado`)
            .addFields({ name: 'Razón', value: this.razon || 'No especificada' });

        await this.reply({ embeds: [embed] });
    }
}
```

**Características:**

- ✅ El comando **solo aparece** para usuarios con el permiso `BanMembers`
- ✅ Validación **doble**: en Discord (registro) y en ejecución (runtime)
- ✅ **Sin boilerplate**: No necesitas validar manualmente
- ✅ Funciona con el **PermissionsPlugin** incluido (inmutable, no modifica JSON original)
- ✅ **20 tests** completos (unit + integration) garantizan su correcto funcionamiento

**Más información**: Ver [`/src/plugins/permissions.plugin.README.md`](src/plugins/permissions.plugin.README.md)

---

## �📚 Documentación

### Por Carpeta

Cada carpeta importante tiene su propio README con documentación detallada:

- 📁 [`/src/commands/`](src/commands/README.md) - Implementaciones de comandos
- 📁 [`/src/definition/`](src/definition/README.md) - Definiciones de comandos (opcional)
- 📁 [`/src/plugins/`](src/plugins/README.md) - Plugins extensibles (Cooldowns, Permisos, etc.)
- 📁 [`/src/utils/`](src/utils/README.md) - Utilidades y helpers reutilizables
- 📁 [`/src/error/`](src/error/README.md) - Manejo de errores (ValidationError, ReplyError)
- 📁 [`/tests/`](tests/README.md) - **Infraestructura de testing completa**
- 📁 [`/src/core/`](src/core/README.md) - Núcleo del framework
    - 📁 [`/decorators/`](src/core/decorators/README.md) - Decoradores @Command y @Arg
    - 📁 [`/handlers/`](src/core/handlers/README.md) - CommandHandler
    - 📁 [`/loaders/`](src/core/loaders/README.md) - Cargadores de comandos
    - 📁 [`/resolvers/`](src/core/resolvers/README.md) - Resolvedores de tipos
    - 📁 [`/structures/`](src/core/structures/README.md) - BaseCommand, CommandContext, BasePlugin
    - 📁 [`/components/`](src/core/components/README.md) - Button, Select, Modal, RichMessage
- 📁 [`/src/error/`](src/error/README.md) - Errores personalizados
- 📁 [`/src/events/`](src/events/README.md) - Eventos de Discord
- 📁 [`/tests/`](tests/README.md) - Sistema de testing completo (Unit, Integration, E2E)

### Guías

- 📄 [`ARCHITECTURE.md`](ARCHITECTURE.md) - Arquitectura completa del sistema
- 📄 [`docs/MESSAGE_CONTENT_CONFIG.md`](docs/MESSAGE_CONTENT_CONFIG.md) - Configuración de comandos de texto

---

## 🏗️ Arquitectura

### Estructura del Proyecto

```
patto-bot-template/
├── src/
│   ├── bot.ts                    # Clase principal del bot
│   ├── index.ts                  # Punto de entrada (modo normal)
│   ├── sharding.ts               # Punto de entrada (modo sharding)
│   ├── commands/                 # Implementaciones de comandos
│   │   └── *.command.ts
│   ├── core/                     # Núcleo del framework
│   │   ├── decorators/           # @Command, @Arg
│   │   ├── handlers/             # CommandHandler
│   │   ├── loaders/              # CommandLoader, SlashCommandLoader
│   │   ├── resolvers/            # TypeResolver, ArgumentResolver
│   │   ├── store/                # Stores distribuidos (cooldown, payload)
│   │   │   ├── cooldown.store.ts         # CooldownStore + MemoryCooldownStore
│   │   │   ├── redis.cooldown.store.ts   # RedisCooldownStore
│   │   │   ├── redis.payload.store.ts    # RedisPayloadStore
│   │   │   └── store.registry.ts         # StoreRegistry
│   │   └── structures/           # BaseCommand, CommandContext, BasePlugin
│   ├── definition/               # Definiciones de comandos (opcional)
│   │   └── *.definition.ts
│   ├── plugins/                  # Plugins extensibles
│   │   └── *.plugin.ts
│   ├── error/                    # Errores personalizados
│   │   ├── ValidationError.ts
│   │   └── ReplyError.ts
│   ├── utils/
│   │   ├── Logger.ts             # Sistema de logging con niveles y scopes
│   │   ├── Env.ts                # Carga y validación de variables de entorno
│   │   └── ...
│   └── events/                   # Eventos de Discord
│       ├── ready.event.ts
│       ├── interactionCreate.event.ts
│       └── messageCreate.event.ts
├── .env.template                 # Template de configuración
├── package.json
├── tsconfig.json
└── README.md
```

### Flujo de Ejecución

```
Usuario ejecuta comando
         ↓
┌────────────────────┐
│  Event Handler     │ (interactionCreate o messageCreate)
│  • Detecta comando │
│  • Busca en loader │
└────────────────────┘
         ↓
┌────────────────────┐
│  Plugins Before    │
│  • onBeforeExecute │
│  • Validaciones    │
└────────────────────┘
         ↓
┌────────────────────┐
│  CommandHandler    │
│  • Instancia       │
│  • Inyecta ctx     │
└────────────────────┘
         ↓
┌────────────────────┐
│  ArgumentResolver  │
│  • Obtiene args    │
│  • Valida          │
│  • Resuelve tipos  │
└────────────────────┘
         ↓
┌────────────────────┐
│  Command.run()     │
│  • Lógica del      │
│    comando         │
└────────────────────┘
         ↓
┌────────────────────┐
│  Plugins After     │
│  • onAfterExecute  │
│  • Logging, etc.   │
└────────────────────┘
```

---

## 🎨 Ejemplos de Comandos

### Comando con Argumentos

```typescript
// definition/greet.definition.ts
@Command({
    name: 'greet',
    description: 'Saluda a alguien',
})
export abstract class GreetDefinition extends BaseCommand {
    @Arg({
        name: 'nombre',
        description: 'Nombre de la persona',
        index: 0,
        required: true,
    })
    public nombre!: string;
}

// commands/greet.command.ts
export class GreetCommand extends GreetDefinition {
    public async run(): Promise<void> {
        await this.reply(`¡Hola ${this.nombre}! 👋`);
    }
}
```

### Comando con Usuario de Discord

```typescript
// definition/hug.definition.ts
@Command({
    name: 'hug',
    description: 'Abraza a un usuario',
})
export abstract class HugDefinition extends BaseCommand {
    @Arg({
        name: 'usuario',
        description: 'Usuario a abrazar',
        index: 0,
        required: true,
    })
    public usuario!: User;
}

// commands/hug.command.ts
export class HugCommand extends HugDefinition {
    public async run(): Promise<void> {
        const embed = new EmbedBuilder()
            .setDescription(`${this.user} abraza a ${this.usuario}! 🤗`)
            .setColor('#5180d6');

        await this.reply({ embeds: [embed] });
    }
}
```

### Comando con Validación

```typescript
// definition/transfer.definition.ts
@Command({
    name: 'transfer',
    description: 'Transfiere monedas',
})
export abstract class TransferDefinition extends BaseCommand {
    @Arg({
        name: 'cantidad',
        description: 'Cantidad a transferir',
        index: 0,
        required: true,
        validate: (value: number) => {
            if (value <= 0) return 'Debe ser mayor a 0';
            if (value > 1000000) return 'Máximo 1,000,000';
            return true;
        },
    })
    public cantidad!: number;

    @Arg({
        name: 'destinatario',
        description: 'Usuario destinatario',
        index: 1,
        required: true,
    })
    public destinatario!: User;
}
```

### Comando con Componentes Interactivos

Los handlers son **métodos estáticos** del comando, con prefijo `button*` / `select*` / `modal*`. Cada instancia sólo guarda un `payload` (datos serializables); las funciones nunca se duplican en memoria por instancia. El `customId` codifica `<commandKey>:<methodName>:<id>` y el dispatcher resuelve el handler en O(1) vía `CommandLoader`.

```typescript
// commands/info/panel.command.ts
import { RichMessage, Button, ButtonVariant, Select } from '@/core/components';
import { Times } from '@/utils/Times';
import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';

interface CategoryPayload {
    label: string;
}

export class PanelCommand extends PanelDefinition {
    // Handlers estáticos: viven en la clase, no se registran en runtime
    public static async buttonInfo(interaction: ButtonInteraction): Promise<void> {
        await interaction.reply({ content: '📊 Información del servidor…', ephemeral: true });
    }

    public static async buttonConfig(interaction: ButtonInteraction): Promise<void> {
        await interaction.reply({ content: '⚙️ Panel de configuración…', ephemeral: true });
    }

    public static async buttonHelp(interaction: ButtonInteraction): Promise<void> {
        await interaction.reply({ content: '❓ Visita nuestra guía…', ephemeral: true });
    }

    public static async selectCategory(
        interaction: StringSelectMenuInteraction,
        values: string[],
        payload: CategoryPayload | undefined,
    ): Promise<void> {
        if (payload === undefined) {
            await interaction.reply({ content: 'Esta interacción expiró.', ephemeral: true });
            return;
        }
        await interaction.reply({
            content: `Categoría seleccionada en ${payload.label}: **${values[0]}**`,
            ephemeral: true,
        });
    }

    public async run(): Promise<void> {
        const COMMAND_KEY = 'panel';

        const infoBtn = new Button({
            label: 'Ver Info',
            variant: ButtonVariant.Primary,
            emoji: 'ℹ️',
            command: COMMAND_KEY,
            method: 'buttonInfo',
        });

        const configBtn = new Button({
            label: 'Configurar',
            variant: ButtonVariant.Secondary,
            emoji: '⚙️',
            command: COMMAND_KEY,
            method: 'buttonConfig',
        });

        const helpBtn = new Button({
            label: 'Ayuda',
            variant: ButtonVariant.Success,
            emoji: '❓',
            command: COMMAND_KEY,
            method: 'buttonHelp',
        });

        const categorySelect = new Select<CategoryPayload>({
            placeholder: 'Selecciona una categoría',
            command: COMMAND_KEY,
            method: 'selectCategory',
            payload: { label: 'panel-principal' },
            options: [
                { label: 'Moderación', value: 'mod', emoji: '🛡️' },
                { label: 'Utilidades', value: 'util', emoji: '🔧' },
                { label: 'Diversión', value: 'fun', emoji: '🎮' },
            ],
        });

        const panel = new RichMessage({
            embeds: [
                this.getEmbed('info')
                    .setTitle('🎛️ Panel de Control')
                    .setDescription('Usa los botones y el menú para interactuar'),
            ],
            components: [infoBtn, configBtn, helpBtn, categorySelect],
            timeout: Times.minutes(5),
        });

        await panel.send(this.ctx);
    }
}
```

**Ventajas:**

- ✅ Handlers como código fijo en la clase: cero closures vivas por instancia
- ✅ Sólo se serializa el payload, no la lógica → swappable a Redis/Mongo
- ✅ `RichMessage` gestiona timeout global, reset automático y limpieza de payloads
- ✅ Método `edit()` para actualizar mensajes dinámicamente
- ✅ Type-safe con genéricos `<P>` y tipos de Discord.js

Ver más en [`src/core/components/README.md`](src/core/components/README.md)

---

## 🔧 Configuración Avanzada

### Cambiar el Prefijo

Edita `src/events/messageCreate.event.ts`:

```typescript
const PREFIX = '?'; // Cambia '!' por tu prefijo
```

### Cambiar la Presencia

Edita `src/events/ready.event.ts` y descomenta/modifica los ejemplos.

### Intents Personalizados

Si necesitas intents adicionales, edita `src/bot.ts`:

```typescript
intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates, // Ejemplo: estados de voz
    // ... más intents
];
```

---

## 🐛 Solución de Problemas

### Error: "Missing Access"

**Causa:** Falta el scope `applications.commands`
**Solución:** Re-invita el bot con el scope correcto

### Error: "Unknown interaction"

**Causa:** Los comandos no están registrados  
**Solución:** Espera a que aparezca "✅ Comandos Slash registrados" en consola

### Los comandos de texto no funcionan

**Causa:** `USE_MESSAGE_CONTENT` no está configurado o el intent no está habilitado  
**Solución:** Ver [`docs/MESSAGE_CONTENT_CONFIG.md`](docs/MESSAGE_CONTENT_CONFIG.md)

### Error: "Cannot find module '@/...'"

**Causa:** Path aliases no configurados  
**Solución:** Asegúrate de ejecutar con `ts-node -r tsconfig-paths/register`

### Error: "No se pudo conectar a Redis"

**Causa:** `REDIS_URL` incorrecta o Redis no disponible cuando `SHARDING_ENABLED=true`  
**Solución:** Verifica que `REDIS_URL` comience con `redis://` o `rediss://` y que el servidor Redis esté corriendo

### El bot no usa sharding aunque `SHARDING_ENABLED=true`

**Causa:** Estás ejecutando `npm run dev` (entry point normal) en vez de `npm run dev:sharding`  
**Solución:** Usa `npm run dev:sharding` para activar el `ShardingManager`

---

## 🛠️ Ecosistema Patto

### `@patto/cli` ✅ (Disponible)

**`@patto/cli`** es la herramienta oficial de línea de comandos para proyectos Patto Bot Template. Combina generación de código con análisis estático nativo (Rust) para un workflow profesional.

**Características:**

- 🚀 Inicialización rápida de proyectos (`patto init`)
- 🎨 Generación de comandos, subcomandos, grupos y plugins (`patto generate`)
- 🔍 Análisis estático del proyecto (`patto lint`)
- 🩺 Diagnóstico de salud del entorno (`patto doctor`)
- ✅ Pipeline completo listo para CI (`patto check`)
- ⚡ Núcleo nativo en Rust para análisis de alta velocidad

**Instalación:**

```bash
npm install -g @patto/cli
patto init mi-bot-discord
```

**Workflow recomendado:**

```bash
# Antes de hacer commit o en CI
patto check --root .
```

**Enlaces:**

- 📦 [@patto/cli en npm](https://www.npmjs.com/package/@patto/cli)
- 🏠 [Repositorio en GitHub](https://github.com/HormigaDev/patto-monorepo)
- 📖 [Documentación completa](docs/Patto_CLI_Installation.README.md)

---

### Patto Bot Features (Próximamente)

**Patto Bot Features** será un conjunto de paquetes modulares y editables para expandir tu bot de Discord. Podrás agregar funcionalidades como persistencia con MongoDB, sistemas de economía o herramientas de moderación con un simple comando. Cada feature será flexible, integrable con el template y personalizable según tu estilo. ¡En desarrollo para potenciar tu bot!

---

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request usando el [template](.github/PULL_REQUEST_TEMPLATE.md)

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [`LICENSE`](./.licences/LICENSE_SPANISH) para más detalles.

---

## 👨‍💻 Autor

**HormigaDev**

- GitHub: [@HormigaDev](https://github.com/HormigaDev)
- Servidor de Discord: [Próximamente]()

---

## 🙏 Agradecimientos

### 📚 Librerías Principales

- [Discord.js](https://discord.js.org/) - Librería de Discord para Node.js
- [TypeScript](https://www.typescriptlang.org/) - Superset de JavaScript con tipos estáticos

### 🧪 Testing y Calidad

- [Jest](https://jestjs.io/) - Framework de testing delightful
- [ESLint](https://eslint.org/) - Linter para identificar y reportar patrones en código
- [Prettier](https://prettier.io/) - Formateador de código automático
- [typescript-eslint](https://typescript-eslint.io/) - Parser y plugin de ESLint para TypeScript

### 🛠️ Desarrollo

- [ts-node-dev](https://github.com/wclr/ts-node-dev) - Compilador TypeScript con hot reload para desarrollo
- [tsconfig-paths](https://github.com/dividab/tsconfig-paths) - Soporte para path aliases en runtime
- [tsc-alias](https://github.com/justkey007/tsc-alias) - Resuelve path aliases de TypeScript después de compilar
- [reflect-metadata](https://github.com/rbuckton/reflect-metadata) - Metadata Reflection API para decoradores

### ⚙️ Utilidades

- [dotenv](https://github.com/motdotla/dotenv) - Carga variables de entorno desde .env
- [nanoid](https://github.com/ai/nanoid) - Generador de IDs únicos pequeños y seguros
- [ioredis](https://github.com/redis/ioredis) - Cliente Redis robusto para stores distribuidos en modo sharding

### 🚀 CI/CD

- [GitHub Actions](https://github.com/features/actions) - CI/CD para tests automáticos

---

## 💝 Apoyar el Proyecto

Si este template te ha sido útil y quieres apoyar su desarrollo continuo, considera hacer una donación. Cada contribución, sin importar el monto, ayuda a mantener el proyecto activo y motivar la creación de nuevas características.

<div align="center">

[![Donar con PayPal](https://img.shields.io/badge/Donar-PayPal-005EA6?style=flat-square&logo=paypal&logoColor=white)](https://www.paypal.com/donate/?hosted_button_id=UCL7EE2G44KPQ)

**⭐ También puedes apoyar con una estrella en GitHub ⭐**

---

[Reportar Bug](https://github.com/HormigaDev/patto-bot-template/issues) • [Solicitar Feature](https://github.com/HormigaDev/patto-bot-template/issues)

</div>
