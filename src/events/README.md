# Carpeta: Events

## 📖 Descripción

Esta carpeta contiene los **manejadores de eventos de Discord**. Cada archivo representa un evento específico que el bot escucha y procesa.

## 🏗️ Estructura

```
events/
├── ready.event.ts                # Bot listo y conectado
├── interactionCreate.event.ts   # Slash commands recibidos
└── messageCreate.event.ts        # Mensajes de texto recibidos
```

## 🎯 Patrón de Eventos

Todos los eventos siguen este patrón:

```typescript
export function registerEventName(...dependencies) {
    return {
        name: Events.EventName,
        once: boolean,
        async execute(...args) {
            // Lógica del evento
        },
    };
}
```

---

## 🚀 ready.event.ts

### Descripción

Se ejecuta cuando el bot se conecta exitosamente a Discord.

### Responsabilidades

1. Registrar slash commands en Discord API
2. Establecer presencia personalizada del bot
3. Log de confirmación

### Uso

```typescript
const readyEvent = registerReadyEvent(slashCommandLoader);
client.once(readyEvent.name, readyEvent.execute);
```

### Configuración

El evento usa `once: true` porque solo debe ejecutarse una vez al conectar.

### Presencia Personalizada

Incluye template con 6 ejemplos de presencias:

#### 1. Custom Status (Activo por defecto)

```typescript
client.user?.setPresence({
    activities: [
        {
            name: '🤖 Ayudando a usuarios',
            type: ActivityType.Custom,
        },
    ],
    status: PresenceUpdateStatus.Online,
});
```

#### 2. Playing

```typescript
activities: [
    {
        name: 'con comandos',
        type: ActivityType.Playing,
    },
];
// Muestra: "Jugando a con comandos"
```

#### 3. Listening

```typescript
activities: [
    {
        name: '/help para comandos',
        type: ActivityType.Listening,
    },
];
// Muestra: "Escuchando /help para comandos"
```

#### 4. Watching

```typescript
activities: [
    {
        name: 'a los usuarios',
        type: ActivityType.Watching,
    },
];
// Muestra: "Viendo a los usuarios"
```

#### 5. Streaming

```typescript
activities: [
    {
        name: 'Mi Stream',
        type: ActivityType.Streaming,
        url: 'https://www.twitch.tv/tu_canal',
    },
];
// Muestra: "En directo Mi Stream"
```

#### 6. Presencia Rotativa

```typescript
const presences = [
    { name: '🎮 Jugando', type: ActivityType.Playing },
    { name: '👀 Observando', type: ActivityType.Watching },
    { name: '🎵 Música', type: ActivityType.Listening },
];

setInterval(() => {
    const presence = presences[currentIndex];
    client.user?.setPresence({
        activities: [presence],
        status: PresenceUpdateStatus.Online,
    });
    currentIndex = (currentIndex + 1) % presences.length;
}, 10000); // Cambia cada 10 segundos
```

### Estados Disponibles

```typescript
PresenceUpdateStatus.Online; // 🟢 En línea
PresenceUpdateStatus.Idle; // 🟡 Ausente
PresenceUpdateStatus.DoNotDisturb; // 🔴 No molestar
PresenceUpdateStatus.Invisible; // ⚫ Invisible
```

### Nota sobre Intents

**NO necesitas `GuildPresences` intent** para establecer la presencia de tu bot. Solo lo necesitas para **leer** presencias de otros usuarios.

---

## ⚡ interactionCreate.event.ts

### Descripción

Se ejecuta cuando el bot recibe una interacción (principalmente slash commands).

### Responsabilidades

1. Verificar que sea un comando (`isChatInputCommand()`)
2. Buscar el comando en el loader
3. Ejecutar el comando via CommandHandler

### Filtrado

El evento maneja múltiples tipos de interacciones:

```typescript
// Slash commands
if (interaction.isChatInputCommand()) {
    // Ejecutar comando
}

// Botones (desde ComponentRegistry)
if (interaction.isButton()) {
    const callback = ComponentRegistry.getButton(interaction.customId);
    if (callback) await callback(interaction);
}

// Select menus (desde ComponentRegistry)
if (interaction.isStringSelectMenu()) {
    const callback = ComponentRegistry.getSelect(interaction.customId);
    if (callback) await callback(interaction, interaction.values);
}

// Modales (desde ComponentRegistry)
if (interaction.isModalSubmit()) {
    const callback = ComponentRegistry.getModal(interaction.customId);
    if (callback) await callback(interaction);
}
```

**Tipos de interacciones soportadas:**

- ✅ **Chat Input Commands** - Slash commands (`/comando`)
- ✅ **Buttons** - Botones interactivos creados con `Button` wrapper
- ✅ **Select Menus** - Menús desplegables creados con `Select` wrapper
- ✅ **Modals** - Formularios creados con `Modal` wrapper

### Flujo

```
Interaction Recibida
    ↓
¿Qué tipo es?
    ├─ ChatInputCommand → Buscar y ejecutar comando
    ├─ Button → Buscar callback en ComponentRegistry
    ├─ StringSelectMenu → Buscar callback en ComponentRegistry
    ├─ ModalSubmit → Buscar callback en ComponentRegistry
    └─ Otro → Ignorar
```

### Ejemplo de Uso

```typescript
const event = registerInteractionCreateEvent(commandLoader, commandHandler);
client.on(event.name, event.execute);
```

