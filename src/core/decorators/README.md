# Carpeta: Decorators

## 📖 Descripción

Esta carpeta contiene los **decoradores TypeScript** que se utilizan para definir metadatos de comandos, subcomandos, grupos de subcomandos, argumentos, plugins y permisos. Los decoradores permiten escribir código declarativo y legible.

### Tipos de Decoradores

- **`@Command`**: Define comandos base (1 nivel)
- **`@Subcommand`**: Define subcomandos (2 niveles: `comando subcomando`)
- **`@SubcommandGroup`**: Define grupos de subcomandos (3 niveles: `comando grupo subcomando`)
- **`@Arg`**: Define argumentos con validación y tipos
- **`@UsePlugins`**: Aplica plugins específicos a un comando
- **`@RequirePermissions`**: Requiere permisos de Discord para usar el comando

## 🏗️ Estructura

```
decorators/
├── command.decorator.ts           # Decorador @Command (comandos base)
├── subcommand.decorator.ts        # Decorador @Subcommand (2 niveles)
├── subcommand-group.decorator.ts  # Decorador @SubcommandGroup (3 niveles)
├── argument.decorator.ts          # Decorador @Arg
├── plugin.decorator.ts            # Decorador @UsePlugins
└── permission.decorator.ts        # Decorador @RequirePermissions
```

## 🎨 Decorador @Command

Define los metadatos de un comando.

### Ubicación

```typescript
// src/core/decorators/command.decorator.ts
```

### Interfaz

```typescript
interface ICommandOptions {
    name: string; // Nombre del comando (requerido)
    description: string; // Descripción del comando (requerido)
    category?: CommandCategoryTag; // Categoría del comando (opcional, default: Other)
    aliases?: string[]; // Aliases opcionales
}
```

### Uso

```typescript
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { CommandCategoryTag } from '@/utils/CommandCategories';

@Command({
    name: 'ping',
    description: 'Verifica la latencia del bot',
    category: CommandCategoryTag.Info, // Opcional
    aliases: ['latencia', 'pong'],
})
export abstract class PingDefinition extends BaseCommand {
    // ...
}
```

> **Nota:** Si no especificas `category`, el loader asignará automáticamente `CommandCategoryTag.Other`.

### Metadata Key

```typescript
export const COMMAND_METADATA_KEY = Symbol('commandMetadata');
```

Este símbolo se usa para almacenar y recuperar los metadatos del comando usando `reflect-metadata`.

### Funcionamiento Interno

1. **Aplicación del Decorador**

    ```typescript
    @Command({ name: 'ping', description: 'Test' })
    class MyCommand {}
    ```

2. **Almacenamiento de Metadata**

    ```typescript
    Reflect.defineMetadata(COMMAND_METADATA_KEY, options, target);
    ```

3. **Recuperación en CommandLoader**
    ```typescript
    const meta = Reflect.getMetadata(COMMAND_METADATA_KEY, commandClass);
    // meta = { name: 'ping', description: 'Test' }
    ```

### Validaciones

El decorador NO valida los datos. Las validaciones se hacen en:

- **CommandLoader**: Al cargar el comando
- **SlashCommandLoader**: Al registrar en Discord

### Ejemplo Completo

```typescript
@Command({
    name: 'userinfo',
    description: 'Muestra información de un usuario',
    aliases: ['info', 'user', 'perfil'],
})
export abstract class UserInfoDefinition extends BaseCommand {
    // Los argumentos van aquí con @Arg
}
```

---

## 🎯 Decorador @Subcommand

Define un **subcomando** (2 niveles: `comando subcomando`).

### Ubicación

```typescript
// src/core/decorators/subcommand.decorator.ts
```

### Interfaz

```typescript
interface ISubcommandOptions {
    parent: string; // Nombre del comando padre (requerido)
    name: string; // Nombre del subcomando (requerido)
    description: string; // Descripción del subcomando (requerido)
    category?: CommandCategoryTag; // Categoría opcional (default: Other)
}
```

### Uso

```typescript
import { Subcommand } from '@/core/decorators/subcommand.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@Subcommand({
    parent: 'config',
    name: 'get',
    description: 'Ver la configuración actual',
    category: 'Utility',
})
export class ConfigGetCommand extends BaseCommand {
    async execute(): Promise<void> {
        await this.ctx.reply('Configuración actual...');
    }
}
```

### Metadata Key

```typescript
export const SUBCOMMAND_METADATA_KEY = Symbol('subcommandMetadata');
```

### Jerarquía

El loader prioriza automáticamente:

1. `@SubcommandGroup` (máxima prioridad)
2. `@Subcommand`
3. `@Command` (si no hay otros)

### Key en Kebab-Case

Los subcomandos se identifican con keys en kebab-case:

```typescript
parent: 'config', name: 'get' → Key: "config-get"
```

### Ejemplo Completo

```typescript
import { Subcommand } from '@/core/decorators/subcommand.decorator';
import { Arg } from '@/core/decorators/argument.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@Subcommand({
    parent: 'config',
    name: 'set',
    description: 'Cambiar la configuración',
    category: 'Utility',
})
export class ConfigSetCommand extends BaseCommand {
    @Arg({
        name: 'key',
        description: 'Clave de configuración',
        index: 0,
        required: true,
        options: [
            { label: 'Tema', value: 'theme' },
            { label: 'Idioma', value: 'language' },
        ],
    })
    key!: string;

    @Arg({
        name: 'value',
        description: 'Nuevo valor',
        index: 1,
        required: true,
    })
    value!: string;

    async execute(): Promise<void> {
        await this.updateConfig(this.key, this.value);
        await this.ctx.reply(`✅ ${this.key} = ${this.value}`);
    }
}
```

**Uso en Discord:**

- Slash: `/config set key:theme value:dark`
- Text: `!config set theme dark`

📚 **Ver guía completa:** [Subcomandos](../../../docs/Subcommands.README.md)

---

## 🎯 Decorador @SubcommandGroup

Define un **grupo de subcomandos** (3 niveles: `comando grupo subcomando`).

### Ubicación

```typescript
// src/core/decorators/subcommand-group.decorator.ts
```

### Interfaz

```typescript
interface ISubcommandGroupOptions {
    parent: string; // Nombre del comando padre (requerido)
    name: string; // Nombre del grupo (requerido)
    subcommand: string; // Nombre del subcomando dentro del grupo (requerido)
    description: string; // Descripción del subcomando (requerido)
    category?: CommandCategoryTag; // Categoría opcional (default: Other)
}
```

> **Nota:** Si no especificas `category`, el loader asignará automáticamente `CommandCategoryTag.Other`.

### Uso

