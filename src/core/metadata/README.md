# Módulo de Metadata Centralizada

Este módulo proporciona un sistema centralizado para el manejo de metadatos en todo el proyecto, mejorando el rendimiento y la mantenibilidad del código.

## 🚀 Motivación

En Discord bots que requieren baja latencia, las múltiples llamadas a `Reflect.getMetadata` pueden introducir overhead innecesario. Este módulo resuelve ese problema centralizando toda la metadata en una única referencia global que se carga una sola vez al inicio del programa.

### Antes (múltiples llamadas a Reflect)

```typescript
import { COOLDOWN_METADATA_KEY } from '@/core/decorators/cooldown.decorator';
import { REQUIRE_PERMISSIONS_METADATA_KEY } from '@/core/decorators/permission.decorator';

// Cada llamada tiene un costo
const cooldown = Reflect.getMetadata(COOLDOWN_METADATA_KEY, target);
const permissions = Reflect.getMetadata(REQUIRE_PERMISSIONS_METADATA_KEY, target);
```

### Después (acceso centralizado)

```typescript
import { metadataHandler } from '@/core/metadata';

// Acceso directo a la referencia en memoria
const cooldown = metadataHandler.getCooldown(target);
const permissions = metadataHandler.getRequiredPermissions(target);
```

## 📦 Estructura

```
src/core/metadata/
├── index.ts              # Exports públicos del módulo
├── metadata.store.ts     # Almacén con caché (lee de Reflect una vez)
├── metadata.handler.ts   # API de alto nivel (usada por el resto del código)
└── README.md            # Esta documentación
```

## 🔧 Componentes

### MetadataStore

Almacén singleton que lee metadata desde Reflect y la cachea. La primera consulta a una clase lee desde `Reflect.getMetadata` y almacena el resultado. Las consultas siguientes retornan el valor cacheado.

**Características:**
- Lee de Reflect solo una vez por clase
- Herencia automática via `Reflect.getMetadata`
- Método `invalidateCommand()` para forzar re-lectura
- Método `clear()` para tests

### metadataHandler

API de alto nivel para consultar metadata. Este es el punto de entrada principal para todo el código de la aplicación.

```typescript
import { metadataHandler } from '@/core/metadata';
```

## 📖 API del metadataHandler

### Comandos

```typescript
// Obtener metadata de @Command
const command = metadataHandler.getCommand(PingCommand);

// Obtener metadata de @Subcommand
const subcommand = metadataHandler.getSubcommand(UserInfoSubcommand);

// Obtener metadata de @SubcommandGroup
const group = metadataHandler.getSubcommandGroup(AdminBanCommand);

// Obtener tipo de comando con herencia de clase padre
const metadata = metadataHandler.getCommandMetadataWithInheritance(MyCommand);
if (metadata?.type === 'command') {
    console.log(metadata.meta.name);
}
```

### Argumentos

```typescript
// Obtener todos los argumentos
const args = metadataHandler.getArguments(SayCommand);

// Verificar si tiene argumentos
if (metadataHandler.hasArguments(SayCommand)) {
    // ...
}
```

### Cooldown

```typescript
// Obtener configuración de cooldown
const cooldown = metadataHandler.getCooldown(PingCommand);

// Verificar si tiene cooldown
if (metadataHandler.hasCooldown(PingCommand)) {
    const time = metadataHandler.getCooldownTime(PingCommand);
    console.log(`Cooldown: ${time}ms`);
}
```

### Permisos

```typescript
// Permisos requeridos del usuario
const userPerms = metadataHandler.getRequiredPermissions(BanCommand);
if (metadataHandler.hasRequiredPermissions(BanCommand)) {
    // Verificar permisos...
}

// Permisos requeridos del bot
const botPerms = metadataHandler.getBotPermissions(KickCommand);
if (metadataHandler.hasBotPermissions(KickCommand)) {
    // Verificar permisos del bot...
}
```

### Plugins

```typescript
// Obtener plugins configurados via @UsePlugins
const plugins = metadataHandler.getPlugins(MyCommand);
```

### Utilidades

```typescript
// Verificar si una clase tiene metadata de comando
if (metadataHandler.isCommand(MyClass)) {
    // ...
}

// Obtener el tipo de comando
const type = metadataHandler.getCommandType(MyCommand);
// Retorna: 'command' | 'subcommand' | 'subcommand-group' | null

// Obtener todas las clases de comandos
const allCommands = metadataHandler.getAllCommands();

// Obtener estadísticas
const stats = metadataHandler.getStats();
console.log(`Comandos: ${stats.commands}`);
```

## 🔄 Flujo de Datos

1. **Carga de módulos**: Cuando TypeScript carga los archivos de comandos, los decoradores se ejecutan automáticamente.

2. **Registro en Reflect**: Cada decorador (`@Command`, `@Cooldown`, etc.) registra su metadata usando `Reflect.defineMetadata`.

3. **Consulta con caché**: Cuando el código consulta metadata via `metadataHandler`, el `MetadataStore` lee desde `Reflect.getMetadata` la primera vez y cachea el resultado. Las consultas siguientes usan el caché directamente.

4. **Herencia automática**: `Reflect.getMetadata` maneja automáticamente la herencia de clases, por lo que las clases hijas heredan la metadata de sus clases padre (ej: `HelpCommand` hereda de `HelpDefinition`).

5. **Invalidación de caché**: Si la metadata se modifica después de ser cacheada (ej: normalización de argumentos), se puede invalidar el caché con `MetadataStore.invalidateCommand(target)`.

## ✅ Beneficios

1. **Rendimiento**: La metadata se lee de Reflect solo una vez y luego se accede desde caché.

2. **Simplicidad**: Los decoradores solo usan `Reflect.defineMetadata`, sin duplicación.

3. **Herencia**: La herencia de clases funciona automáticamente gracias a Reflect.

4. **API Limpia**: Código más legible y menos propenso a errores.

5. **Tipado Fuerte**: Todos los métodos tienen tipos correctos.

6. **Testabilidad**: El `MetadataStore` tiene un método `clear()` para limpiar entre tests.

## 🧪 Testing

```typescript
import { MetadataStore } from '@/core/metadata';

beforeEach(() => {
    // Limpiar metadata entre tests
    MetadataStore.clear();
});
```

## 📝 Migración

Si tienes código que usa `Reflect.getMetadata` directamente:

1. Importa el `metadataHandler`:

    ```typescript
    import { metadataHandler } from '@/core/metadata';
    ```

2. Reemplaza las llamadas:

    ```typescript
    // Antes
    const meta = Reflect.getMetadata(COOLDOWN_METADATA_KEY, target);

    // Después
    const meta = metadataHandler.getCooldown(target);
    ```

## ⚠️ Notas Importantes

- Los decoradores usan `Reflect.defineMetadata` para registrar metadata.
- El `MetadataStore` lee desde `Reflect.getMetadata` la primera vez y cachea.
- La herencia de clases funciona automáticamente (las clases hijas heredan metadata de sus padres).
- Si modificas metadata después de que fue cacheada, usa `MetadataStore.invalidateCommand(target)`.
- El `design:type` de TypeScript se captura en el decorador `@Arg` y se almacena en la metadata del argumento.
- El `MetadataStore` es un singleton y mantiene referencias globales a toda la metadata cacheada.
