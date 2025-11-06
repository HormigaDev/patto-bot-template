# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-05

### 🎉 Lanzamiento Inicial

Primera versión pública del template. Incluye sistema completo de comandos, plugins, componentes interactivos y testing.

### ✨ Added (Características Principales)

#### 🎯 Sistema de Comandos

- **Decoradores TypeScript** para definición declarativa de comandos
    - `@Command` - Definir comandos con metadata
    - `@Arg` - Definir argumentos con validación automática
    - `@RequirePermissions` - Validación de permisos de Discord
    - `@UsePlugins` - Aplicar plugins a comandos específicos
- **Slash Commands** (`/comando`) - Siempre disponibles
- **Text Commands** (`!comando`) - Opcionales y configurables
- **Resolución automática** de argumentos con tipos nativos y Discord
- **Raw Text Capture** - Captura texto completo sin comillas
- **Options/Choices** - Argumentos con valores predefinidos
- **Aliases** para comandos de texto
- **Tipos Discord** (User, Role, Channel, Member) resueltos automáticamente
- **Custom Type Parsers** para tipos personalizados

#### 🔌 Sistema de Plugins

- **BasePlugin** - Clase base extensible con 4 lifecycle hooks
    - `onBeforeRegisterCommand` - Modificar comandos antes de registrar
    - `onAfterRegisterCommand` - Post-registro (logging, analytics)
    - `onBeforeExecute` - Pre-ejecución (validaciones, cooldowns)
    - `onAfterExecute` - Post-ejecución (recompensas, logging)
- **Plugin Scopes** - Aplicación granular de plugins
    - Scope global (todos los comandos)
    - Scope por carpeta (comandos de una categoría)
    - Scope por decorador (comandos específicos)
- **PermissionsPlugin** - Sistema de permisos integrado
    - Validación en registro (Discord API)
    - Validación en ejecución (runtime)
    - Soporte para múltiples permisos (bitwise OR)
    - Inmutable (no modifica JSON original)
    - 20 tests completos (unit + integration)

#### 🎨 Componentes Interactivos

- **Button Wrapper** - Botones con callbacks inline
    - Estilos: Primary, Success, Danger, Secondary, Link
    - No requiere archivos separados
    - Callbacks tipo-seguros
- **Select Wrapper** - Select menus con onChange inline
    - String select, User select, Role select, Channel select, Mentionable select
    - Opciones personalizables con emojis
    - Handlers automáticos
- **Modal Wrapper** - Formularios interactivos
    - Campos de texto (short, paragraph)
    - onSubmit inline con valores parseados
    - Validación automática
- **RichMessage** - Gestión centralizada de componentes
    - 1 timeout global para N componentes (mejor performance)
    - Auto-limpieza después de inactividad (20s default)
    - Registry global automático
    - Sin boilerplate

#### 🏗️ Arquitectura Limpia

- **Principios SOLID** aplicados
- **Separación de responsabilidades**
    - Loaders (cargan comandos, eventos)
    - Handlers (procesan mensajes, interacciones)
    - Resolvers (parsean argumentos)
    - Plugins (extienden funcionalidad)
- **CommandContext** unificado para Messages e Interactions
- **BaseCommand** con helpers útiles
    - `reply()` - Responder al usuario
    - `send()` - Enviar mensaje al canal
    - `getEmbed(type)` - Embeds pre-configurados (error, success, warning, info)
- **Decoradores reutilizables**
- **Path aliases** (@/core, @/commands, @/utils, etc.)

#### 🛠️ Developer Experience

- **TypeScript** con strict mode
- **Hot reload** en desarrollo (ts-node)
- **Testing completo** con Jest
    - 57+ tests (unit + integration + e2e)
    - Cobertura de código configurada
    - Mocks de Discord.js incluidos
    - CI/CD con GitHub Actions
- **Documentación exhaustiva**
    - README detallado con ejemplos
    - Documentación por carpeta
    - Guías de arquitectura (ARCHITECTURE.md)
    - Documentación de plugins
    - Documentación de testing
    - JSDoc en código fuente
- **Ejemplos listos para usar**
    - Comando ping básico
    - Comando ask con OpenAI
    - Comando con permisos
    - Plugin de permisos

#### ⚙️ Configuración Flexible

- **Variables de entorno** con validación robusta
    - `BOT_TOKEN` (obligatorio)
    - `CLIENT_ID` (obligatorio)
    - `USE_MESSAGE_CONTENT` (opcional)
    - `COMMAND_PREFIX` (opcional, default: !)
    - `INTENTS` (opcional, automático)
- **Validación automática al inicio**
    - Mensajes de error claros
    - Guías de qué falta configurar
    - Sugerencias de solución
- **Intents automáticos** según features usadas
- **Presencias personalizables**
- **Manejo robusto de errores**
    - `ValidationError` para validaciones
    - `ReplyError` para errores de usuario
    - Error handling global

#### 🧪 Testing Infrastructure

- **Jest 29** con soporte TypeScript
- **Mocks de Discord.js** pre-configurados
    - createMockClient, createMockUser, createMockGuild
    - createMockMember, createMockTextChannel
    - createMockMessage, createMockInteraction