```typescript
import { SubcommandGroup } from '@/core/decorators/subcommand-group.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@SubcommandGroup({
    parent: 'server',
    name: 'config',
    subcommand: 'get',
    description: 'Ver la configuración del servidor',
})
export class ServerConfigGetCommand extends BaseCommand {
    async execute(): Promise<void> {
        await this.ctx.reply('Configuración del servidor...');
    }
}
```

### Metadata Key

```typescript
export const SUBCOMMAND_GROUP_METADATA_KEY = Symbol('subcommandMetadata');
```

### Jerarquía

Este decorador tiene **máxima prioridad**:

1. `@SubcommandGroup` ✅ (se usa primero)
2. `@Subcommand` (ignorado si existe SubcommandGroup)
3. `@Command` (ignorado si existe SubcommandGroup)

### Key en Kebab-Case

Los grupos se identifican con keys en kebab-case de 3 partes:

```typescript
parent: 'server', name: 'config', subcommand: 'get' → Key: "server-config-get"
```

### Ejemplo Completo

```typescript
import { SubcommandGroup } from '@/core/decorators/subcommand-group.decorator';
import { Arg } from '@/core/decorators/argument.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { User } from 'discord.js';

@SubcommandGroup({
    parent: 'server',
    name: 'user',
    subcommand: 'info',
    description: 'Ver información de un usuario del servidor',
})
export class ServerUserInfoCommand extends BaseCommand {
    @Arg({
        name: 'user',
        description: 'Usuario a consultar',
        index: 0,
        required: true,
        type: () => User,
    })
    user!: User;

    async execute(): Promise<void> {
        const member = await this.guild?.members.fetch(this.user.id);

        await this.ctx.reply({
            embeds: [
                {
                    title: `👤 ${this.user.tag}`,
                    thumbnail: { url: this.user.displayAvatarURL() },
                    fields: [
                        { name: 'ID', value: this.user.id },
                        { name: 'Se unió', value: member?.joinedAt?.toLocaleDateString() || 'N/A' },
                        { name: 'Roles', value: member?.roles.cache.size.toString() || '0' },
                    ],
                },
            ],
        });
    }
}
```

**Uso en Discord:**

- Slash: `/server user info user:@Usuario`
- Text: `!server user info @Usuario`

### Organización de Archivos

Se recomienda crear una estructura de carpetas que refleje la jerarquía:

```
commands/
└── server/                    # Comando padre
    ├── config/               # Grupo: config
    │   ├── get.command.ts    # /server config get
    │   └── set.command.ts    # /server config set
    └── user/                 # Grupo: user
        ├── info.command.ts   # /server user info
        └── list.command.ts   # /server user list
```

📚 **Ver guía completa:** [Grupos de Subcomandos](../../../docs/SubcommandGroups.README.md)

---

## 🎯 Decorador @Arg

Define un argumento de un comando.

### Ubicación

```typescript
// src/core/decorators/argument.decorator.ts
```

### Interfaz

```typescript
interface IArgumentOption {
    label: string; // Etiqueta mostrada al usuario
    value: string | number; // Valor real del argumento
}

interface IArgumentOptions {
    name: string; // Nombre del argumento (requerido) - Se mantiene intacto para mostrar
    normalizedName?: string; // Nombre normalizado (auto) - Usado internamente para resolución
    description: string; // Descripción del argumento (requerido)
    index: number; // Posición del argumento (requerido)
    required?: boolean; // Si es obligatorio (default: false)
    validate?: (val: any) => boolean | string; // Función de validación (opcional)
    type?: () => any; // Tipo personalizado - Obligatorio si usas parser
    parser?: (val: any) => any; // Parser personalizado - Obligatorio para tipos no primitivos/Discord
    rawText?: boolean; // Captura todo el texto después del comando (solo text commands)
    options?: IArgumentOption[]; // Opciones predefinidas (choices en Discord)
    propertyName?: string | symbol; // Nombre de la propiedad (auto)
    designType?: any; // Tipo de diseño (auto)
}
```

**Notas importantes:**

- ✅ **El `name` se mantiene intacto** para mostrar en ayudas y mensajes de error
- ✅ **`normalizedName` se genera automáticamente** al cargar el comando: lowercase, sin acentos, sin espacios, solo alfanumérico
- ✅ **Ejemplo:** `name: "Usuario Objetivo"` → `normalizedName: "usuarioobjetivo"`
- ✅ **El CommandLoader normaliza automáticamente** todos los nombres al cargar comandos

**Propiedades importantes:**

| Propiedad  | Tipo                              | Descripción                                                                    |
| ---------- | --------------------------------- | ------------------------------------------------------------------------------ |
| `parser`   | `(val: any) => any`               | **Obligatorio** para tipos personalizados. Transforma el valor raw en tu tipo. |
| `type`     | `() => any`                       | **Obligatorio** si usas `parser`. Especifica el tipo esperado para validación. |
| `validate` | `(val: any) => boolean \| string` | Validación adicional después del parseo.                                       |
| `rawText`  | `boolean`                         | Captura todo el texto restante (solo text commands). Ver sección dedicada.     |
| `options`  | `IArgumentOption[]`               | Opciones predefinidas (choices). Ver sección dedicada.                         |

### Uso Básico

```typescript
import { Arg } from '@/core/decorators/argument.decorator';

export abstract class MyDefinition extends BaseCommand {
    @Arg({
        name: 'texto',
        description: 'Un texto cualquiera',
        index: 0,
        required: true,
    })
    public texto!: string;
}
```

### Metadata Key

```typescript
export const ARGUMENT_METADATA_KEY = Symbol('commandArguments');
```

### Funcionamiento Interno

1. **Aplicación del Decorador**

    ```typescript
    @Arg({ name: 'usuario', index: 0 })
    public usuario!: User;
    ```

2. **Obtención del Tipo de Diseño**

    ```typescript
    const designType = Reflect.getMetadata('design:type', target, propertyKey);
    // designType = User (la clase)
    ```

3. **Almacenamiento en Array Ordenado**

    ```typescript
    const args = Reflect.getOwnMetadata(ARGUMENT_METADATA_KEY, target.constructor) || [];
    args.push({ ...options, propertyName: propertyKey, designType });
    args.sort((a, b) => a.index - b.index); // Ordenar por index
    Reflect.defineMetadata(ARGUMENT_METADATA_KEY, args, target.constructor);
    ```

4. **Recuperación en ArgumentResolver**
    ```typescript
    const argsMeta = Reflect.getMetadata(ARGUMENT_METADATA_KEY, commandClass);
    // argsMeta = [{ name: 'usuario', index: 0, ... }, ...]
    ```

### Ordenamiento Automático

Los argumentos se ordenan automáticamente por su `index`:

```typescript
@Arg({ name: 'segundo', index: 1 })
public segundo!: string;

@Arg({ name: 'primero', index: 0 })
public primero!: string;

// Resultado interno: [primero, segundo]
```

