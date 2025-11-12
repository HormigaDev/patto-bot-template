# Carpeta: Commands

## 📖 Descripción

Esta carpeta contiene las **implementaciones** de los comandos del bot. Cada archivo representa la lógica de ejecución de un comando específico.

## Tipos de Comandos

Este template soporta tres niveles de comandos:

### 1. **Comandos Base** (`@Command`)

Comandos simples de un solo nivel: `/ping`, `/help`

### 2. **Subcomandos** (`@Subcommand`)

Comandos de 2 niveles para agrupar funcionalidades relacionadas: `/config get`, `/config set`

> **� No necesitas crear un comando base**: El sistema crea automáticamente el comando padre en Discord.

�📚 **[Ver guía completa de Subcomandos →](../../docs/Subcommands.README.md)**

### 3. **Grupos de Subcomandos** (`@SubcommandGroup`)

Comandos de 3 niveles para sistemas complejos: `/server config get`, `/server user info`

> **💡 No necesitas crear un comando base**: El sistema crea automáticamente el comando padre en Discord.

📚 **[Ver guía completa de Grupos de Subcomandos →](../../docs/SubcommandGroups.README.md)**

---

## 📁 Organización de Archivos

### Estructura Recomendada

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

### Mejores Prácticas

✅ **Comandos base**: Guarda en carpetas por categoría (`info/`, `moderation/`, etc.)  
✅ **Subcomandos**: Crea carpeta con el nombre del padre (`config/`) - **SIN archivo base**  
✅ **Grupos**: Crea carpeta padre + subcarpetas por grupo (`server/config/`) - **SIN archivo base**  
✅ **Nomenclatura**: Usa nombres descriptivos: `get.command.ts`, `set.command.ts`  
✅ **Un archivo por comando**: Cada archivo debe exportar un solo comando  
✅ **Sin overhead**: No crees archivos padre vacíos (`config.command.ts`, `server.command.ts`)

❌ **Evita**: Mezclar comandos no relacionados en la misma carpeta  
❌ **Evita**: Nombres genéricos como `command1.ts`, `test.ts`  
❌ **Evita**: Anidación excesiva (más de 3 niveles de carpetas)  
❌ **Evita**: Crear archivos base solo como contenedores (el sistema lo hace automáticamente)

---

## 🎨 Patrones de Implementación

Existen **dos patrones válidos** para crear comandos, según su complejidad:

### 🔹 Patrón 1: Comando Monolítico (Simple)

Para comandos **sin argumentos** o muy simples, puedes crear todo en un solo archivo:

```typescript
// src/commands/ping.command.ts
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@Command({
    name: 'ping',
    description: 'Verifica la latencia del bot',
    aliases: ['latencia', 'pong'],
})
export class PingCommand extends BaseCommand {
    async run(): Promise<void> {
        await this.reply(`🏓 Pong! Latencia: ${this.ctx.client.ws.ping}ms`);
    }
}
```

**Ventajas:**

- ✅ Menos archivos
- ✅ Ideal para comandos simples
- ✅ Todo en un solo lugar

### 🔹 Patrón 2: Definición + Implementación (Complejo)

Para comandos **con argumentos** o lógica compleja, separa en dos archivos:

**Definición** (metadatos y argumentos):

```typescript
// src/definition/ban.definition.ts
import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { User } from 'discord.js';

@Command({
    name: 'ban',
    description: 'Banea a un usuario',
    aliases: ['expulsar'],
})
export abstract class BanDefinition extends BaseCommand {
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
}
```

**Implementación** (lógica):

```typescript
// src/commands/ban.command.ts
import { BanDefinition } from '@/definition/ban.definition';

export class BanCommand extends BanDefinition {
    async run(): Promise<void> {
        // Lógica compleja aquí
        await this.usuario.ban({ reason: this.razon });
        await this.reply(`Usuario ${this.usuario} baneado exitosamente.`);
    }
}
```

**Ventajas:**

- ✅ Separación de responsabilidades
- ✅ Más fácil de testear
- ✅ Metadatos reutilizables
- ✅ Código más limpio

## 🎯 ¿Cuándo Usar Cada Patrón?

