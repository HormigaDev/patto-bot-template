![Banner](./assets/patto-banner.png)

# Patto Bot Template

<div align="center">

![Discord.js](https://img.shields.io/badge/discord.js-v14-blue?style=for-the-badge&logo=discord)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)
![Jest](https://img.shields.io/badge/Jest-29-C21325?style=for-the-badge&logo=jest)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Template moderno y escalable para bots de Discord con TypeScript**

[Características](#-características) • [Instalación](#-instalación) • [Uso](#-uso) • [Testing](#testing) • [Documentación](#-documentación) • [Arquitectura](#-arquitectura)

---

</div>

---

## 🌟 Características

### 🎯 Sistema de Comandos Avanzado

- ✅ **Decoradores TypeScript** para definición declarativa de comandos
- ✅ **Slash Commands** (/comando) - Siempre disponibles
- ✅ **Text Commands** (!comando) - Opcionales y configurables
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

- ✅ **Button Wrapper** - Crea botones con callbacks inline (Primary, Success, Danger, Secondary)
- ✅ **Select Wrapper** - Crea select menus con onChange inline
- ✅ **Modal Wrapper** - Crea formularios (modales) con onSubmit inline
- ✅ **RichMessage** - Gestión centralizada de componentes con timeout global único
- ✅ **Registry Global** - Almacena componentes automáticamente (sin archivos separados)
- ✅ **Timeout Automático** - Componentes se limpian automáticamente (20 segundos por defecto)
- ✅ **Type-Safe** - Callbacks con tipos completos de Discord.js
- ✅ **Sin boilerplate** - No necesitas crear archivos `.button.ts` o `.select.ts`
- ✅ **Mejor performance** - RichMessage usa 1 timeout para N componentes

### 🏗️ Arquitectura Limpia

- ✅ **Principios SOLID** aplicados
- ✅ **Separación de responsabilidades** (Loaders, Handlers, Resolvers, Plugins)
- ✅ **Código modular** y fácil de testear
- ✅ **Decoradores reutilizables** (@Command, @Arg, @UsePlugins)
- ✅ **Context unificado** para Messages e Interactions
- ✅ **Plugins reutilizables** (Cooldowns, Permisos, Logging, etc.)

### 🛠️ Developer Experience

- ✅ **TypeScript** con strict mode
- ✅ **Path aliases** (@/core, @/commands, etc.)
- ✅ **Hot reload** en desarrollo (ts-node)
- ✅ **Testing completo** (Unit, Integration, E2E con Jest)
- ✅ **Mocks incluidos** para Discord.js
- ✅ **Documentación completa** por carpeta
- ✅ **Ejemplos listos para usar**

### ⚙️ Configuración Flexible

- ✅ **Variables de entorno** para configuración
- ✅ **Intents automáticos** según características usadas
- ✅ **Presencias personalizables** con templates
- ✅ **Manejo robusto de errores**

---

## 📋 Requisitos Previos

- **Node.js** v18 o superior
- **npm** o **yarn**
- **Bot de Discord** creado en [Discord Developer Portal](https://discord.com/developers/applications)

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/HormigaDev/patto-bot-template.git
cd patto-bot-template
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

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
import { CommandCategoryTag } from '@/utils/CommandCategories';

@Command({
    name: 'ping',
    description: 'Verifica la latencia del bot',
    category: CommandCategoryTag.Info, // Opcional (default: Other)
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

## � Ejemplo: Comando con Permisos

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
│   ├── index.ts                  # Punto de entrada
│   ├── commands/                 # Implementaciones de comandos
│   │   └── *.command.ts
│   ├── core/                     # Núcleo del framework
│   │   ├── decorators/           # @Command, @Arg
│   │   ├── handlers/             # CommandHandler
│   │   ├── loaders/              # CommandLoader, SlashCommandLoader
│   │   ├── resolvers/            # TypeResolver, ArgumentResolver
│   │   └── structures/           # BaseCommand, CommandContext, BasePlugin
│   ├── definition/               # Definiciones de comandos (opcional)
│   │   └── *.definition.ts
│   ├── plugins/                  # Plugins extensibles
│   │   └── *.plugin.ts
│   ├── error/                    # Errores personalizados
│   │   ├── ValidationError.ts
│   │   └── ReplyError.ts
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

```typescript
// commands/panel.command.ts
import { RichMessage, Button, Select } from '@/core/components';
import { Times } from '@/utils/Times';

export class PanelCommand extends PanelDefinition {
    public async run(): Promise<void> {
        // Crear botones con callbacks inline
        const infoBtn = Button.primary('Ver Info', 'ℹ️').onClick(async (interaction) => {
            await interaction.reply({
                content: '📊 Información del servidor...',
                ephemeral: true,
            });
        });

        const configBtn = Button.secondary('Configurar', '⚙️').onClick(async (interaction) => {
            await interaction.reply({
                content: '⚙️ Panel de configuración...',
                ephemeral: true,
            });
        });

        const helpBtn = Button.success('Ayuda', '❓').onClick(async (interaction) => {
            await interaction.reply({
                content: '❓ ¿Necesitas ayuda? Visita nuestra guía...',
                ephemeral: true,
            });
        });

        // Crear select menu
        const categorySelect = new Select({
            placeholder: 'Selecciona una categoría',
            options: [
                { label: 'Moderación', value: 'mod', emoji: '🛡️' },
                { label: 'Utilidades', value: 'util', emoji: '🔧' },
                { label: 'Diversión', value: 'fun', emoji: '🎮' },
            ],
        }).onChange(async (interaction, values) => {
            await interaction.reply({
                content: `Categoría seleccionada: **${values[0]}**`,
                ephemeral: true,
            });
        });

        // Crear RichMessage con timeout global de 5 minutos
        const panel = new RichMessage({
            embeds: [
                this.getEmbed('info')
                    .setTitle('🎛️ Panel de Control')
                    .setDescription('Usa los botones y el menú para interactuar'),
            ],
            components: [infoBtn, configBtn, helpBtn, categorySelect],
            timeout: Times.minutes(5), // Timeout único para todos los componentes
        });

        await panel.send(this.ctx);
    }
}
```

**Ventajas:**

- ✅ Callbacks inline (sin archivos separados)
- ✅ RichMessage gestiona un timeout global único
- ✅ Limpieza automática del registry
- ✅ Método `edit()` para actualizar mensajes dinámicamente
- ✅ Type-safe con Discord.js

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

---

## 🛠️ Ecosistema Patto (Próximamente)

### Patto Bot Features

**Patto Bot Features** será un conjunto de paquetes modulares y editables para expandir tu bot de Discord. Podrás agregar funcionalidades como persistencia con MongoDB, sistemas de economía o herramientas de moderación con un simple comando. Cada feature será flexible, integrable con el template y personalizable según tu estilo. ¡En desarrollo para potenciar tu bot!

### Patto CLI

**Patto CLI** será una herramienta de línea de comandos para agilizar el desarrollo de bots. Genera comandos, plugins y tests con comandos como `patto generate`, y gestiona la instalación de features con sus dependencias, actualizando automáticamente el `.env.template`. Diseñada para optimizar tu flujo de trabajo. ¡En camino para simplificar tu experiencia!

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
- [reflect-metadata](https://github.com/rbuckton/reflect-metadata) - Metadata Reflection API para decoradores

### ⚙️ Utilidades

- [dotenv](https://github.com/motdotla/dotenv) - Carga variables de entorno desde .env
- [nanoid](https://github.com/ai/nanoid) - Generador de IDs únicos pequeños y seguros

### 🚀 CI/CD

- [GitHub Actions](https://github.com/features/actions) - CI/CD para tests automáticos

---

<div align="center">

**⭐ Si te gusta este proyecto, ¡Ayuda a Patto con una estrella en GitHub! ⭐**

[Reportar Bug](https://github.com/HormigaDev/patto-bot-template/issues) • [Solicitar Feature](https://github.com/HormigaDev/patto-bot-template/issues)

</div>