### Tipos Soportados

El decorador funciona con cualquier tipo de TypeScript:

```typescript
// Primitivos
public texto!: string;        // String
public numero!: number;       // Number
public activo!: boolean;      // Boolean
public lista!: string[];      // Array

// Tipos de Discord
public usuario!: User;        // Usuario
public miembro!: GuildMember; // Miembro
public canal!: Channel;       // Canal
public rol!: Role;            // Rol
```

### Validación Personalizada

```typescript
@Arg({
    name: 'edad',
    description: 'Tu edad',
    index: 0,
    required: true,
    validate: (value: number) => {
        if (value < 0) return 'La edad no puede ser negativa';
        if (value > 150) return 'La edad no es realista';
        return true; // Validación exitosa
    }
})
public edad!: number;
```

**Reglas:**

- Retorna `true` si la validación es exitosa
- Retorna un `string` con el mensaje de error si falla
- Retorna `false` para usar mensaje de error genérico

### Parser Personalizado para Tipos Complejos

Para tipos que **no son primitivos** (string, number, boolean) **ni Discord** (User, Role, etc.), debes proporcionar un `parser`:

```typescript
// Clase personalizada
class MinecraftPlayer {
    constructor(
        public username: string,
        public uuid: string,
    ) {}

    static fromString(input: string): MinecraftPlayer {
        // Validar formato: "username:uuid"
        const parts = input.split(':');
        if (parts.length !== 2) {
            throw new Error('Formato inválido. Use: username:uuid');
        }
        return new MinecraftPlayer(parts[0], parts[1]);
    }
}

// Uso en definición
@Command({ name: 'mcban' })
export abstract class McBanDefinition extends BaseCommand {
    @Arg({
        name: 'jugador',
        description: 'Jugador de Minecraft (formato: username:uuid)',
        index: 0,
        required: true,
        parser: (val: any) => MinecraftPlayer.fromString(val),
        type: () => MinecraftPlayer, // Obligatorio con parser
    })
    public jugador!: MinecraftPlayer;
}

// Uso en comando
export class McBanCommand extends McBanDefinition {
    async run(): Promise<void> {
        // this.jugador ya es una instancia de MinecraftPlayer
        await this.reply(`Baneando a ${this.jugador.username} (${this.jugador.uuid})`);
    }
}
```

**Ejemplo: Fecha personalizada**

```typescript
class CustomDate {
    constructor(public date: Date) {}

    static parse(input: string): CustomDate {
        const date = new Date(input);
        if (isNaN(date.getTime())) {
            throw new Error('Fecha inválida');
        }
        return new CustomDate(date);
    }
}

@Arg({
    name: 'fecha',
    description: 'Fecha (formato: YYYY-MM-DD)',
    index: 0,
    required: true,
    parser: (val: any) => CustomDate.parse(val),
    type: () => CustomDate,
})
public fecha!: CustomDate;
```

**¿Cuándo usar `parser`?**

| Tipo                                | Necesita Parser | Ejemplo                            |
| ----------------------------------- | --------------- | ---------------------------------- |
| `string`, `number`, `boolean`       | ❌ No           | `public nombre!: string`           |
| `User`, `Role`, `Channel`, `Member` | ❌ No           | `public usuario!: User`            |
| Clases personalizadas               | ✅ **Sí**       | `public jugador!: MinecraftPlayer` |
| Tipos complejos                     | ✅ **Sí**       | `public config!: GameConfig`       |

**Error sin parser:**

Si usas un tipo personalizado sin `parser`, obtendrás:

```
❌ El argumento `jugador` es de tipo personalizado `MinecraftPlayer` y requiere un parser.
Ejemplo: @Arg({ ..., parser: (val) => new MinecraftPlayer(val), type: () => MinecraftPlayer })
```

---

### 📝 Raw Text (Captura de Texto Completo)

La propiedad `rawText` permite capturar **todo el texto restante** después del comando o argumentos previos, sin necesidad de comillas.

#### ✅ Cuándo usar `rawText`

- Comandos que replican texto: `!say`, `!announce`, `!embed`
- Descripciones largas: `!setstatus`, `!bio`
- Mensajes personalizados sin formato estricto

#### 🔧 Comportamiento

**Text Commands (`!comando`):**

- ✅ Captura todo el texto después del comando (o después de argumentos previos)
- ✅ No requiere comillas
- ✅ Puede combinarse con otros argumentos

**Slash Commands (`/comando`):**

- ⚠️ Se comporta como un argumento de texto normal
- ⚠️ No captura "todo el texto", solo su propio valor

#### 📖 Ejemplo Básico: Comando Say

```typescript
@Command({
    name: 'say',
    description: 'Replica un mensaje',
})
export abstract class SayDefinition extends BaseCommand {
    @Arg({
        name: 'mensaje',
        description: 'El mensaje a replicar',
        index: 0,
        required: true,
        rawText: true, // ✅ Captura todo el texto
    })
    public mensaje!: string;
}

export class SayCommand extends SayDefinition {
    async run(): Promise<void> {
        await this.send(this.mensaje);
    }
}
```

**Uso:**

```
Usuario: !say Hola mundo, este es un mensaje largo sin comillas
Bot: Hola mundo, este es un mensaje largo sin comillas
```

#### 🔀 Ejemplo Avanzado: Combinando Argumentos

Puedes tener argumentos normales **antes** del `rawText`:

```typescript
@Command({
    name: 'announce',
    description: 'Anuncia un mensaje en un canal',
})
export abstract class AnnounceDefinition extends BaseCommand {
    @Arg({
        name: 'canal',
        description: 'Canal donde anunciar',
        index: 0,
        required: true,
    })
    public canal!: Channel;

    @Arg({
        name: 'mensaje',
        description: 'El mensaje a anunciar',
        index: 1,
        required: true,
        rawText: true, // ✅ Captura todo después del canal
    })
    public mensaje!: string;
}

export class AnnounceCommand extends AnnounceDefinition {
    async run(): Promise<void> {
        const textChannel = this.canal as TextChannel;
        await textChannel.send(this.mensaje);
        await this.reply('✅ Anuncio enviado');
    }
}
```

**Uso Text Command:**

```
Usuario: !announce #general Este es el anuncio completo sin comillas
# El canal es: #general
# El mensaje es: "Este es el anuncio completo sin comillas"
```

**Uso Slash Command:**

```
/announce canal:#general mensaje:Este es el mensaje
# Funciona como argumento normal separado
```

#### ⚙️ Reglas Importantes

1. **Solo para Text Commands**: `rawText` solo afecta comandos de texto (`!comando`), no slash commands
2. **Posición**: El argumento con `rawText` debe ser el **último** o después de todos los argumentos fijos
3. **Argumentos previos**: Se omiten correctamente del texto capturado
4. **Sin comillas necesarias**: El usuario NO necesita usar comillas, todo el texto se captura automáticamente