| Característica         | Monolítico        | Definición + Implementación |
| ---------------------- | ----------------- | --------------------------- |
| Sin argumentos         | ✅ Recomendado    | ❌ Innecesario              |
| 1-2 argumentos simples | ✅ Opcional       | ✅ Opcional                 |
| 3+ argumentos          | ❌ No recomendado | ✅ Recomendado              |
| Validación compleja    | ❌ No recomendado | ✅ Recomendado              |
| Lógica muy compleja    | ❌ No recomendado | ✅ Recomendado              |
| Comando rápido/demo    | ✅ Recomendado    | ❌ Sobrecarga               |

## 📦 Propiedades Disponibles

Dentro del método `run()`, tienes acceso a:

### Contexto del Comando

```typescript
this.ctx; // CommandContext - Contexto completo del comando
this.user; // User - Usuario que ejecutó el comando
this.channel; // TextChannel | null - Canal donde se ejecutó
```

### Argumentos Definidos

```typescript
this.question; // Los argumentos que definiste con @Arg
this.targetUser; // Se mapean automáticamente según tu definición
// ...
```

### Métodos Heredados

```typescript
await this.reply(message); // Responde al usuario (reply)
await this.reply({ embeds }); // Responde con embeds

await this.send(message); // Envía mensaje al canal (sin reply)
await this.send({ embeds }); // Envía con embeds

await this.ctx.ephemeral(message); // Respuesta efímera (solo slash). Si lo ejecutas en un comando de texto se devuelve un mensaje de texto normal
```

### Métodos útiles

```typescript
this.getEmbed(type); // success, info, warning, error. Obtienes un embed con el color correspondiente preparado y el setTimestamp
```

## 🎯 Ejemplo Completo

```typescript
import { EmbedBuilder } from 'discord.js';
import { UserInfoDefinition } from '@/definition/user-info.definition';

export class UserInfoCommand extends UserInfoDefinition {
    public async run(): Promise<void> {
        // Acceder a argumentos
        const targetUser = this.targetUser || this.user;

        // Crear embed
        const embed = this.getEmbed('info')
            .setTitle(`Información de ${targetUser.username}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: 'ID', value: targetUser.id },
                { name: 'Tag', value: targetUser.tag },
                { name: 'Creado', value: targetUser.createdAt.toDateString() },
            );

        // Responder
        await this.reply({ embeds: [embed] });
    }
}
```

## 🚨 Manejo de Errores

### Errores de Usuario (ValidationError)

Son manejados automáticamente por el framework. Usa `ValidationError` para errores de validación:

```typescript
import { ValidationError } from '@/error/ValidationError';

if (this.amount < 0) {
    throw new ValidationError('El monto debe ser positivo');
}
```

### Errores de Respuesta (ReplyError)

Para errores que deben mostrarse al usuario con un embed de error:

```typescript
import { ReplyError } from '@/error/ReplyError';

if (!hasPermission) {
    throw new ReplyError('No tienes permisos para usar este comando');
}
```

### Otros Errores

Son capturados y mostrados como "error inesperado":

```typescript
// Este error mostrará un mensaje genérico al usuario
throw new Error('Error interno del servidor');
```

## ✅ Buenas Prácticas

1. **Separación de Concerns**: Define en `/definition/`, implementa aquí
2. **Nombres Descriptivos**: Usa nombres claros para tus comandos
3. **Validaciones Tempranas**: Valida inputs al inicio del `run()`
4. **Embeds para Respuestas**: Usa embeds para respuestas visualmente atractivas
5. **Manejo de Errores**: Usa `ReplyError` para errores esperados
6. **Async/Await**: Siempre usa `await` con operaciones asíncronas
7. **Comentarios**: Documenta lógica compleja

## 🔄 Carga Automática

Los comandos en esta carpeta son **cargados automáticamente** por el `CommandLoader`. No necesitas registrarlos manualmente.

El sistema:

1. Escanea todos los archivos `*.command.ts`
2. Lee los metadatos de los decoradores
3. Registra el comando automáticamente
4. Configura aliases si están definidos

---

## 🎯 Ejemplos Completos con `rawText`

### Ejemplo 1: Comando Say (Simple)

Replica un mensaje sin necesidad de comillas.

**Definición:**

```typescript
// src/definition/say.definition.ts
import { Command } from '@/core/decorators/command.decorator';
import { Arg } from '@/core/decorators/argument.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@Command({
    name: 'say',
    description: 'Replica un mensaje',
    aliases: ['repeat', 'echo'],
})
export abstract class SayDefinition extends BaseCommand {
    @Arg({
        name: 'mensaje',
        description: 'El mensaje a replicar',
        index: 0,
        required: true,
        rawText: true, // ✅ Captura todo el texto sin comillas
    })
    public mensaje!: string;
}
```

**Implementación:**

```typescript
// src/commands/say.command.ts
import { SayDefinition } from '@/definition/say.definition';
import { Message } from 'discord.js';

