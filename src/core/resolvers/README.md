# Carpeta: Resolvers

## 📖 Descripción

Los **resolvers** (resolvedores) son responsables de transformar valores raw (strings, números) en tipos específicos de TypeScript y Discord.

## 🏗️ Estructura

```
resolvers/
├── type.resolver.ts         # Coerción de tipos primitivos y Discord
└── argument.resolver.ts     # Resolución completa de argumentos
```

## 🔄 TypeResolver

### Responsabilidad

**Coercionar y resolver tipos** (primitivos y Discord).

### Métodos Estáticos

#### `coerceType(rawValue, designType)`

Coerce valores a tipos primitivos.

**Parámetros:**

-   `rawValue`: `any` - Valor raw a convertir
-   `designType`: `Function` - Tipo destino (String, Number, Boolean, Array)

**Retorna:**

```typescript
{
    value?: any,      // Valor convertido (si exitoso)
    error?: string    // Mensaje de error (si falla)
}
```

**Ejemplos:**

```typescript
// String
TypeResolver.coerceType(123, String);
// → { value: "123" }

// Number
TypeResolver.coerceType('456', Number);
// → { value: 456 }

TypeResolver.coerceType('abc', Number);
// → { error: "Debe ser un número." }

// Boolean
TypeResolver.coerceType('true', Boolean);
// → { value: true }

TypeResolver.coerceType('yes', Boolean);
// → { value: true }

TypeResolver.coerceType('sí', Boolean);
// → { value: true }

// Array
TypeResolver.coerceType('a,b,c', Array);
// → { value: ["a", "b", "c"] }
```

**Lógica de Boolean:**

-   Regex positivo: `/^(?:yes|s[ií])$/iu`
-   Valores true: `"true"`, `"t"`, `"1"`, `"yes"`, `"sí"`
-   Otros valores: `false`

**Lógica de Array:**

-   Split por comas: `"a,b,c"` → `["a", "b", "c"]`
-   Trim automático
-   Filtra valores vacíos

#### `resolveDiscordType(rawValue, typeName, msg, ctx)`

Resuelve tipos de Discord desde menciones o IDs.

**Parámetros:**

-   `rawValue`: `string` - Valor raw (mención o ID)
-   `typeName`: `string` - Tipo a resolver (`'user'`, `'member'`, `'role'`, `'channel'`)
-   `msg`: `Message` - Mensaje fuente (para menciones)
-   `ctx`: `CommandContext` - Contexto (para fetches)

**Retorna:**

-   Objeto Discord resuelto (User, Member, Role, Channel)
-   `null` si no se encuentra

**Formatos Soportados:**

```typescript
// USER
'<@123456789>'; // Mención normal
'<@!123456789>'; // Mención con nickname
'123456789'; // ID directo

// MEMBER
'<@123456789>'; // Mención normal
'<@!123456789>'; // Mención con nickname
'123456789'; // ID directo

// ROLE
'<@&123456789>'; // Mención de rol
'123456789'; // ID directo

// CHANNEL
'<#123456789>'; // Mención de canal
'123456789'; // ID directo
```

**Flujo de Resolución:**

```
Input: "<@123456789>"
    ↓
Regex Match → Extraer ID
    ↓
Buscar en msg.mentions
    ↓
¿Encontrado?
    ├─ Sí → Retornar
    └─ No → Fetch de Discord API
        ↓
    ¿Encontrado?
        ├─ Sí → Retornar
        └─ No → Retornar null
```

**Ejemplos:**

```typescript
// Resolver usuario desde mención
await TypeResolver.resolveDiscordType('<@123456789>', 'user', message, ctx);
// → User { id: "123456789", ... }

// Resolver rol desde ID
await TypeResolver.resolveDiscordType('987654321', 'role', message, ctx);
// → Role { id: "987654321", ... }

// No encontrado
await TypeResolver.resolveDiscordType('999999999', 'user', message, ctx);
// → null
```

**Regex Patterns:**

```typescript
// User/Member
/^<@!?(\d+)>$/

// Role
/^<@&(\d+)>$/

// Channel
/^<#(\d+)>$/

// ID Directo
/^\d+$/
```

---

## 🎯 ArgumentResolver

### Responsabilidad

**Resolver y validar todos los argumentos** de un comando.

### Métodos Estáticos

#### `resolveArguments(source, ctx, argsMeta, TCommandClass, textArgs?)`

Resuelve todos los argumentos de un comando.

**Parámetros:**