#### ❌ Casos de Uso Incorrectos

```typescript
// ❌ MAL: rawText no debe estar en el medio
@Arg({ name: 'texto', index: 0, rawText: true })
public texto!: string;

@Arg({ name: 'numero', index: 1 }) // Este nunca recibirá valor
public numero!: number;

// ✅ BIEN: rawText al final
@Arg({ name: 'numero', index: 0 })
public numero!: number;

@Arg({ name: 'texto', index: 1, rawText: true })
public texto!: string;
```

#### 🎯 Ejemplo Completo: Comando Set Status

```typescript
@Command({
    name: 'setstatus',
    description: 'Cambia el estado del bot',
    aliases: ['status'],
})
export abstract class SetStatusDefinition extends BaseCommand {
    @Arg({
        name: 'tipo',
        description: 'Tipo de actividad (playing, watching, listening)',
        index: 0,
        required: true,
        validate: (val: string) => {
            const valid = ['playing', 'watching', 'listening', 'competing'];
            if (!valid.includes(val.toLowerCase())) {
                return `Tipo inválido. Usa: ${valid.join(', ')}`;
            }
            return true;
        },
    })
    public tipo!: string;

    @Arg({
        name: 'texto',
        description: 'El texto del estado',
        index: 1,
        required: true,
        rawText: true, // ✅ Todo el texto después del tipo
    })
    public texto!: string;
}

export class SetStatusCommand extends SetStatusDefinition {
    async run(): Promise<void> {
        const activityType = this.tipo.toLowerCase();

        await this.ctx.client.user?.setActivity(this.texto, {
            type:
                activityType === 'playing'
                    ? 0
                    : activityType === 'watching'
                      ? 3
                      : activityType === 'listening'
                        ? 2
                        : 5,
        });

        await this.reply(`✅ Estado cambiado: ${this.tipo} ${this.texto}`);
    }
}
```

**Uso:**

```
Usuario: !setstatus playing Minecraft con los usuarios
Bot: ✅ Estado cambiado: playing Minecraft con los usuarios

Usuario: !setstatus watching videos en YouTube y aprendiendo código
Bot: ✅ Estado cambiado: watching videos en YouTube y aprendiendo código
```

---

### 🎛️ Options (Opciones Predefinidas / Choices)

La propiedad `options` permite definir un conjunto fijo de valores que el usuario puede elegir. En **slash commands**, se convierten automáticamente en el sistema de **choices** de Discord.

#### 📚 Interfaz

```typescript
interface IArgumentOption {
    label: string; // Texto mostrado al usuario
    value: string | number; // Valor real usado en el código
}
```

#### ✅ Cuándo usar `options`

- Comandos con valores predefinidos (idiomas, modos, tipos)
- Prevenir valores inválidos
- Mejorar UX con autocompletado en slash commands
- Validación automática de valores (tanto text como slash commands)

#### 🔧 Comportamiento

**Text Commands (`!comando`):**

- ✅ Valida que el valor ingresado coincida con uno de los `value` definidos
- ✅ Lanza `ValidationError` si el valor no es válido
- ✅ Case-sensitive por defecto

**Slash Commands (`/comando`):**

- ✅ Se convierte automáticamente en **choices** de Discord
- ✅ El usuario ve un dropdown con las opciones
- ✅ Discord previene valores inválidos automáticamente
- ✅ Muestra `label` al usuario pero envía `value` al bot

#### 📖 Ejemplo Básico: Comando Language

```typescript
@Command({
    name: 'language',
    description: 'Cambia el idioma del bot',
    aliases: ['lang', 'idioma'],
})
export abstract class LanguageDefinition extends BaseCommand {
    @Arg({
        name: 'idioma',
        description: 'El idioma a usar',
        index: 0,
        required: true,
        options: [
            { label: 'Español', value: 'es' },
            { label: 'English', value: 'en' },
            { label: 'Português', value: 'pt' },
            { label: 'Français', value: 'fr' },
        ],
    })
    public idioma!: string;
}

export class LanguageCommand extends LanguageDefinition {
    async run(): Promise<void> {
        // idioma será 'es', 'en', 'pt', o 'fr'
        await this.reply(`✅ Idioma cambiado a: ${this.idioma}`);
    }
}
```

**Uso Text Command:**

```
Usuario: !language es
Bot: ✅ Idioma cambiado a: es

Usuario: !language español
Bot: ❌ Valor inválido para idioma. Valores permitidos: es, en, pt, fr

Usuario: !language EN
Bot: ❌ Valor inválido para idioma. Valores permitidos: es, en, pt, fr
```

**Uso Slash Command:**

```
/language idioma:[Dropdown aparece con: Español, English, Português, Français]
# Usuario selecciona "Español"
# El bot recibe: idioma = "es"
```

#### 🎮 Ejemplo con Valores Numéricos: Set Status

```typescript
@Command({
    name: 'setstatus',
    description: 'Cambia el estado del bot',
})
export abstract class SetStatusDefinition extends BaseCommand {
    @Arg({
        name: 'tipo',
        description: 'Tipo de actividad',
        index: 0,
        required: true,
        options: [
            { label: 'Jugando', value: 0 }, // ActivityType.Playing
            { label: 'Viendo', value: 3 }, // ActivityType.Watching
            { label: 'Escuchando', value: 2 }, // ActivityType.Listening
            { label: 'Compitiendo', value: 5 }, // ActivityType.Competing
        ],
    })
    public tipo!: number;

    @Arg({
        name: 'texto',
        description: 'El texto del estado',
        index: 1,
        required: true,
    })
    public texto!: string;
}

export class SetStatusCommand extends SetStatusDefinition {
    async run(): Promise<void> {
        await this.ctx.client.user?.setActivity(this.texto, {
            type: this.tipo, // Ya es un número válido de ActivityType
        });

        const tipoTexto =
            ['Jugando', '', '', 'Viendo', '', 'Compitiendo'][this.tipo] || 'Escuchando';
        await this.reply(`✅ Estado cambiado: ${tipoTexto} ${this.texto}`);
    }
}
```

**Uso Text Command:**

```
Usuario: !setstatus 0 Minecraft
Bot: ✅ Estado cambiado: Jugando Minecraft

Usuario: !setstatus 3 YouTube
Bot: ✅ Estado cambiado: Viendo YouTube

Usuario: !setstatus 7 algo
Bot: ❌ Valor inválido para tipo. Valores permitidos: 0, 3, 2, 5

Usuario: !setstatus jugando Minecraft
Bot: ❌ Valor inválido para tipo. Valores permitidos: 0, 3, 2, 5
```