---

## 📝 messageCreate.event.ts

### Descripción

Se ejecuta cuando el bot recibe un mensaje de texto.

### Responsabilidades

1. Filtrar mensajes no válidos
2. Parsear comando y argumentos
3. Buscar comando en el loader
4. Ejecutar el comando via CommandHandler

### Filtros Aplicados

```typescript
// Ignorar bots
if (message.author.bot) return;

// Solo en servidores
if (!message.guild) return;

// Solo con prefijo
if (!message.content.startsWith(PREFIX)) return;
```

### Prefijo

```typescript
const PREFIX = '!';
```

Para cambiar el prefijo, modifica la constante en el archivo.

### Parsing de Argumentos

El evento incluye una función avanzada de parsing:

```typescript
parseTextArguments(input: string)
```

**Características:**

- Soporta strings entre comillas dobles: `"texto con espacios"`
- Soporta strings entre comillas simples: `'texto con espacios'`
- Convierte números automáticamente: `"123"` → `123`
- Soporta decimales: `"45.67"` → `45.67`
- Soporta negativos: `"-10"` → `-10`

**Ejemplos:**

```typescript
// Input: hola "mundo 123" 456 'foo bar'
// Output: ["hola", "mundo 123", 456, "foo bar"]

// Input: transfer 100 @User "Para ti"
// Output: ["transfer", 100, "@User", "Para ti"]
```

### Flujo

```
Mensaje Recibido
    ↓
¿Es de un bot?
    └─ Sí → Ignorar
    ↓
¿Es en un servidor?
    └─ No → Ignorar
    ↓
¿Empieza con prefijo?
    └─ No → Ignorar
    ↓
Parsear comando
    ↓
Parsear argumentos
    ↓
Buscar comando en loader
    ↓
¿Comando existe?
    ├─ No → Ignorar
    └─ Sí → Ejecutar
        ↓
    CommandHandler.executeCommand(message, commandClass, args)
```

### Habilitación Condicional

Este evento **solo se registra** si la variable `USE_MESSAGE_CONTENT=yes`.

Ver: `docs/MESSAGE_CONTENT_CONFIG.md` para más detalles.

---

## 🔄 Comparación de Eventos

| Aspecto         | ready            | interactionCreate | messageCreate                      |
| --------------- | ---------------- | ----------------- | ---------------------------------- |
| **Tipo**        | `once`           | `on`              | `on`                               |
| **Frecuencia**  | 1 vez            | Múltiple          | Múltiple                           |
| **Propósito**   | Inicialización   | Slash commands    | Text commands                      |
| **Intents**     | Ninguno especial | `Guilds`          | `GuildMessages` + `MessageContent` |
| **Condicional** | No               | No                | Sí (`USE_MESSAGE_CONTENT`)         |

## 🎨 Agregar Nuevo Evento

### 1. Crear Archivo

```typescript
// src/events/guildMemberAdd.event.ts
import { Events, GuildMember } from 'discord.js';

export function registerGuildMemberAddEvent() {
    return {
        name: Events.GuildMemberAdd,
        async execute(member: GuildMember) {
            // Tu lógica aquí
            console.log(`${member.user.username} se unió al servidor`);
        },
    };
}
```

### 2. Registrar en Bot

```typescript
// src/bot.ts
import { registerGuildMemberAddEvent } from '@/events/guildMemberAdd.event';

private registerEvents(): void {
    // ... otros eventos

    const memberAddEvent = registerGuildMemberAddEvent();
    this.client.on(memberAddEvent.name as any, memberAddEvent.execute);
}
```

### 3. Verificar Intents

Asegúrate de tener los intents necesarios:

```typescript
// Para GuildMemberAdd necesitas:
GatewayIntentBits.GuildMembers;
```

## 📚 Eventos Disponibles en Discord

Algunos eventos útiles:

- `ClientReady` - Bot conectado (usado)
- `InteractionCreate` - Interacciones recibidas (usado)
- `MessageCreate` - Mensajes recibidos (usado)
- `MessageDelete` - Mensaje eliminado
- `MessageUpdate` - Mensaje editado
- `GuildMemberAdd` - Miembro se unió
- `GuildMemberRemove` - Miembro salió
- `VoiceStateUpdate` - Estado de voz cambió
- `ChannelCreate` - Canal creado
- `GuildBanAdd` - Usuario baneado

Ver: [Discord.js Events](https://discord.js.org/#/docs/discord.js/main/typedef/Events)

## ⚙️ Configuración de Dependencias

Los eventos pueden recibir dependencias en su función de registro:

```typescript
// Con dependencias
export function registerInteractionCreateEvent(
    commandLoader: CommandLoader,
    commandHandler: CommandHandler,
) {
    return {
        name: Events.InteractionCreate,
        async execute(interaction: Interaction) {
            // Usar commandLoader y commandHandler
        },
    };
}

// Sin dependencias
export function registerMessageDeleteEvent() {
    return {
        name: Events.MessageDelete,
        async execute(message: Message) {
            // Lógica sin dependencias externas
        },
    };
}
```

## 📚 Recursos Relacionados

- `/src/bot.ts` - Registra eventos
- `/src/core/handlers/command.handler.ts` - Ejecuta comandos
- `/src/core/loaders/` - Loaders usados por eventos
- [Discord.js Events](https://discord.js.org/#/docs/discord.js/main/typedef/Events) - Lista completa