-   `source`: `Message | ChatInputCommandInteraction` - Fuente
-   `ctx`: `CommandContext` - Contexto
-   `argsMeta`: `IArgumentOptions[]` - Metadata de argumentos
-   `TCommandClass`: Clase del comando
-   `textArgs?`: `any[]` - Argumentos parseados (text commands)

**Retorna:**

-   `Map<string, any>` - Mapa de propertyName → valor resuelto

**Proceso:**

```
1. Iterar argumentos en orden
    ↓
2. Obtener valor raw
    ├─ Interaction: options.get(name)?.value
    └─ Message: textArgs[index]
    ↓
3. Validar si es requerido
    ↓
4. Detectar tipo
    ├─ Discord Type + Interaction → Usar option.user/role/etc
    ├─ Discord Type + Message → TypeResolver.resolveDiscordType()
    └─ Otro → TypeResolver.coerceType()
    ↓
5. Ejecutar validación personalizada
    ↓
6. Guardar en Map
    ↓
7. Retornar Map completo
```

**Ejemplo de uso:**

```typescript
const resolvedArgs = await ArgumentResolver.resolveArguments(
    interaction,
    ctx,
    argsMeta,
    PingCommand,
);

// resolvedArgs = Map {
//   "verbose" => true,
//   "target" => User { ... }
// }
```

### Manejo de Slash Commands

Para slash commands, Discord.js **ya resuelve** los tipos Discord:

```typescript
// No necesitas parsear menciones en interactions
const option = interaction.options.get('usuario');
const user = option?.user; // Ya es un User object
const member = option?.member; // Ya es un GuildMember object
```

El resolver simplemente extrae estos valores:

```typescript
if (ctx.isInteraction && isDiscordType) {
    value = option?.user || option?.member || option?.role || option?.channel;
}
```

### Manejo de Text Commands

Para text commands, necesitas parsear menciones/IDs:

```typescript
if (!ctx.isInteraction && isDiscordType) {
    value = await TypeResolver.resolveDiscordType(rawValue, typeName, msg, ctx);
}
```

### Validación de Opciones (Options)

Si el argumento tiene `options` definidas, el resolver valida que el valor sea uno de los permitidos:

```typescript
if (meta.options && meta.options.length > 0) {
    const validValues = meta.options.map((opt) => opt.value);
    if (!validValues.includes(value)) {
        throw new ValidationError(
            `Valor inválido para ${meta.name}. Valores permitidos: ${validValues.join(', ')}`,
        );
    }
}
```

**Características:**

-   ✅ Validación automática para text y slash commands
-   ✅ Case-sensitive (debe coincidir exactamente con `value`)
-   ✅ Soporta valores `string` y `number`
-   ✅ Mensaje de error automático con valores permitidos

**Ejemplo:**

```typescript
@Arg({
    name: 'idioma',
    options: [
        { label: 'Español', value: 'es' },
        { label: 'English', value: 'en' },
    ],
})
public idioma!: string;

// Uso válido:
// !comando es ✅
// !comando en ✅

// Uso inválido:
// !comando ES ❌ (case-sensitive)
// !comando español ❌ (debe usar 'es', no el label)
```

### Validación Personalizada

Ejecuta la función `validate` del decorador `@Arg`:

```typescript
if (meta.validate) {
    const result = meta.validate(value);
    if (result !== true) {
        throw new ValidationError(typeof result === 'string' ? result : 'Valor inválido');
    }
}
```

**Posibles retornos:**

-   `true` → Validación exitosa
-   `false` → Error genérico
-   `string` → Mensaje de error personalizado

**Orden de validación:**

1. **Options** (si están definidas) - Valida valores predefinidos
2. **Validate** (si está definida) - Validación custom adicional

**Ejemplo combinando ambas:**

```typescript
@Arg({
    name: 'modo',
    options: [
        { label: 'Normal', value: 'normal' },
        { label: 'Hardcore', value: 'hardcore' },
    ],
    validate: (val: string) => {
        // Validación adicional después de verificar options
        if (val === 'hardcore' && !tienePermisos()) {
            return 'No tienes permisos para usar modo hardcore';
        }
        return true;
    },
})
public modo!: string;
```

### Parseo de Tipos Personalizados

Para tipos que **no son primitivos ni Discord**, debes proporcionar un `parser`:

```typescript
@Arg({
    name: 'jugador',
    description: 'Jugador de Minecraft',
    index: 0,
    required: true,
    parser: (val: any) => new MinecraftUser(val), // Parser obligatorio
    type: () => MinecraftUser, // Tipo esperado
})
public jugador!: MinecraftUser;
```