**Uso Slash Command:**

```
/setstatus tipo:[Dropdown: Jugando, Viendo, Escuchando, Compitiendo] texto:Minecraft
# Usuario selecciona "Jugando"
# El bot recibe: tipo = 0
```

#### 🔀 Ejemplo Avanzado: Configuración de Servidor

```typescript
@Command({
    name: 'config',
    description: 'Configura el servidor',
})
export abstract class ConfigDefinition extends BaseCommand {
    @Arg({
        name: 'opcion',
        description: 'La opción a configurar',
        index: 0,
        required: true,
        options: [
            { label: 'Nivel de Moderación', value: 'moderation_level' },
            { label: 'Canal de Logs', value: 'log_channel' },
            { label: 'Prefijo', value: 'prefix' },
            { label: 'Idioma', value: 'language' },
        ],
    })
    public opcion!: string;

    @Arg({
        name: 'valor',
        description: 'El nuevo valor',
        index: 1,
        required: true,
    })
    public valor!: string;
}

export class ConfigCommand extends ConfigDefinition {
    async run(): Promise<void> {
        // opcion será uno de los valores predefinidos
        switch (this.opcion) {
            case 'moderation_level':
                // Actualizar nivel de moderación
                break;
            case 'log_channel':
                // Configurar canal de logs
                break;
            case 'prefix':
                // Cambiar prefijo
                break;
            case 'language':
                // Cambiar idioma
                break;
        }

        await this.reply(`✅ Configuración actualizada: ${this.opcion} = ${this.valor}`);
    }
}
```

#### 🎯 Options vs Validation

| Característica       | `options`                         | `validate`                     |
| -------------------- | --------------------------------- | ------------------------------ |
| **Propósito**        | Valores predefinidos fijos        | Validación personalizada       |
| **Slash Commands**   | ✅ Convierte a choices (dropdown) | ❌ No afecta                   |
| **Text Commands**    | ✅ Valida automáticamente         | ✅ Valida con función custom   |
| **Error automático** | ✅ Sí                             | ✅ Sí (si retorna string)      |
| **Cuándo usar**      | Lista fija conocida               | Lógica compleja, regex, rangos |

**Ejemplo combinando ambos:**

```typescript
@Arg({
    name: 'modo',
    description: 'Modo de juego',
    index: 0,
    required: true,
    options: [
        { label: 'Normal', value: 'normal' },
        { label: 'Hardcore', value: 'hardcore' },
        { label: 'Creativo', value: 'creative' },
    ],
    validate: (val: string) => {
        // Validación adicional (ejemplo: verificar permisos)
        if (val === 'hardcore' && !tienePermisoAdmin) {
            return 'No tienes permisos para usar el modo hardcore';
        }
        return true;
    },
})
public modo!: string;
```

#### ⚙️ Reglas Importantes

1. **Validación Estricta**: El valor debe coincidir **exactamente** con uno de los `value` definidos
2. **Case Sensitive**: Por defecto es sensible a mayúsculas/minúsculas
3. **Tipo Compatible**: El tipo del argumento debe coincidir con el tipo de los `value` (string o number)
4. **Slash Commands**: Se convierten automáticamente a choices de Discord
5. **Text Commands**: Se validan en `ArgumentResolver` antes de ejecutar el comando

#### ❌ Casos de Uso Incorrectos

```typescript
// ❌ MAL: Tipo string pero values numéricos
@Arg({
    name: 'nivel',
    options: [
        { label: 'Bajo', value: 1 },
        { label: 'Alto', value: 2 },
    ],
})
public nivel!: string; // Debería ser number

// ❌ MAL: Values inconsistentes
@Arg({
    name: 'modo',
    options: [
        { label: 'Opción 1', value: 'valor1' },
        { label: 'Opción 2', value: 2 }, // ❌ Mezcla string y number
    ],
})
public modo!: string;

// ✅ BIEN: Tipo y values coinciden
@Arg({
    name: 'nivel',
    options: [
        { label: 'Bajo', value: 1 },
        { label: 'Alto', value: 2 },
    ],
})
public nivel!: number;

// ✅ BIEN: Todos los values son string
@Arg({
    name: 'modo',
    options: [
        { label: 'Opción 1', value: 'valor1' },
        { label: 'Opción 2', value: 'valor2' },
    ],
})
public modo!: string;
```

#### 🎨 Mejores Prácticas

1. **Labels Descriptivos**: Usa texto claro y comprensible para los usuarios
2. **Values Concisos**: Usa identificadores cortos y consistentes para tu código
3. **Orden Lógico**: Ordena las opciones de más común a menos común
4. **Documentación**: Comenta por qué se eligieron esos valores específicos
5. **Constantes**: Considera usar enums o constantes para los values

```typescript
// ✅ EXCELENTE: Usando enums
enum GameMode {
    Normal = 'normal',
    Hardcore = 'hardcore',
    Creative = 'creative',
}

@Arg({
    name: 'modo',
    description: 'Modo de juego',
    index: 0,
    required: true,
    options: [
        { label: 'Normal', value: GameMode.Normal },
        { label: 'Hardcore', value: GameMode.Hardcore },
        { label: 'Creativo', value: GameMode.Creative },
    ],
})
public modo!: string;
```

#### 🔧 Comportamiento

**Slash Commands:**

- ✅ Aparecen como menú desplegable (choices)
- ✅ El usuario solo puede elegir una opción
- ✅ No puede escribir valores personalizados

**Text Commands:**

- ✅ El usuario escribe el `value` de la opción
- ✅ Se valida automáticamente contra las opciones
- ✅ Error si el valor no coincide

#### 📖 Estructura

```typescript
options: [
    { label: 'Texto mostrado', value: 'valor_real' },
    { label: 'Otra opción', value: 123 },
];
```

- **`label`**: Texto que ve el usuario (en slash commands)
- **`value`**: Valor real que recibe el comando (string o number)

#### 📝 Ejemplo Básico: Idioma

```typescript
@Command({
    name: 'language',
    description: 'Cambia el idioma del bot',
})
export abstract class LanguageDefinition extends BaseCommand {
    @Arg({
        name: 'idioma',
        description: 'Idioma a configurar',
        index: 0,
        required: true,
        options: [
            { label: 'Español', value: 'es' },
            { label: 'English', value: 'en' },
            { label: 'Português', value: 'pt' },
            { label: 'Français', value: 'fr' },
        ],
    })
    public idioma!: string;
}

export class LanguageCommand extends LanguageDefinition {
    async run(): Promise<void> {
        // this.idioma será: 'es', 'en', 'pt' o 'fr'
        await this.reply(`Idioma cambiado a: ${this.idioma}`);
    }
}
```

**Uso:**