- **Fixtures** - Datos de prueba reutilizables
- **Path aliases** funcionando en tests
- **Coverage reports** con umbrales configurables
- **Debug en VSCode** configurado
- **Estructura organizada**
    - `/tests/unit` - Tests unitarios
    - `/tests/integration` - Tests de integración
    - `/tests/e2e` - Tests end-to-end
    - `/tests/mocks` - Mocks reutilizables
    - `/tests/fixtures` - Datos de prueba

#### 📚 Utilidades Incluidas

- **Times** - Conversión de tiempo a milisegundos
- **CommandCategories** - Categorías predefinidas para comandos
- **Permissions** - Re-export de permisos de Discord.js con categorización
- **Colors** - Paleta de colores para embeds

#### 🔒 Sistema de Permisos

- **@RequirePermissions** decorator
- **PermissionsPlugin** incluido
- **Validación dual** (registro + ejecución)
- **Inmutable** (no modifica configuración original)
- **20 tests completos** garantizando funcionalidad
- **Soporte para múltiples permisos**
- **Mensajes de error personalizables**

### 📖 Documentation

- README.md - Guía principal completa
- ARCHITECTURE.md - Documentación de arquitectura
- /src/core/decorators/README.md - Guía de decoradores
- /src/core/structures/README.md - Guía de estructuras base
- /src/plugins/README.md - Sistema de plugins
- /src/plugins/permissions.plugin.README.md - Plugin de permisos
- /src/utils/README.md - Utilidades disponibles
- /tests/README.md - Infraestructura de testing
- JSDoc completo en todo el código fuente

### 🔧 Technical Details

- **Node.js**: ≥18.0.0
- **Discord.js**: 14.16.3
- **TypeScript**: 5.9.3
- **Jest**: 29.7.0
- **Reflect Metadata**: Para decoradores
- **TSConfig Paths**: Para path aliases
- **ESLint + Prettier**: Linting y formateo

### 📦 Project Structure

```
patto-bot-template/
├── src/
│   ├── bot.ts                 # Instancia del bot
│   ├── index.ts               # Entry point
│   ├── commands/              # Implementaciones de comandos
│   ├── core/                  # Sistema core
│   │   ├── decorators/        # Decoradores (@Command, @Arg, etc)
│   │   ├── handlers/          # Handlers de mensajes/interacciones
│   │   ├── loaders/           # Cargadores de comandos/eventos
│   │   ├── resolvers/         # Resolvers de argumentos
│   │   └── structures/        # Clases base (BaseCommand, BasePlugin)
│   ├── definition/            # Definiciones de comandos
│   ├── error/                 # Errores personalizados
│   ├── events/                # Event listeners
│   ├── plugins/               # Plugins del sistema
│   ├── utils/                 # Utilidades
│   └── wrappers/              # Wrappers de componentes
├── tests/                     # Suite de tests completa
│   ├── unit/                  # Tests unitarios
│   ├── integration/           # Tests de integración
│   ├── e2e/                   # Tests end-to-end
│   ├── mocks/                 # Mocks de Discord.js
│   └── fixtures/              # Datos de prueba
├── assets/                    # Recursos estáticos
├── .github/                   # GitHub Actions CI/CD
├── package.json
├── tsconfig.json
├── jest.config.js
├── .env.template
├── README.md
├── ARCHITECTURE.md
├── CHANGELOG.md
└── LICENSE
```

### 🎯 Highlights

- ✅ **57+ tests** pasando (100% cobertura crítica)
- ✅ **Documentación exhaustiva** (8 archivos README + JSDoc)
- ✅ **Arquitectura modular** fácil de extender
- ✅ **Type-safe** con TypeScript strict
- ✅ **Production-ready** con validación robusta
- ✅ **Developer-friendly** con hot reload y debugging
- ✅ **CI/CD** configurado con GitHub Actions

### 🚀 Getting Started

```bash
# Instalar
git clone https://github.com/HormigaDev/patto-bot-template.git
cd patto-bot-template
npm install

# Configurar
cp .env.template .env
# Editar .env con tu BOT_TOKEN y CLIENT_ID

# Desarrollar
npm run dev

# Testing
npm test

# Producción
npm run build
npm start
```

---

## [Unreleased]

### 🔮 Future Plans

- [ ] Dashboard web para gestión del bot
- [ ] Sistema de economía con comandos de banco
- [ ] Sistema de niveles y experiencia
- [ ] Comandos de música (YouTube, Spotify)
- [ ] Sistema de tickets avanzado
- [ ] Base de datos integrada (MongoDB/PostgreSQL)
- [ ] Internacionalización (i18n)
- [ ] Sistema de logs avanzado con webhooks
- [ ] Rate limiting global
- [ ] Caching system

---

[1.0.0]: https://github.com/HormigaDev/patto-bot-template/releases/tag/v1.0.0
[Unreleased]: https://github.com/HormigaDev/patto-bot-template/compare/v1.0.0...HEAD