export class SayCommand extends SayDefinition {
    public async run(): Promise<void> {
        // Eliminar el mensaje original en text commands
        if (!this.ctx.isInteraction && this.ctx['source'] instanceof Message) {
            try {
                const msg = this.ctx['source'] as Message;
                await msg.delete();
            } catch {
                // Ignorar si no tiene permisos
            }
        }

        // Enviar el mensaje replicado
        await this.send(this.mensaje);
    }
}
```

**Uso:**

```
Usuario: !say Hola mundo, este es un mensaje largo sin comillas
Bot: Hola mundo, este es un mensaje largo sin comillas

Usuario: /say mensaje:Este es el texto
Bot: Este es el texto
```

### Ejemplo 2: Comando Announce (Complejo)

Anuncia un mensaje en un canal, combinando argumento normal + `rawText`.

**Definición:**

```typescript
// src/definition/announce.definition.ts
import { Command } from '@/core/decorators/command.decorator';
import { Arg } from '@/core/decorators/argument.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { Channel } from 'discord.js';

@Command({
    name: 'announce',
    description: 'Anuncia un mensaje en un canal específico',
    aliases: ['anunciar'],
})
export abstract class AnnounceDefinition extends BaseCommand {
    @Arg({
        name: 'canal',
        description: 'El canal donde se enviará el anuncio',
        index: 0,
        required: true,
    })
    public canal!: Channel;

    @Arg({
        name: 'mensaje',
        description: 'El mensaje del anuncio',
        index: 1,
        required: true,
        rawText: true, // ✅ Captura todo después del canal
    })
    public mensaje!: string;
}
```

**Implementación:**

```typescript
// src/commands/announce.command.ts
import { AnnounceDefinition } from '@/definition/announce.definition';
import { TextChannel, PermissionFlagsBits } from 'discord.js';

export class AnnounceCommand extends AnnounceDefinition {
    public async run(): Promise<void> {
        // Verificar que el canal sea de texto
        if (!(this.canal instanceof TextChannel)) {
            const errorEmbed = this.getEmbed('error')
                .setTitle('❌ Error')
                .setDescription('El canal debe ser un canal de texto.');

            await this.reply({ embeds: [errorEmbed] });
            return;
        }

        // Verificar permisos
        const botPerms = this.canal.permissionsFor(this.ctx.guild.members.me!);
        const userPerms = this.canal.permissionsFor(this.user.id);

        if (!botPerms?.has(PermissionFlagsBits.SendMessages)) {
            const errorEmbed = this.getEmbed('error')
                .setTitle('❌ Sin Permisos')
                .setDescription(`No tengo permisos en ${this.canal}.`);

            await this.reply({ embeds: [errorEmbed] });
            return;
        }

        if (!userPerms?.has(PermissionFlagsBits.ManageMessages)) {
            const errorEmbed = this.getEmbed('error')
                .setTitle('❌ Sin Permisos')
                .setDescription('Necesitas `Gestionar Mensajes`.');

            await this.reply({ embeds: [errorEmbed] });
            return;
        }

        // Enviar anuncio
        await this.canal.send(this.mensaje);

        const successEmbed = this.getEmbed('success')
            .setTitle('✅ Anuncio Enviado')
            .setDescription(`Enviado en ${this.canal}`)
            .addFields(
                { name: 'Moderador', value: this.user.tag, inline: true },
                { name: 'Canal', value: `${this.canal}`, inline: true },
            );

        await this.reply({ embeds: [successEmbed] });
    }
}
```

**Uso:**

```
Text Command:
Usuario: !announce #general Este es el anuncio completo sin comillas
→ Canal: #general
→ Mensaje: "Este es el anuncio completo sin comillas"