```
Slash Command:
/language idioma:[menú con Español, English, Português, Français]

Text Command:
!language es      ✅ Válido
!language en      ✅ Válido
!language de      ❌ Error: debe ser es, en, pt o fr
```

#### 📝 Ejemplo Avanzado: SetStatus con Options

```typescript
@Command({
    name: 'setstatus',
    description: 'Cambia el estado del bot',
})
export abstract class SetStatusDefinition extends BaseCommand {
    @Arg({
        name: 'tipo',
        description: 'Tipo de actividad',
        index: 0,
        required: true,
        options: [
            { label: 'Jugando', value: 'playing' },
            { label: 'Viendo', value: 'watching' },
            { label: 'Escuchando', value: 'listening' },
            { label: 'Compitiendo', value: 'competing' },
            { label: 'Transmitiendo', value: 'streaming' },
        ],
    })
    public tipo!: string;

    @Arg({
        name: 'texto',
        description: 'El texto del estado',
        index: 1,
        required: true,
        rawText: true, // Combinar options + rawText
    })
    public texto!: string;
}

export class SetStatusCommand extends SetStatusDefinition {
    async run(): Promise<void> {
        const activityMap = {
            playing: 0,
            watching: 3,
            listening: 2,
            competing: 5,
            streaming: 1,
        };

        await this.ctx.client.user?.setActivity(this.texto, {
            type: activityMap[this.tipo as keyof typeof activityMap],
        });

        await this.reply(`✅ Estado: ${this.tipo} ${this.texto}`);
    }
}
```

**Uso:**

```
Slash Command:
/setstatus tipo:[menú desplegable] texto:Minecraft en el servidor

Text Command:
!setstatus playing Minecraft en el servidor    ✅ Válido
!setstatus coding TypeScript y Discord.js     ❌ Error: tipo inválido
```

#### 📝 Ejemplo con Números: Nivel de Dificultad

```typescript
@Command({
    name: 'setdifficulty',
    description: 'Cambia la dificultad del juego',
})
export abstract class SetDifficultyDefinition extends BaseCommand {
    @Arg({
        name: 'nivel',
        description: 'Nivel de dificultad',
        index: 0,
        required: true,
        options: [
            { label: 'Fácil', value: 1 },
            { label: 'Normal', value: 2 },
            { label: 'Difícil', value: 3 },
            { label: 'Extremo', value: 4 },
        ],
    })
    public nivel!: number; // Recibe 1, 2, 3 o 4
}

export class SetDifficultyCommand extends SetDifficultyDefinition {
    async run(): Promise<void> {
        // this.nivel es un número (1-4)
        const labels = ['', 'Fácil', 'Normal', 'Difícil', 'Extremo'];
        await this.reply(`Dificultad cambiada a: ${labels[this.nivel]}`);
    }
}
```

**Uso:**

```
Slash Command:
/setdifficulty nivel:[Fácil, Normal, Difícil, Extremo]

Text Command:
!setdifficulty 1    ✅ Válido (Fácil)
!setdifficulty 4    ✅ Válido (Extremo)
!setdifficulty 5    ❌ Error: debe ser 1, 2, 3 o 4
```

#### ⚙️ Validación Automática

El sistema valida automáticamente que el valor sea una de las opciones:

```typescript
@Arg({
    name: 'modo',
    options: [
        { label: 'PvP', value: 'pvp' },
        { label: 'PvE', value: 'pve' },
    ],
})
public modo!: string;

// Text command: !comando survival
// ❌ Error: El valor de `modo` debe ser una de las opciones válidas:
//    `PvP` (pvp), `PvE` (pve)
```

#### 🎨 Combinando con Otras Propiedades

```typescript
@Arg({
    name: 'tipo',
    description: 'Tipo de recompensa',
    index: 0,
    required: true,
    options: [
        { label: 'Monedas', value: 'coins' },
        { label: 'Experiencia', value: 'xp' },
        { label: 'Objetos', value: 'items' },
    ],
    validate: (val: string) => {
        // Validación adicional después de verificar opciones
        if (val === 'items' && !hasInventorySpace()) {
            return 'No tienes espacio en el inventario';
        }
        return true;
    },
})
public tipo!: string;
```

#### ❌ Casos de Uso Incorrectos

```typescript
// ❌ MAL: options con rawText
@Arg({
    name: 'texto',
    rawText: true,
    options: [...], // No tiene sentido
})

// ❌ MAL: options con parser personalizado
@Arg({
    name: 'jugador',
    parser: (val) => new MinecraftPlayer(val),
    options: [...], // Los parsers manejan su propia lógica
})

// ✅ BIEN: options simple
@Arg({
    name: 'modo',
    options: [
        { label: 'Fácil', value: 'easy' },
        { label: 'Difícil', value: 'hard' },
    ],
})
```

#### 🔍 Características

| Característica            | Slash Commands            | Text Commands                          |
| ------------------------- | ------------------------- | -------------------------------------- |
| **UI**                    | ✅ Menú desplegable       | ❌ Usuario escribe el value            |
| **Validación**            | ✅ Automática por Discord | ✅ Automática por ArgumentResolver     |
| **Autocompletado**        | ✅ Sí                     | ❌ No                                  |
| **Prevención de errores** | ✅ No puede escribir mal  | ⚠️ Puede escribir mal (pero se valida) |
| **Mensaje de error**      | ❌ No aplica              | ✅ Lista de opciones válidas           |

---

### Ejemplo Completo

```typescript
import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { User } from 'discord.js';

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
            if (!Number.isInteger(value)) return 'Debe ser entero';
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

    @Arg({
        name: 'nota',
        description: 'Nota opcional',
        index: 2,
        required: false,
    })
    public nota?: string;
}
```

---

## 🔌 Decorador @UsePlugins

Define plugins específicos que se ejecutan para un comando en **ambas fases del ciclo de vida**: registro y ejecución.

### Ubicación

```typescript
// src/core/decorators/plugin.decorator.ts
```

### Uso

```typescript
import { Command } from '@/core/decorators/command.decorator';
import { UsePlugins } from '@/core/decorators/plugin.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { CooldownPlugin } from '@/plugins/cooldown.plugin';
import { RolePermissionPlugin } from '@/plugins/role-permission.plugin';

@Command({
    name: 'ban',
    description: 'Banea un usuario',
})
@UsePlugins(CooldownPlugin, RolePermissionPlugin)
export class BanCommand extends BaseCommand {
    async run(): Promise<void> {
        // Lógica del comando
    }
}
```

### Metadata Key

```typescript
export const PLUGIN_METADATA_KEY = Symbol('commandPlugins');
```

### Ciclo de Vida Completo

Los plugins decorados con `@UsePlugins` participan en **dos fases**:

#### 🟦 Fase de Registro (Al iniciar el bot)