**Flujo:**

1. Se llama al `parser(rawValue)`
2. El parser debe retornar una instancia del tipo especificado
3. Se valida que el resultado sea instancia de `type()`
4. Si el parser lanza error, se captura y se muestra al usuario

**Ejemplo completo:**

```typescript
// Clase personalizada
class MinecraftUser {
    constructor(public username: string) {
        if (username.length < 3 || username.length > 16) {
            throw new Error('Username debe tener entre 3 y 16 caracteres');
        }
    }
}

// Definición del comando
@Command({ name: 'mcuser' })
export abstract class McUserDefinition extends BaseCommand {
    @Arg({
        name: 'jugador',
        description: 'Usuario de Minecraft',
        index: 0,
        required: true,
        parser: (val: any) => new MinecraftUser(val),
        type: () => MinecraftUser,
    })
    public jugador!: MinecraftUser;
}

// Implementación
export class McUserCommand extends McUserDefinition {
    async run(): Promise<void> {
        // this.jugador ya es una instancia de MinecraftUser
        await this.reply(`Usuario: ${this.jugador.username}`);
    }
}
```

**Sin parser en tipo personalizado:**

Si defines un tipo personalizado sin `parser`, obtendrás un error claro:

```
❌ El argumento `jugador` es de tipo personalizado `MinecraftUser` y requiere un parser.
Ejemplo: @Arg({ ..., parser: (val) => new MinecraftUser(val), type: () => MinecraftUser })
```

---

### 📝 Manejo de Raw Text

La propiedad `rawText: true` permite capturar **todo el texto restante** sin parseo de argumentos separados.

#### Comportamiento

**Text Commands:**

-   ✅ Captura todo el texto después del comando
-   ✅ Excluye argumentos previos (menor índice)
-   ✅ No requiere comillas
-   ✅ Útil para comandos como `!say`, `!announce`, etc.

**Slash Commands:**

-   ⚠️ Se comporta como argumento normal de texto
-   ⚠️ No hay "texto restante", solo su valor individual

#### Flujo Interno (Text Commands)

```typescript
if (meta.rawText && !ctx.isInteraction) {
    rawValue = this.extractRawText(
        fullMessageContent, // Mensaje completo: "!say Hola mundo"
        allArgsMeta, // Todos los argumentos del comando
        currentMeta, // Metadata del argumento actual
        resolvedArgs, // Argumentos ya resueltos
    );
}
```

**`extractRawText()` hace:**

1. Remueve el prefijo (`!`)
2. Remueve el nombre del comando (`say`)
3. Cuenta cuántos argumentos previos hay (menor `index`)
4. Salta esos tokens del inicio
5. Retorna el resto como string completo

#### Ejemplos de Resolución

**Caso 1: Solo rawText**

```typescript
// Definición
@Arg({ name: 'mensaje', index: 0, rawText: true })
public mensaje!: string;

// Usuario: !say Hola mundo, cómo estás?

// Proceso:
// 1. fullMessageContent = "!say Hola mundo, cómo estás?"
// 2. Remover "!" → "say Hola mundo, cómo estás?"
// 3. Remover "say" → "Hola mundo, cómo estás?"
// 4. No hay argumentos previos
// 5. Resultado: "Hola mundo, cómo estás?"
```

**Caso 2: Argumento + rawText**

```typescript
// Definición
@Arg({ name: 'canal', index: 0 })
public canal!: Channel;

@Arg({ name: 'mensaje', index: 1, rawText: true })
public mensaje!: string;

// Usuario: !announce #general Este es el anuncio completo

// Proceso:
// 1. Resolver canal primero → Channel { id: "123" }
// 2. Para rawText:
//    - fullMessageContent = "!announce #general Este es el anuncio completo"
//    - Remover "!" → "announce #general Este es el anuncio completo"
//    - Remover "announce" → "#general Este es el anuncio completo"
//    - Hay 1 argumento previo (canal en index 0)
//    - Saltar 1 token → "#general" se omite
// 3. Resultado: "Este es el anuncio completo"
```

**Caso 3: Múltiples argumentos + rawText**

```typescript
// Definición
@Arg({ name: 'tipo', index: 0 })
public tipo!: string;

@Arg({ name: 'color', index: 1 })
public color!: string;

@Arg({ name: 'texto', index: 2, rawText: true })
public texto!: string;

// Usuario: !embed info blue Este es el contenido del embed

// Proceso:
// 1. Resolver tipo → "info"
// 2. Resolver color → "blue"
// 3. Para rawText:
//    - fullMessageContent = "!embed info blue Este es el contenido del embed"
//    - Remover "!" → "embed info blue Este es el contenido del embed"
//    - Remover "embed" → "info blue Este es el contenido del embed"
//    - Hay 2 argumentos previos
//    - Saltar 2 tokens → "info" y "blue" se omiten
// 4. Resultado: "Este es el contenido del embed"
```