Slash Command:
/announce canal:#general mensaje:Este es el mensaje
→ Funciona como argumentos normales separados
```

**Notas sobre `rawText`:**

- ✅ Solo afecta comandos de texto (`!comando`)
- ✅ En slash commands funciona como argumento normal
- ✅ Debe ser el **último** argumento o después de todos los fijos
- ✅ No requiere comillas, todo el texto se captura automáticamente

---

## 🎛️ Ejemplos con `options` (Choices)

### Ejemplo: Comando SetStatus

Cambia el estado del bot usando opciones predefinidas para el tipo de actividad.

**Definición:**

```typescript
// src/definition/setstatus.definition.ts
import { Command } from '@/core/decorators/command.decorator';
import { Arg } from '@/core/decorators/argument.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@Command({
    name: 'setstatus',
    description: 'Cambia el estado del bot',
    aliases: ['status', 'actividad'],
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
```

**Implementación:**

```typescript
// src/commands/setstatus.command.ts
import { SetStatusDefinition } from '@/definition/setstatus.definition';
import { ActivityType } from 'discord.js';

export class SetStatusCommand extends SetStatusDefinition {
    public async run(): Promise<void> {
        // tipo ya es un número validado (0, 3, 2, o 5)
        await this.ctx.client.user?.setActivity(this.texto, {
            type: this.tipo as ActivityType,
        });

        const tipos = {
            [ActivityType.Playing]: 'Jugando',
            [ActivityType.Watching]: 'Viendo',
            [ActivityType.Listening]: 'Escuchando',
            [ActivityType.Competing]: 'Compitiendo',
        };

        const tipoTexto = tipos[this.tipo as ActivityType] || 'Estado';

        const embed = this.getEmbed('success')
            .setTitle('✅ Estado Actualizado')
            .setDescription(`${tipoTexto}: **${this.texto}**`);

        await this.reply({ embeds: [embed] });
    }
}
```

**Uso Text Command:**

```
Usuario: !setstatus 0 Minecraft
Bot: ✅ Estado Actualizado - Jugando: Minecraft

Usuario: !setstatus 3 YouTube
Bot: ✅ Estado Actualizado - Viendo: YouTube

Usuario: !setstatus 7 algo
Bot: ❌ Valor inválido para tipo. Valores permitidos: 0, 3, 2, 5
```

**Uso Slash Command:**

```
/setstatus tipo:[Dropdown con: Jugando, Viendo, Escuchando, Compitiendo] texto:Minecraft
→ Usuario selecciona "Jugando"
→ Bot recibe: tipo = 0
→ Bot: ✅ Estado Actualizado - Jugando: Minecraft
```

**Ventajas de usar `options`:**

- ✅ Validación automática en text commands
- ✅ Dropdown interactivo en slash commands
- ✅ Previene valores inválidos
- ✅ Mejor experiencia de usuario
- ✅ No necesitas implementar validación manual

---

## � Comando Help Integrado

El bot incluye un comando `help` que **automáticamente** genera ayuda para todos tus comandos:

### Características

- ✅ **Muestra uso con argumentos** en text commands: `!comando <arg1> <arg2>`
- ✅ **Detecta tipo de comando:** Muestra `/` para slash commands, `!` para text commands
- ✅ **Argumentos normalizados:** Los nombres se normalizan automáticamente (lowercase, sin acentos)
- ✅ **Paginación automática:** Si hay más de 10 comandos por categoría
- ✅ **Información completa:** Descripción, uso, argumentos, aliases

### Ejemplo de Salida

**Text Command:**

```
!help ban

📘 Ayuda: ban
Descripción: Banea a un usuario del servidor

Uso: !ban <Usuario> <Razón>

Argumentos:
Usuario: El usuario a banear
✅ Requerido

Razón: Motivo del ban
❌ Opcional

Aliases: banear, expulsar
```

**Slash Command:**

```
/help ban

📘 Ayuda: ban
Descripción: Banea a un usuario del servidor

Uso: /ban

(Los argumentos se muestran automáticamente en Discord)
```

### Normalización de Argumentos

El `CommandLoader` normaliza automáticamente los nombres de argumentos:

- **Original:** `name: "Usuario Objetivo"`
- **Normalizado:** `normalizedName: "usuarioobjetivo"`
- **Proceso:** lowercase → sin acentos → sin espacios → solo alfanumérico
- **Uso:** El nombre original se mantiene para mostrar en ayudas

---

## �📚 Recursos Relacionados

- `/src/definition/` - Definiciones de comandos
- `/src/core/structures/BaseCommand.ts` - Clase base
- `/src/core/decorators/` - Decoradores disponibles (@Command, @Arg, @UsePlugins)
- `/src/plugins/` - Plugins disponibles
- `/src/config/` - Configuración de plugins por scope
- `ARCHITECTURE.md` - Arquitectura completa del sistema