**onBeforeRegisterCommand** (orden normal):

```
1. CooldownPlugin.onBeforeRegisterCommand()
2. RolePermissionPlugin.onBeforeRegisterCommand()
3. Discord API registra el comando (si no fue cancelado)
```

**onAfterRegisterCommand** (orden normal):

```
4. CooldownPlugin.onAfterRegisterCommand()
5. RolePermissionPlugin.onAfterRegisterCommand()
```

#### 🔵🟢 Fase de Ejecución (Cuando un usuario ejecuta el comando)

**onBeforeExecute** (orden normal):

```
1. CooldownPlugin.onBeforeExecute()
2. RolePermissionPlugin.onBeforeExecute()
3. BanCommand.run()
```

**onAfterExecute** (orden INVERSO):

```
4. RolePermissionPlugin.onAfterExecute()
5. CooldownPlugin.onAfterExecute()
```

### Prioridad

`@UsePlugins` tiene **máxima prioridad** en ambas fases:

1. ✅ Primero se ejecutan plugins de `@UsePlugins`
2. ✅ Luego se ejecutan plugins de scope (registry)

```typescript
// En /src/config/plugins.config.ts
PluginRegistry.register({
    plugin: new LoggerPlugin(),     // [A]
    scope: PluginScope.DeepFolder,
    folderPath: '',
});

// En el comando
@UsePlugins(CooldownPlugin)         // [B]
export class MyCommand extends BaseCommand {
    async run() { ... }
}
```

**Orden en Registro:**

```
1. CooldownPlugin.onBeforeRegisterCommand() (B - decorador)
2. LoggerPlugin.onBeforeRegisterCommand() (A - scope)
3. Discord API registra
4. CooldownPlugin.onAfterRegisterCommand() (B - decorador)
5. LoggerPlugin.onAfterRegisterCommand() (A - scope)
```

**Orden en Ejecución:**

```
1. CooldownPlugin.onBeforeExecute() (B - decorador)
2. LoggerPlugin.onBeforeExecute() (A - scope)
3. MyCommand.run()
4. LoggerPlugin.onAfterExecute() (inverso)
5. CooldownPlugin.onAfterExecute() (inverso)
```

### Ejemplo Completo

```typescript
import { Command } from '@/core/decorators/command.decorator';
import { Arg } from '@/core/decorators/argument.decorator';
import { UsePlugins } from '@/core/decorators/plugin.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { User } from 'discord.js';

// Importar plugins
import { CooldownPlugin } from '@/plugins/cooldown.plugin';
import { RolePermissionPlugin } from '@/plugins/role-permission.plugin';
import { AuditLogPlugin } from '@/plugins/audit-log.plugin';

@Command({
    name: 'ban',
    description: 'Banea un usuario del servidor',
    aliases: ['banear'],
})
@UsePlugins(CooldownPlugin, RolePermissionPlugin, AuditLogPlugin)
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
        rawText: true,
    })
    public razon?: string;

    async run(): Promise<void> {
        // Los 3 plugins ya validaron antes de llegar aquí
        await this.usuario.ban({ reason: this.razon || 'No especificada' });

        const embed = this.getEmbed('success')
            .setTitle('✅ Usuario Baneado')
            .setDescription(`${this.usuario.tag} ha sido baneado`)
            .addFields({ name: 'Razón', value: this.razon || 'No especificada' });

        await this.reply({ embeds: [embed] });
        // Los 3 plugins se ejecutan en orden inverso después de esto
    }
}
```

### Diferencia con Scope

| Característica   | `@UsePlugins` (Decorador)    | Scope (Registry)                |
| ---------------- | ---------------------------- | ------------------------------- |
| **Ubicación**    | En cada comando              | `/src/config/plugins.config.ts` |
| **Alcance**      | Solo el comando decorado     | Múltiples comandos              |
| **Prioridad**    | ✅ Primera (máxima)          | Segunda                         |
| **Centralizado** | ❌ No                        | ✅ Sí                           |
| **Ciclo**        | Registro + Ejecución         | Registro + Ejecución            |
| **Cuándo usar**  | Plugins únicos de un comando | Plugins comunes/globales        |

---

---

## 🔒 Decorador @RequirePermissions

Define permisos requeridos para ejecutar un comando. Se aplica **solo a clases**.

### Ubicación

```typescript
// src/core/decorators/permission.decorator.ts
```

### Uso

```typescript
import { Command } from '@/core/decorators/command.decorator';
import { RequirePermissions } from '@/core/decorators/permission.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { Permissions } from '@/utils/Permissions';

@Command({
    name: 'ban',
    description: 'Banea un usuario del servidor',
})
@RequirePermissions(Permissions.BanMembers, Permissions.ModerateMembers)
export class BanCommand extends BaseCommand {
    async run(): Promise<void> {
        // El usuario ya fue validado que tiene permisos
        // ...
    }
}
```

### Metadata Key

```typescript
export const REQUIRE_PERMISSIONS_METADATA_KEY = Symbol('REQUIRE_PERMISSIONS_METADATA_KEY');
```

### Funcionamiento

El decorador `@RequirePermissions` trabaja en conjunto con el **PermissionsPlugin** para:

1. **Fase de Registro** (`onBeforeRegisterCommand`):
    - Modifica el JSON del comando antes de enviarlo a Discord
    - Agrega el campo `default_member_permissions` con los permisos requeridos
    - Discord automáticamente oculta el comando a usuarios sin permisos

2. **Fase de Ejecución** (`onBeforeExecute`):
    - Valida que el usuario tenga los permisos necesarios
    - Si no tiene permisos, muestra un embed de error y cancela la ejecución
    - Si tiene permisos, continúa con la ejecución normal

### Características

✅ **Validación en Discord**: Los comandos solo aparecen para usuarios con permisos suficientes
✅ **Validación en ejecución**: Doble verificación por seguridad
✅ **Múltiples permisos**: Puedes requerir varios permisos al mismo tiempo
✅ **Bitwise OR**: Los permisos se combinan automáticamente con operador OR
✅ **Embed de error**: Mensaje visual cuando un usuario no tiene permisos

### Permisos Disponibles

Todos los permisos de Discord están disponibles en `@/utils/Permissions`:

```typescript
import { Permissions } from '@/utils/Permissions';

// Ejemplos comunes
Permissions.Administrator;
Permissions.ManageGuild;
Permissions.ManageRoles;
Permissions.ManageChannels;
Permissions.KickMembers;
Permissions.BanMembers;
Permissions.ModerateMembers;
Permissions.ManageMessages;
Permissions.ManageNicknames;
Permissions.ViewChannel;
Permissions.SendMessages;
Permissions.AttachFiles;
Permissions.MentionEveryone;
// ... y muchos más
```

