# Carpeta: Loaders

## 📖 Descripción

Los **loaders** (cargadores) son responsables de descubrir, cargar y registrar comandos. Actúan como factories del sistema.

## 🏗️ Estructura

```
loaders/
├── command.loader.ts          # Carga comandos desde archivos
└── slash-command.loader.ts    # Registra comandos en Discord API
```

## 📦 CommandLoader

### Responsabilidad

**Cargar comandos** desde el sistema de archivos.

### Métodos

#### `loadCommands()`

Escanea y carga todos los comandos.

**Proceso:**

1. Busca archivos `*.command.ts` en `/src/commands/`
2. Importa cada módulo dinámicamente
3. Extrae la clase del comando
4. Lee metadata con `@Command`
5. **Normaliza nombres de argumentos** (lowercase, sin acentos, solo alfanumérico)
6. Registra en Map
7. Registra aliases

**Normalización de argumentos:**

- El loader normaliza automáticamente el `name` de cada argumento definido con `@Arg`
- Genera `normalizedName`: lowercase, sin acentos, sin espacios, solo alfanumérico
- **Ejemplo:** `"Usuario Objetivo"` → `"usuarioobjetivo"`
- El `name` original se mantiene intacto para mostrar en ayudas y mensajes

**Ejemplo:**

```typescript
const loader = new CommandLoader();
await loader.loadCommands();
// ✅ Comandos cargados: 5
// ✅ Argumentos normalizados automáticamente
```

#### `getCommand(nameOrAlias)`

Obtiene un comando por nombre o alias.

**Retorna:**

- `CommandClass` si existe
- `undefined` si no existe

**Ejemplo:**

```typescript
const command = loader.getCommand('ping');
const command2 = loader.getCommand('latencia'); // alias de ping
```

#### `getAllCommands()`

Obtiene todos los comandos cargados.

**Retorna:**

- `Map<string, CommandClass>`

**Ejemplo:**

```typescript
const commands = loader.getAllCommands();
for (const [name, commandClass] of commands) {
    console.log(`Comando: ${name}`);
}
```

#### `size`

Getter que retorna la cantidad de comandos cargados.

**Ejemplo:**

```typescript
console.log(`Total: ${loader.size} comandos`);
```

#### `getCommandsByCategory(category)`

Obtiene todos los comandos de una categoría específica.

**Parámetros:**

- `category: Category` - La categoría a filtrar

**Retorna:**

- `CommandClass[]` - Array de clases de comandos

**Ejemplo:**

```typescript
import { Category } from '@/utils/CommandCategories';

const infoCommands = loader.getCommandsByCategory(Category.Info);
console.log(`Comandos de información: ${infoCommands.length}`);
```

**Nota sobre categorías:**

- Si un comando no especifica `category` en el decorador `@Command`, se asigna automáticamente a `Category.Other`
- Las categorías se usan para organizar comandos en menús de ayuda

### Estructura Interna

```typescript
private commands = new Map<string, CommandClass>();
private aliases = new Map<string, string>();
```

- **commands**: Mapeo de nombre → clase
- **aliases**: Mapeo de alias → nombre real

### Patrón Glob

Usa el patrón: `src/commands/**/*.command.ts`

**Ejemplos que coinciden:**

- `src/commands/ping.command.ts` ✅
- `src/commands/admin/ban.command.ts` ✅
- `src/commands/utils/help.command.ts` ✅

**Ejemplos que NO coinciden:**

- `src/commands/ping.ts` ❌
- `src/commands/helpers/util.ts` ❌

---

## 🌐 SlashCommandLoader

### Responsabilidad

**Registrar comandos** en Discord API como slash commands.

### Constructor

```typescript
constructor(
    private client: Client,
    private commandLoader: CommandLoader
)
```

### Métodos

#### `registerSlashCommands()`

Registra todos los comandos en Discord.

**Proceso:**

