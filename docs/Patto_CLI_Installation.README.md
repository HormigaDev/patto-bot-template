# `@patto/cli` — Guía de uso con Patto Bot Template

**`@patto/cli`** es la herramienta oficial de línea de comandos para proyectos Patto Bot Template.
Combina generación de código con análisis estático nativo (núcleo en Rust) para un workflow profesional.

---

## Tabla de Contenidos

- [Instalación](#instalación)
- [Inicializar un proyecto](#inicializar-un-proyecto)
- [Generación de código](#generación-de-código)
- [Análisis del proyecto](#análisis-del-proyecto)
- [Configuración `.patto/config.json`](#configuración-pattoconfigjson)
- [Workflow recomendado](#workflow-recomendado)
- [API por stdin](#api-por-stdin)
- [Solución de problemas](#solución-de-problemas)
- [Enlaces útiles](#enlaces-útiles)

---

## Instalación

```bash
# Con npm
npm install -g @patto/cli

# Con pnpm (recomendado)
pnpm add -g @patto/cli
```

Verificar instalación:

```bash
patto --version
patto --help
```

### Plataformas compatibles

`@patto/cli` descarga automáticamente el núcleo nativo para tu plataforma:

- **Linux x64** — `@patto/cli-core-linux-x64`
- **Linux arm64** — `@patto/cli-core-linux-arm64`
- **Windows x64** — `@patto/cli-core-win32-x64`

---

## Inicializar un proyecto

### Modo interactivo

```bash
patto init
```

El CLI te guiará con preguntas:

```
? Nombre del proyecto (ej. MiBot): MiSuperBot
? Descripcion del proyecto: Un bot de Discord increíble
```

### Modo directo (sin preguntas)

```bash
patto init MiSuperBot --description "Un bot de Discord increíble"
```

### ¿Qué hace `patto init`?

1. Clona el repositorio oficial de Patto Bot Template vía `git clone` (si Git está disponible)
2. Si Git no está instalado, descarga la última release como ZIP desde GitHub
3. Elimina el historial de git del template
4. Actualiza `package.json` con el nombre y descripción del proyecto
5. Inicializa un nuevo repositorio Git con un commit inicial

### Nombres de proyecto

```bash
# Preserva mayúsculas en la carpeta
patto init MyAwesomeBot
# Carpeta: ./MyAwesomeBot/
# package.json: "my-awesome-bot"

# Acepta espacios (la carpeta los elimina)
patto init "Mi Bot Discord"
# Carpeta: ./MiBotDiscord/
# package.json: "mi-bot-discord"
```

### Primeros pasos tras `patto init`

```bash
cd MiSuperBot
cp .env.template .env        # Configura tus credenciales
pnpm install                 # Instala dependencias
pnpm dev                     # Inicia en modo desarrollo
```

---

## Generación de código

### Comando

Crea un comando dividido en definición + implementación:

```bash
patto generate command info/ping
# Alias: patto g command info/ping
```

Crea:

```
src/definitions/info/ping.definition.ts
src/commands/info/ping.command.ts
```

Para un único archivo:

```bash
patto generate command info/ping --single-file
```

Con descripción y categoría:

```bash
patto generate command info/ping --description "Verifica la latencia" --category info
```

### Subcomando

```bash
patto generate subcommand get --parent config
# Crea: src/commands/config/get.command.ts
```

### Grupo de subcomandos

```bash
patto generate subcommand-group set --parent server --group config
# Crea: src/commands/server/config/set.command.ts
```

### Definición independiente

```bash
patto generate definition help
patto generate definition get --kind subcommand --parent config
patto generate definition set --kind subcommand-group --parent server --group config
```

### Plugin

```bash
# Plugin global
patto generate plugin audit-log --scope deep-folder --folder moderation

# Plugin para comandos específicos
patto generate plugin review-gate --scope specified --commands info/about,admin/ban

# Sin registro automático en plugins.config.ts
patto generate plugin my-plugin --no-register
```

### Aliases

```bash
patto g command ping          # alias de generate
patto scaffold command ping   # alias de generate
```

---

## Análisis del proyecto

Todos los comandos de análisis aceptan `--root <path>` para indicar la raíz del bot.
Si se omite, usa el directorio actual.

### `patto scan`

Indexa el proyecto y escribe `.patto/index.json`:

```bash
patto scan --root /ruta/al/bot
```

### `patto lint`

Ejecuta las reglas estáticas de Patto sobre comandos, definiciones, plugins y convenciones:

```bash
patto lint --root /ruta/al/bot
```

### `patto doctor`

Verifica la salud del proyecto: runtime, dependencias, scripts, archivos env, tsconfig,
configuración de Patto, sharding/Redis y salida de compilación:

```bash
patto doctor --root /ruta/al/bot
```

### `patto check` (recomendado para CI)

Ejecuta `scan + lint + doctor` en un solo comando:

```bash
patto check --root /ruta/al/bot
```

### Salida JSON

Usa `--json` para obtener el JSON crudo del núcleo Rust:

```bash
patto check --json
```

Ejemplo de diagnóstico en la salida legible por humanos:

```
src/config/plugins.config.ts:45:15 WARNING plugin-specified-commands
  PluginScope.Specified no tiene una lista de commands válida.
  45 | //     scope: PluginScope.Specified,
     |               ^^^^^^^^^^^^^^^^^^^^^
  hint: Agrega commands: [MiCommand] cuando uses PluginScope.Specified.
```

Colores de severidad: rojo = error, amarillo = warning, azul = info.

---

## Configuración `.patto/config.json`

El template ya incluye `.patto/config.json` con la configuración mínima.
El archivo `.patto/index.json` (generado por `patto scan`) está en `.gitignore`.

### Configuración mínima

```json
{
    "$schema": "./config.schema.json",
    "schemaVersion": 1,
    "lang": "es"
}
```

El `$schema` activa el autocompletado en VSCode y otros editores compatibles con JSON Schema.

### Ajustar reglas de lint

```json
{
    "schemaVersion": 1,
    "lang": "es",
    "lint-rules": {
        "duplicate-commands": "error",
        "invalid-command-names": "warning",
        "ghost-parent-mix": "off"
    }
}
```

Niveles disponibles: `off` | `info` | `warning` | `error`

### Reglas de lint disponibles

| Regla | Default | Descripción |
|---|---|---|
| `duplicate-commands` | error | Comandos con el mismo nombre registrados más de una vez |
| `duplicate-aliases` | error | Aliases de texto duplicados entre comandos |
| `invalid-command-names` | warning | Nombres de comandos que no cumplen restricciones de Discord |
| `unknown-command-files` | warning | Archivos `.command.ts` sin decorador reconocido |
| `decorated-base-command` | error | Clases abstractas de definición con decorador incorrecto |
| `missing-run-method` | error | Clases de comando concretas sin método `run()` |
| `subcommand-consistency` | error | Inconsistencias entre subcomandos y sus definiciones |
| `ghost-parent-mix` | warning | Mezcla de comandos reales y fantasma bajo el mismo padre |
| `invalid-arguments` | warning | Decoradores `@Arg` con configuración inválida |
| `command-folder-convention` | warning | Archivos de comando fuera de la convención de carpetas |
| `broken-alias-imports` | error | Imports `@/` que no resuelven a un archivo existente |
| `plugin-specified-commands` | warning | Plugins `PluginScope.Specified` sin lista de comandos |
| `sharding-redis-config` | warning | Configuración de sharding/Redis incompleta |
| `component-handler-methods` | error | Handlers de componentes mal definidos |

---

## Workflow recomendado

### Flujo de desarrollo

```bash
# 1. Crear proyecto
patto init MiBot
cd MiBot
cp .env.template .env
pnpm install

# 2. Generar comandos
patto generate command info/ping --description "Verifica la latencia"
patto generate command admin/ban --description "Banea un usuario"

# 3. Generar subcomandos
patto generate subcommand get --parent config --description "Obtiene config"
patto generate subcommand set --parent config --description "Establece config"

# 4. Generar plugin
patto generate plugin cooldown --scope deep-folder

# 5. Desarrollar
pnpm dev

# 6. Verificar antes de commit
patto check --root .
```

### En CI/CD

```yaml
# GitHub Actions (ejemplo)
- name: Patto check
  run: patto check --root . --json
```

---

## API por stdin

Para extensiones, scripts o integraciones de editor:

```bash
printf '{"command":"check","root":"/ruta/al/bot","lang":"es"}' | patto core --stdin
```

Formato de respuesta:

```json
{
    "ok": true,
    "command": "check",
    "exitCode": 0,
    "stderr": "",
    "output": {},
    "diagnostics": []
}
```

Comandos válidos para `command`: `scan`, `lint`, `doctor`, `check`.

---

## Solución de problemas

### Error: "comando 'patto' no encontrado"

```bash
# Reinstalar globalmente
npm install -g @patto/cli
# o
pnpm add -g @patto/cli
```

### Error: "No hay un binario nativo compatible disponible"

Tu plataforma aún no tiene soporte nativo. Los comandos `generate` e `init` funcionan en todas las plataformas; `scan`, `lint`, `doctor` y `check` requieren el binario nativo.
Consulta [el repositorio](https://github.com/HormigaDev/patto-monorepo/issues) para solicitar soporte.

### `patto init` clona con Git en lugar del ZIP

Esto es correcto. Si Git está instalado, se usa `git clone` (más rápido). Si no, se descarga la última release como ZIP automáticamente.

### Error: "El directorio ya existe"

Ya existe una carpeta con ese nombre en el directorio actual. Usa otro nombre o elimina la carpeta existente.

### Error al lint: "No parece ser un proyecto Patto válido"

El comando `scan`/`lint`/`doctor`/`check` no encuentra los archivos base del template.
Verifica que estás en la raíz del proyecto o usa `--root /ruta/correcta`.

---

## Enlaces útiles

- 📦 [@patto/cli en npm](https://www.npmjs.com/package/@patto/cli)
- 🏠 [Repositorio en GitHub](https://github.com/HormigaDev/patto-monorepo)
- 🐛 [Reportar un bug](https://github.com/HormigaDev/patto-monorepo/issues)
- 📖 [README del template](../README.md)
- 📖 [Arquitectura del proyecto](../ARCHITECTURE.md)

---

<div align="center">

**Happy Coding! 🚀**

[Volver al README Principal](../README.md) • [Template en GitHub](https://github.com/HormigaDev/patto-bot-template)

</div>