### Ejemplos

#### Ejemplo 1: Comando de Moderación

```typescript
@Command({
    name: 'kick',
    description: 'Expulsa un usuario del servidor',
})
@RequirePermissions(Permissions.KickMembers)
export class KickCommand extends BaseCommand {
    @Arg({
        name: 'usuario',
        description: 'Usuario a expulsar',
        index: 0,
        required: true,
    })
    public usuario!: User;

    async run(): Promise<void> {
        const member = await this.guild!.members.fetch(this.usuario.id);
        await member.kick();

        const embed = this.getEmbed('success')
            .setTitle('✅ Usuario Expulsado')
            .setDescription(`${this.usuario.tag} ha sido expulsado del servidor`);

        await this.reply({ embeds: [embed] });
    }
}
```

#### Ejemplo 2: Múltiples Permisos

```typescript
@Command({
    name: 'lockdown',
    description: 'Bloquea todos los canales del servidor',
})
@RequirePermissions(Permissions.ManageChannels, Permissions.ManageRoles, Permissions.Administrator)
export class LockdownCommand extends BaseCommand {
    async run(): Promise<void> {
        // Solo administradores con permisos de gestión de canales y roles pueden usar esto
        // ...
    }
}
```

#### Ejemplo 3: Comando Administrativo

```typescript
@Command({
    name: 'setup',
    description: 'Configura el bot en el servidor',
})
@RequirePermissions(Permissions.Administrator)
export class SetupCommand extends BaseCommand {
    async run(): Promise<void> {
        // Solo administradores pueden usar esto
        // ...
    }
}
```

### Configuración Requerida

Para que funcione, debes registrar el **PermissionsPlugin** en `/src/config/plugins.config.ts`:

```typescript
import { PluginRegistry, PluginScope } from './plugin.registry';
import { PermissionsPlugin } from '@/plugins/permissions.plugin';

// Aplicar a todos los comandos
PluginRegistry.register({
    plugin: new PermissionsPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: '', // Todos los comandos
});
```

### Ventajas

| Característica            | Beneficio                                                |
| ------------------------- | -------------------------------------------------------- |
| **Validación en Discord** | Los comandos no aparecen si el usuario no tiene permisos |
| **Validación doble**      | Por seguridad, también valida en ejecución               |
| **Embeds visuales**       | Mensajes claros cuando no hay permisos                   |
| **Type-safe**             | Autocompletado de permisos con TypeScript                |
| **Flexible**              | Aplica a comandos individuales o grupos                  |
| **Sin boilerplate**       | No necesitas validar manualmente en cada comando         |

### Diferencia con @UsePlugins

| Característica    | `@RequirePermissions`        | `@UsePlugins(PermissionsPlugin)` |
| ----------------- | ---------------------------- | -------------------------------- |
| **Propósito**     | Declarar permisos requeridos | Aplicar plugin específico        |
| **Metadata**      | Sí (permisos)                | No                               |
| **Simplicidad**   | ✅ Más simple                | Más verboso                      |
| **Configuración** | Plugin en registry           | Plugin en decorador              |
| **Uso típico**    | Permisos de Discord          | Plugins custom                   |

---

## 🔧 Internals: reflect-metadata

Ambos decoradores usan la librería `reflect-metadata` para almacenar y recuperar metadatos en runtime.

### ¿Qué es reflect-metadata?

Es una librería que permite agregar metadatos arbitrarios a clases, métodos y propiedades:

```typescript
import 'reflect-metadata';

// Definir metadata
Reflect.defineMetadata('myKey', { data: 'value' }, target);

// Obtener metadata
const meta = Reflect.getMetadata('myKey', target);
```

### Metadata Keys Usados

```typescript
// Metadata del comando
COMMAND_METADATA_KEY = Symbol('commandMetadata');

// Metadata de argumentos
ARGUMENT_METADATA_KEY = Symbol('commandArguments');

// Metadata de plugins
PLUGIN_METADATA_KEY = Symbol('commandPlugins');

// Metadata de permisos
REQUIRE_PERMISSIONS_METADATA_KEY = Symbol('REQUIRE_PERMISSIONS_METADATA_KEY');

// Metadata de tipos de diseño (automático de TypeScript)
('design:type');
```

### Flujo de Metadata

```
Definición con Decoradores
         ↓
   @Command(...) → Reflect.defineMetadata(COMMAND_METADATA_KEY, ...)
   @Arg(...) → Reflect.defineMetadata(ARGUMENT_METADATA_KEY, ...)
   @UsePlugins(...) → Reflect.defineMetadata(PLUGIN_METADATA_KEY, ...)
   @RequirePermissions(...) → Reflect.defineMetadata(REQUIRE_PERMISSIONS_METADATA_KEY, ...)
         ↓
   CommandLoader lee metadata
         ↓
   Reflect.getMetadata(COMMAND_METADATA_KEY, ...)
   Reflect.getMetadata(ARGUMENT_METADATA_KEY, ...)
         ↓
   Plugins leen metadata
         ↓
   Reflect.getMetadata(PLUGIN_METADATA_KEY, ...)
   Reflect.getMetadata(REQUIRE_PERMISSIONS_METADATA_KEY, ...)
         ↓
   Sistema usa la información
```

## ⚙️ Configuración de TypeScript

Para que los decoradores funcionen, necesitas estas opciones en `tsconfig.json`:

```json
{
    "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
    }
}
```

- **experimentalDecorators**: Habilita el uso de decoradores
- **emitDecoratorMetadata**: Emite metadata de tipos de diseño

## 📚 Recursos Relacionados

### Documentación Interna

- [`/src/commands/README.md`](../../commands/README.md) - Patrones de implementación de comandos
- [`/src/definition/`](../../definition/README.md) - Uso de los decoradores en definiciones
- [`/src/core/loaders/command.loader.ts`](../loaders/command.loader.ts) - Carga metadata de comandos
- [`/src/core/loaders/slash-command.loader.ts`](../loaders/slash-command.loader.ts) - Registra en Discord
- [`/src/core/resolvers/argument.resolver.ts`](../resolvers/argument.resolver.ts) - Resuelve argumentos
- [`/src/core/handlers/command.handler.ts`](../handlers/command.handler.ts) - Ejecuta comandos con plugins
- [`/src/plugins/README.md`](../../plugins/README.md) - Sistema de plugins

### Guías de Comandos

- 📄 [**Guía de Subcomandos**](../../../docs/Subcommands.README.md) - Comandos de 2 niveles
- 📄 [**Guía de Grupos de Subcomandos**](../../../docs/SubcommandGroups.README.md) - Comandos de 3 niveles

### Recursos Externos

- [reflect-metadata](https://github.com/rbuckton/reflect-metadata) - Librería de metadata
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) - Documentación oficial
