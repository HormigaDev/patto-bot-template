# 🚀 Instalación con Patto CLI

**Patto CLI** es la herramienta oficial de línea de comandos para trabajar con **Patto Bot Template**. Facilita la inicialización de proyectos y acelera el desarrollo con generación automática de código.

---

## 📋 Tabla de Contenidos

- [¿Qué es Patto CLI?](#-qué-es-patto-cli)
- [Instalación de Patto CLI](#-instalación-de-patto-cli)
- [Crear un Proyecto Nuevo](#-crear-un-proyecto-nuevo)
- [Ventajas vs Instalación Manual](#-ventajas-vs-instalación-manual)
- [Primeros Pasos](#-primeros-pasos)
- [Generar Código Automáticamente](#️-generar-código-automáticamente)
- [Solución de Problemas](#-solución-de-problemas)
- [Enlaces Útiles](#-enlaces-útiles)

---

## 🎯 ¿Qué es Patto CLI?

**Patto CLI** es una herramienta de línea de comandos que simplifica el trabajo con Patto Bot Template:

- ✅ **Inicialización rápida** de proyectos desde el template oficial
- ✅ **Generación automática** de comandos, subcomandos, grupos y plugins
- ✅ **Validaciones integradas** para nombres y estructura
- ✅ **30+ tests** garantizando su funcionamiento
- ✅ **TypeScript nativo** con soporte completo

---

## 📦 Instalación de Patto CLI

Tienes tres opciones para usar Patto CLI:

### Opción 1: Instalación Global (Recomendado)

Instala Patto CLI globalmente para usarlo en cualquier proyecto:

```bash
npm install -g patto-cli
```

**Ventajas:**

- ✅ Disponible en cualquier carpeta
- ✅ Comando `patto` accesible globalmente
- ✅ Ideal para crear múltiples proyectos

**Verificar instalación:**

```bash
patto --version
```

### Opción 2: Uso con npx (Sin instalación)

Usa Patto CLI directamente sin instalarlo:

```bash
npx patto-cli <comando>
```

**Ventajas:**

- ✅ Sin instalación previa necesaria
- ✅ Siempre usa la última versión
- ✅ Ideal para uso ocasional

### Opción 3: Instalación Local (Desarrollo)

Instala Patto CLI como dependencia de desarrollo en un proyecto existente:

```bash
npm install --save-dev patto-cli
```

**Ventajas:**

- ✅ Versionado con el proyecto
- ✅ Ideal para equipos de desarrollo
- ✅ Consistencia entre entornos

**Uso:** Ejecuta con `npx patto` o agrega scripts en `package.json`

---

## 🚀 Crear un Proyecto Nuevo

### Método Interactivo

La forma más sencilla es dejar que Patto CLI te guíe:

```bash
patto init
```

El CLI te preguntará:

```
? ¿Cuál será el nombre de tu proyecto? › mi-bot-discord
```

**¿Qué hace este comando?**

1. ✅ Clona el repositorio oficial de Patto Bot Template
2. ✅ Crea una carpeta con el nombre de tu proyecto
3. ✅ Preserva mayúsculas/minúsculas en el nombre de la carpeta
4. ✅ Convierte a kebab-case para `package.json`
5. ✅ Instala todas las dependencias automáticamente
6. ✅ Limpia el historial de git
7. ✅ Deja el proyecto listo para usar

### Método Directo

Puedes especificar el nombre del proyecto directamente:

```bash
patto init MiSuperBot
```

Esto creará:

- 📁 Carpeta: `./MiSuperBot/`
- 📦 `package.json` con `name: "mi-super-bot"`

### Ejemplos de Nombres

```bash
# Preserva mayúsculas en carpeta
patto init MyAwesomeBot
# Crea: ./MyAwesomeBot/
# package.json: "my-awesome-bot"

# Nombres con guiones
patto init my-discord-bot
# Crea: ./my-discord-bot/
# package.json: "my-discord-bot"

# Nombres con espacios (se convierten)
patto init "My Cool Bot"
# Crea: ./My Cool Bot/
# package.json: "my-cool-bot"
```

---

## ⚡ Ventajas vs Instalación Manual

| Característica            | Con Patto CLI         | Instalación Manual            |
| ------------------------- | --------------------- | ----------------------------- |
| **Tiempo de setup**       | 2-3 minutos           | 5-10 minutos                  |
| **Clonado del repo**      | Automático            | Manual con `git clone`        |
| **Instalación de deps**   | Automática            | Manual con `npm install`      |
| **Configuración de .env** | Manual (una vez)      | Manual (una vez)              |
| **Generar comandos**      | `patto g c -n ping`   | Crear archivos manualmente    |
| **Generar plugins**       | `patto g p -n logger` | Crear y registrar manualmente |
| **Validaciones**          | Automáticas           | Manual                        |
| **Registro de plugins**   | Automático            | Manual en `plugins.config.ts` |

**Conclusión:** Patto CLI ahorra tiempo y reduce errores humanos.

---

## 🎮 Primeros Pasos

Una vez creado el proyecto, sigue estos pasos:

### 1. Entrar al proyecto

```bash
cd MiSuperBot
```

### 2. Configurar Variables de Entorno

Copia el template de configuración:

```bash
cp .env.template .env
```

Edita `.env` con tus credenciales de Discord:

```env
# Variables OBLIGATORIAS
BOT_TOKEN=tu_token_aqui        # Token del bot
CLIENT_ID=tu_client_id_aqui    # ID de la aplicación

# Variables OPCIONALES
USE_MESSAGE_CONTENT=true       # true = comandos de texto | false = solo slash
COMMAND_PREFIX=!               # Prefijo para comandos de texto
```

**📚 Más información:** Ver [`docs/MESSAGE_CONTENT_CONFIG.md`](./MESSAGE_CONTENT_CONFIG.md) para configuración detallada.

### 3. Iniciar el Bot

#### Desarrollo (con hot reload):

```bash
npm run dev
```

#### Producción:

```bash
npm run build
npm start
```

### 4. Verificar que Funciona

Si todo está bien, verás en consola:

```
[INFO] Bot conectado como: TuBot#1234
✅ Comandos Slash registrados (X comandos)
```

Prueba en Discord:

- `/ping` - Verifica latencia
- `/help` - Lista de comandos

---

## 🛠️ Generar Código Automáticamente

Una de las grandes ventajas de Patto CLI es la generación automática de código.

### Generar un Comando Básico

```bash
patto generate command --name ping --description "Verifica latencia del bot"
# o usando el alias corto:
patto g c -n ping -d "Verifica latencia del bot"
```

**Genera:**

```
src/
├── commands/
│   └── ping.command.ts          # Implementación
└── definitions/
    └── ping.definition.ts       # Decorador y definición
```

### Generar un Subcomando

```bash
patto generate subcommand --name info --parent user --description "Información de usuario"
# o alias:
patto g s -n info -p user -d "Información de usuario"
```

**Genera:**

```
src/
├── commands/
│   └── user-info.command.ts
└── definitions/
    └── user-info.definition.ts
```

### Generar un Grupo de Subcomandos

```bash
patto generate subcommand-group --name roles -parent admin --subcomand manage --description "Gestión de roles"
# o alias:
patto g g -n roles -p admin -s manage -d "Gestión de roles"
```

**Genera:**

```
src/
├── commands/
│   └── admin-manage-roles.command.ts
└── definitions/
    └── admin-manage-roles.definition.ts
```

### Generar un Plugin

```bash
patto generate plugin --name logger --global
# o alias:
patto g p -n logger --global
```

**Genera:**

```
src/
├── plugins/
│   └── logger.plugin.ts
└── config/
    └── plugins.config.ts        # ← Actualizado automáticamente
```

**El plugin se registra automáticamente** - No necesitas editar manualmente `plugins.config.ts`.

### Ejemplo: Bot Completo desde Cero

```bash
# 1. Crear proyecto
patto init MiBot
cd MiBot

# 2. Generar comandos básicos
patto g c -n ping -d "Verifica latencia"
patto g c -n help -d "Muestra ayuda"

# 3. Generar comando de usuario con subcomandos
patto g c -n user -d "Gestión de usuarios"
patto g s -n info -p user -d "Info de usuario"
patto g s -n avatar -p user -d "Avatar de usuario"

# 4. Generar comando admin con grupos
patto g c -n admin -d "Comandos administrativos"
patto g s -n manage -p admin -d "Gestión"
patto g g -n roles -p admin -s manage -d "Roles"
patto g g -n channels -p admin -s manage -d "Canales"

# 5. Generar plugins
patto g p -n auth --folder commands
patto g p -n logger --global

# 6. Iniciar el bot
npm run dev
```

**Resultado:** Un bot funcional con estructura profesional en minutos.

---

## 🐛 Solución de Problemas

### Error: "comando 'patto' no encontrado"

**Causa:** Patto CLI no está instalado globalmente o no está en el PATH.

**Solución:**

```bash
# Opción 1: Instalar globalmente
npm install -g patto-cli

# Opción 2: Usar npx
npx patto-cli init MiBot
```

### Error: "nombre debe estar en kebab-case"

**Causa:** El nombre del comando/plugin contiene mayúsculas o caracteres inválidos.

**Solución:** Usa solo minúsculas y guiones:

```bash
# ❌ Incorrecto
patto g c -n MyCommand
patto g c -n my_command
patto g c -n "my command"

# ✅ Correcto
patto g c -n my-command
patto g c -n user-info
patto g c -n utils/helper
```

### Error: "archivo ya existe"

**Causa:** Ya existe un comando/plugin con ese nombre.

**Solución:**

1. Verifica si el archivo ya existe:

    ```bash
    ls src/commands/
    ```

2. Usa otro nombre o elimina el archivo existente:
    ```bash
    rm src/commands/mi-comando.command.ts
    rm src/definitions/mi-comando.definition.ts
    ```

### Error: Dependencias no se instalan

**Causa:** Problemas de red o caché de npm.

**Solución:**

```bash
# Limpiar caché de npm
npm cache clean --force

# Instalar dependencias manualmente
cd MiBot
npm install
```

### Comando `patto init` se queda colgado

**Causa:** Problemas de conexión con GitHub o npm.

**Solución:**

1. Verifica tu conexión a internet
2. Intenta clonar manualmente:
    ```bash
    git clone https://github.com/HormigaDev/patto-bot-template.git MiBot
    cd MiBot
    npm install
    ```

---

## 📚 Enlaces Útiles

### Documentación

- 📖 [README Principal del Template](../README.md)
- 📖 [Arquitectura del Proyecto](../ARCHITECTURE.md)
- 📖 [Guía de Contribución](../CONTRIBUTING.md)
- 📖 [Guía de Subcomandos](./Subcommands.README.md)
- 📖 [Guía de Grupos de Subcomandos](./SubcommandGroups.README.md)
- 📖 [Sistema de Permisos](../src/plugins/permissions.plugin.README.md)
- 📖 [Componentes Interactivos](../src/core/components/README.md)

### Patto CLI

- 🔧 [Repositorio de Patto CLI](https://github.com/HormigaDev/patto-cli)
- 📦 [Patto CLI en npm](https://www.npmjs.com/package/patto-cli)
- 🐛 [Reportar Bug en Patto CLI](https://github.com/HormigaDev/patto-cli/issues)

### Patto Bot Template

- 🏠 [Repositorio del Template](https://github.com/HormigaDev/patto-bot-template)
- 🐛 [Reportar Bug en Template](https://github.com/HormigaDev/patto-bot-template/issues)
- 💬 [Servidor de Discord](https://discord.gg/x79VjB37vQ)

### Discord.js

- 📖 [Documentación de Discord.js](https://discord.js.org/)
- 🎓 [Guía de Discord.js](https://discordjs.guide/)
- 🏠 [Discord Developer Portal](https://discord.com/developers/applications)

---

## 🎯 Próximos Pasos

Ahora que tienes tu proyecto configurado con Patto CLI:

1. ✅ **Lee la documentación** del template en el README principal
2. ✅ **Explora los ejemplos** incluidos en `src/commands/examples/`
3. ✅ **Genera tus propios comandos** con `patto generate`
4. ✅ **Escribe tests** para tu código (ver `tests/README.md`)
5. ✅ **Personaliza el bot** según tus necesidades
6. ✅ **Comparte tu experiencia** en el servidor de Discord

---

## 🙏 Agradecimientos

Gracias por usar **Patto CLI** y **Patto Bot Template**. Si te gusta el proyecto:

- ⭐ Dale una estrella en [GitHub](https://github.com/HormigaDev/patto-cli)
- 🐛 Reporta bugs o sugiere features en [Issues](https://github.com/HormigaDev/patto-cli/issues)
- 🤝 Contribuye al proyecto siguiendo la [Guía de Contribución](../CONTRIBUTING.md)

---

<div align="center">

**Happy Coding! 🚀**

[Volver al README Principal](../README.md) • [Ver Template en GitHub](https://github.com/HormigaDev/patto-bot-template) • [Ver CLI en GitHub](https://github.com/HormigaDev/patto-cli)

</div>
