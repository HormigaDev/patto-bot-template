# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-12

### 🎉 Soporte para Subcomandos y Grupos de Subcomandos

Implementación completa del sistema de subcomandos de Discord con hasta 3 niveles de anidamiento.

### ✨ Added

#### 🎯 Sistema de Subcomandos

- **Nuevos Decoradores**
    - `@Subcommand` - Definir subcomandos simples (2 niveles: `comando subcomando`)
    - `@SubcommandGroup` - Definir grupos de subcomandos (3 niveles: `comando grupo subcomando`)
- **Jerarquía de Decoradores** - Prioridad automática: `@SubcommandGroup` > `@Subcommand` > `@Command`
- **Keys en Kebab-Case** - Sistema de identificación consistente para recuperación
    - Comando base: `help`
    - Subcomando: `config-get` (parent: config, name: get)
    - Grupo: `server-config-get` (parent: server, name: config, subcommand: get)
- **Soporte en Text Commands** - Los comandos de texto (`!comando`) soportan subcomandos
- **Soporte en Slash Commands** - Agrupación automática en formato Discord
- **Estructura de 3 Niveles**:
    - Nivel 1: `<comando>`
    - Nivel 2: `<comando> <subcomando>` o `<comando> <grupo>`
    - Nivel 3: `<comando> <grupo> <subcomando>`

#### ⚡ Optimizaciones del CommandLoader

- **Sistema Inteligente de Almacenamiento**
    - Umbral configurable (default: 100 comandos)
    - ≤ 100 comandos: Toda la metadata en memoria (máximo rendimiento)
    - \> 100 comandos: Sistema de caching con Map (optimización de memoria)
- **Nuevos Métodos de Recuperación**
    - `getSubcommands(parentName)` - Obtiene subcomandos de un comando padre
    - `getSubcommandGroups(parentName)` - Obtiene grupos de subcomandos organizados
    - `getCommandEntry(key)` - Recupera comando por kebab-case key con metadata completa

#### 🤖 Registro Inteligente de Slash Commands

- **Comandos Fantasma** - Creación automática de comandos padre cuando no existen
    - Detecta subcomandos/grupos sin comando base
    - Genera automáticamente el comando padre como contenedor
    - Descripción generada: `"Comandos de {nombre}"`
    - Log distintivo: `👻 Comando fantasma creado: "{nombre}" (solo contenedor de subcomandos)`
- **Sin Modificaciones Requeridas** - Los subcomandos funcionan automáticamente sin crear comando base
- **Soporte de Plugins** - Los comandos fantasma se omiten del ciclo de plugins (no tienen clase asociada)

#### 📚 Documentación

- **docs/Subcommands.README.md** - Guía completa de subcomandos simples
- **docs/SubcommandGroups.README.md** - Guía completa de grupos de subcomandos
- **Mejores Prácticas** - Recomendaciones de organización de archivos y carpetas
- **Ejemplos Actualizados** - Comandos de ejemplo con subcomandos y grupos

### 🔧 Changed

- **CommandLoader** - Refactorizado para soportar jerarquía de comandos
- **SlashCommandLoader** - Agrupación automática por parent con construcción correcta de JSON
- **CommandHandler** - Soporte para comandos anidados con path tracking
- **Events** (`messageCreate`, `interactionCreate`) - Recuperación por kebab-case keys

### 🐛 Fixed

- **Registro de Slash Commands** - Los subcomandos y grupos ahora se registran correctamente en Discord API
    - Problema: Subcomandos/grupos sin comando base no se registraban
    - Solución: Sistema de "comandos fantasma" que crea automáticamente el comando padre
    - Efecto: Los comandos de ejemplo `config` y `server` ahora funcionan como slash commands
- **Help Command** - Corregido error al mostrar información de subcomandos
    - Problema: `TypeError: Cannot read properties of undefined (reading 'name')` al ejecutar `!help config get`
    - Causa: Metadata retrieval usaba solo `COMMAND_METADATA_KEY` para todos los tipos
    - Solución: Detección inteligente del tipo de comando con uso correcto de metadata keys

### 📖 Documentation

- Actualizado `README.md` con mejores prácticas de organización
- Actualizado `src/commands/README.md` con referencias a subcomandos
- Actualizado `ARCHITECTURE.md` con nueva estructura de comandos
- Nuevas guías detalladas en `docs/`

### ✅ Testing

- Sistema verificado con 7 comandos de ejemplo
- 2 comandos base, 2 subcomandos simples, 2 grupos con 3 subcomandos
- Recuperación correcta por keys kebab-case
- Compilación sin errores TypeScript
- Sin errores de ESLint

---

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