1. Itera sobre todos los comandos cargados
2. Lee metadata de `@Command` y `@Arg`
3. Convierte tipos TypeScript a tipos Discord
4. **Convierte `options` a `choices` de Discord**
5. Crea JSON de comandos
6. Hace PUT a la API de Discord

**Ejemplo:**

```typescript
const registrar = new SlashCommandLoader(client, commandLoader);
await registrar.registerSlashCommands();
// ✅ Comandos Slash registrados.
```

### Mapeo de Tipos

Convierte tipos TypeScript a `ApplicationCommandOptionType`:

| TypeScript   | Discord            |
| ------------ | ------------------ |
| `String`     | `String`           |
| `Number`     | `Number`           |
| `Boolean`    | `Boolean`          |
| `User`       | `User`             |
| `Channel`    | `Channel`          |
| `Role`       | `Role`             |
| `Attachment` | `Attachment`       |
| Otros        | `String` (default) |

### Soporte de Choices (Options)

Si un argumento tiene la propiedad `options` definida, se convierte automáticamente a **choices** de Discord:

```typescript
// Definición
@Arg({
    name: 'idioma',
    options: [
        { label: 'Español', value: 'es' },
        { label: 'English', value: 'en' },
    ],
})
public idioma!: string;

// JSON generado para Discord
{
    "name": "idioma",
    "description": "...",
    "type": 3, // String
    "choices": [
        { "name": "Español", "value": "es" },
        { "name": "English", "value": "en" }
    ]
}
```

**Conversión automática:**

- `label` → `name` (texto mostrado)
- `value` → `value` (valor enviado al bot)

**Ventajas:**

- ✅ Dropdown automático en Discord
- ✅ Validación nativa por Discord
- ✅ No permite valores personalizados
- ✅ Mejor UX para usuarios

### Formato JSON

**Sin choices:**

```json
{
    "name": "ping",
    "description": "Verifica la latencia",
    "options": [
        {
            "name": "verbose",
            "description": "Mostrar detalles",
            "type": 5,
            "required": false
        }
    ]
}
```

**Con choices:**

```json
{
    "name": "config",
    "description": "Configurar servidor",
    "options": [
        {
            "name": "opcion",
            "description": "Opción a configurar",
            "type": 3,
            "required": true,
            "choices": [
                { "name": "Prefijo", "value": "prefix" },
                { "name": "Idioma", "value": "language" }
            ]
        }
    ]
}
```

### Endpoint de Discord

```typescript
Routes.applicationCommands(clientId);
// PUT /applications/{clientId}/commands
```

**Nota:** Esto registra comandos **globalmente**. Para comandos de servidor (guild), usa:

```typescript
Routes.applicationGuildCommands(clientId, guildId);
```

### Errores Comunes

#### "Missing Access"

**Causa:** Bot no tiene permisos
**Solución:** Invitar bot con scope `applications.commands`

#### "Invalid Form Body"

**Causa:** Nombre o descripción inválidos
**Solución:** Revisar que cumplan las reglas de Discord:

- Nombre: 1-32 caracteres, lowercase, sin espacios
- Descripción: 1-100 caracteres

#### "Rate Limit"

**Causa:** Demasiadas peticiones
**Solución:** Discord limita a 200 registros por día

## 🔄 Flujo Completo

```
Inicio del Bot
    ↓
CommandLoader.loadCommands()
    ↓
    ├─ Escanear archivos
    ├─ Importar módulos
    ├─ Leer @Command metadata
    └─ Registrar en Map
    ↓
SlashCommandLoader.registerSlashCommands()
    ↓
    ├─ Iterar comandos
    ├─ Leer @Arg metadata
    ├─ Mapear tipos
    ├─ Construir JSON
    └─ PUT a Discord API
    ↓
Comandos disponibles en Discord
```

## 📚 Recursos Relacionados

- `/src/commands/` - Comandos cargados
- `/src/core/decorators/` - Metadata de comandos
- [Discord API Docs](https://discord.com/developers/docs/interactions/application-commands) - Documentación oficial