#### Comparación Text vs Slash

```typescript
// Comando: SetStatus
@Arg({ name: 'tipo', index: 0 })
public tipo!: string;

@Arg({ name: 'texto', index: 1, rawText: true })
public texto!: string;
```

**Text Command:**

```
!setstatus playing Minecraft en el servidor
→ tipo = "playing"
→ texto = "Minecraft en el servidor"  (todo el resto)
```

**Slash Command:**

```
/setstatus tipo:playing texto:Minecraft en el servidor
→ tipo = "playing"
→ texto = "Minecraft en el servidor"  (argumento normal)
```

#### Limitaciones

1. **Solo para Text Commands**: `rawText` es ignorado en slash commands
2. **Debe ser el último argumento**: No puede haber argumentos después
3. **No funciona con comillas**: Ya no necesitas comillas, todo se captura
4. **Un solo rawText por comando**: Solo un argumento puede tener `rawText: true`

---

### Errores Lanzados

#### ValidationError

Lanzado cuando:

-   Argumento requerido falta
-   Tipo inválido
-   Validación personalizada falla
-   Discord type no encontrado
-   Tipo personalizado sin parser
-   Error en la ejecución del parser

**Ejemplos:**

```typescript
// Argumento faltante
throw new ValidationError('El argumento `usuario` es obligatorio.');

// Tipo personalizado sin parser
throw new ValidationError(
    'El argumento `jugador` es de tipo personalizado `MinecraftUser` y requiere un parser.',
);

// Error en parser
throw new ValidationError(
    'Error al parsear `jugador`: Username debe tener entre 3 y 16 caracteres',
);
```

## 🔄 Flujo Completo

```
ArgumentResolver.resolveArguments()
    ↓
Para cada argumento:
    ↓
1. Obtener raw value
    ↓
2. ¿Es requerido y falta?
    └─ Sí → throw ValidationError
    ↓
3. ¿Tiene valor?
    └─ No → Continuar
    ↓
4. ¿Tiene parser (tipo personalizado)?
    └─ Sí → Ejecutar parser(rawValue)
        ↓
        ¿Tiene type especificado?
        └─ Validar instanceof
    ↓
5. ¿Es tipo Discord?
    ├─ Interaction → Extraer de option
    └─ Message → TypeResolver.resolveDiscordType()
    ↓
6. ¿Es tipo primitivo?
    └─ TypeResolver.coerceType()
    ↓
7. ¿Es tipo personalizado sin parser?
    └─ throw ValidationError (requiere parser)
    ↓
8. ¿Error de coerción?
    └─ Sí → throw ValidationError
    ↓
9. ¿Tiene validación personalizada?
    └─ Sí → Ejecutar validate()
        └─ ¿Falla? → throw ValidationError
    ↓
10. Guardar en Map
    ↓
Retornar Map completo
```

## 🎨 Ejemplo de Uso Integrado

```typescript
// Definición
@Command({ name: 'give' })
export abstract class GiveDefinition extends BaseCommand {
    @Arg({
        name: 'usuario',
        index: 0,
        required: true
    })
    public usuario!: User;

    @Arg({
        name: 'cantidad',
        index: 1,
        required: true,
        validate: (val: number) => val > 0 || 'Debe ser positivo'
    })
    public cantidad!: number;
}

// Cuando el usuario ejecuta: !give @User 100
// o: /give usuario:@User cantidad:100

// ArgumentResolver hace:
const resolvedArgs = await ArgumentResolver.resolveArguments(...);

// resolvedArgs = Map {
//   "usuario" => User { id: "123", username: "John" },
//   "cantidad" => 100
// }

// El CommandHandler inyecta:
command.usuario = User { ... };
command.cantidad = 100;

// Tu run() puede usar directamente:
public async run() {
    // this.usuario ya es un User object
    // this.cantidad ya es un number validado
    await this.reply(`Dando ${this.cantidad} a ${this.usuario.username}`);
}
```

## 📚 Recursos Relacionados

-   `/src/core/handlers/command.handler.ts` - Usa estos resolvers
-   `/src/core/decorators/argument.decorator.ts` - Metadata de argumentos
-   `/src/error/ValidationError.ts` - Errores de validación
