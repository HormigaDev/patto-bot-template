![Banner](../assets/patto-banner.png)

# Patto Bot Template

<div align="center">

![Discord.js](https://img.shields.io/badge/discord.js-v14-blue?style=for-the-badge&logo=discord)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Modern and scalable template for Discord bots with TypeScript**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Documentation](#-documentation) • [Architecture](#-architecture)

---

**📖 Read in other languages:** [Español](../README.md) • [Português](README_PORTUGUESE.md)

</div>

---

## 🌟 Features

### 🎯 Advanced Command System

-   ✅ **TypeScript Decorators** for declarative command definition
-   ✅ **Slash Commands** (/command) - Always available
-   ✅ **Text Commands** (!command) - Optional and configurable
-   ✅ **Automatic argument resolution** with validation
-   ✅ **Aliases** for text commands
-   ✅ **Discord Types** (User, Role, Channel, Member) automatically resolved
-   ✅ **Extensible Plugin System** (onBeforeExecute, onAfterExecute)

### 🏗️ Clean Architecture

-   ✅ **SOLID Principles** applied
-   ✅ **Separation of concerns** (Loaders, Handlers, Resolvers, Plugins)
-   ✅ **Modular code** easy to test
-   ✅ **Reusable decorators** (@Command, @Arg)
-   ✅ **Unified Context** for Messages and Interactions
-   ✅ **Reusable Plugins** (Cooldowns, Permissions, Logging, etc.)

### 🛠️ Developer Experience

-   ✅ **TypeScript** with strict mode
-   ✅ **Path aliases** (@/core, @/commands, etc.)
-   ✅ **Hot reload** in development (ts-node)
-   ✅ **Complete documentation** per folder
-   ✅ **Ready-to-use examples**

### ⚙️ Flexible Configuration

-   ✅ **Environment variables** for configuration
-   ✅ **Automatic intents** based on used features
-   ✅ **Customizable presences** with templates
-   ✅ **Robust error handling**

---

## 📋 Prerequisites

-   **Node.js** v18 or higher
-   **npm** or **yarn**
-   **Discord Bot** created in [Discord Developer Portal](https://discord.com/developers/applications)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/HormigaDev/patto-bot-template.git
cd patto-bot-template
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the configuration template:

```bash
cp .env.template .env
```

Edit `.env` with your credentials:

```env
# Bot token (obtained from Discord Developer Portal)
BOT_TOKEN=your_token_here

# Bot application ID
CLIENT_ID=your_client_id_here

# Enable text commands (optional)
# Accepted values: yes, Yes, YES, yés, yês (case and accent insensitive)
USE_MESSAGE_CONTENT=yes
```

### 4. Configure Discord Developer Portal

#### Enable Privileged Intents

If you configured `USE_MESSAGE_CONTENT=yes`:

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to **Bot** → **Privileged Gateway Intents**
4. Enable: ✅ **MESSAGE CONTENT INTENT**
5. Save changes

#### Invite the Bot

Generate an invitation URL:

1. Go to **OAuth2** → **URL Generator**
2. Select scopes:
    - ✅ `bot`
    - ✅ `applications.commands`
3. Select bot permissions according to your needs
4. Copy the generated URL and use it to invite the bot

---

## 🎮 Usage

### Development

Start the bot in development mode with hot reload:

```bash
npm run dev
```

### Production

Build and run:

```bash
npm run build
npm start
```

---

## 📖 Create Your First Command

### 1. Create the Definition

Create `src/definition/ping.definition.ts`:

```typescript
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@Command({
    name: 'ping',
    description: 'Check bot latency',
    aliases: ['latency', 'pong'],
})
export abstract class PingDefinition extends BaseCommand {
    // No arguments for this command
}
```

### 2. Create the Implementation

Create `src/commands/ping.command.ts`:

```typescript
import { EmbedBuilder } from 'discord.js';
import { PingDefinition } from '@/definition/ping.definition';

export class PingCommand extends PingDefinition {
    public async run(): Promise<void> {
        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setDescription(`Latency: ${this.ctx.client.ws.ping}ms`)
            .setColor('#5180d6')
            .setFooter({
                text: this.user.username,
                iconURL: this.user.displayAvatarURL(),
            });

        await this.reply({ embeds: [embed] });
    }
}
```

### 3. Done!

The command loads automatically. Restart the bot and test:

-   Slash: `/ping`
-   Text: `!ping`, `!latency`, `!pong`

---

## 📚 Documentation

### By Folder

Each important folder has its own README with detailed documentation:

-   📁 [`/src/commands/`](../src/commands/README.md) - Command implementations
-   📁 [`/src/definition/`](../src/definition/README.md) - Command definitions (optional)
-   📁 [`/src/plugins/`](../src/plugins/README.md) - Extensible plugins (Cooldowns, Permissions, etc.)
-   📁 [`/src/core/`](../src/core/README.md) - Framework core
    -   📁 [`/decorators/`](../src/core/decorators/README.md) - @Command and @Arg decorators
    -   📁 [`/handlers/`](../src/core/handlers/README.md) - CommandHandler
    -   📁 [`/loaders/`](../src/core/loaders/README.md) - Command loaders
    -   📁 [`/resolvers/`](../src/core/resolvers/README.md) - Type resolvers
    -   📁 [`/structures/`](../src/core/structures/README.md) - BaseCommand, CommandContext, BasePlugin
-   📁 [`/src/error/`](../src/error/README.md) - Custom errors
-   📁 [`/src/events/`](../src/events/README.md) - Discord events

### Guides

-   📄 [`ARCHITECTURE.md`](../ARCHITECTURE.md) - Complete system architecture
-   📄 [`docs/MESSAGE_CONTENT_CONFIG.md`](../docs/MESSAGE_CONTENT_CONFIG.md) - Text command configuration

---

## 🏗️ Architecture

### Project Structure

```
patto-bot-template/
├── src/
│   ├── bot.ts                    # Main bot class
│   ├── index.ts                  # Entry point
│   ├── commands/                 # Command implementations
│   │   └── *.command.ts
│   ├── core/                     # Framework core
│   │   ├── decorators/           # @Command, @Arg
│   │   ├── handlers/             # CommandHandler
│   │   ├── loaders/              # CommandLoader, SlashCommandLoader
│   │   ├── resolvers/            # TypeResolver, ArgumentResolver
│   │   └── structures/           # BaseCommand, CommandContext
│   ├── definition/               # Command definitions
│   │   └── *.definition.ts
│   ├── error/                    # Custom errors
│   │   ├── ValidationError.ts
│   │   └── ReplyError.ts
│   └── events/                   # Discord events
│       ├── ready.event.ts
│       ├── interactionCreate.event.ts
│       └── messageCreate.event.ts
├── .env.template                 # Configuration template
├── package.json
├── tsconfig.json
└── README.md
```

### Execution Flow

```
User executes command
         ↓
┌────────────────────┐
│  Event Handler     │ (interactionCreate or messageCreate)
│  • Detects command │
│  • Searches loader │
└────────────────────┘
         ↓
┌────────────────────┐
│  CommandHandler    │
│  • Instantiates    │
│  • Injects ctx     │
└────────────────────┘
         ↓
┌────────────────────┐
│  ArgumentResolver  │
│  • Gets args       │
│  • Validates       │
│  • Resolves types  │
└────────────────────┘
         ↓
┌────────────────────┐
│  Command.run()     │
│  • Command logic   │
│                    │
└────────────────────┘
```

---

## 🎨 Command Examples

### Command with Arguments

```typescript
// definition/greet.definition.ts
@Command({
    name: 'greet',
    description: 'Greet someone',
})
export abstract class GreetDefinition extends BaseCommand {
    @Arg({
        name: 'name',
        description: "Person's name",
        index: 0,
        required: true,
    })
    public name!: string;
}

// commands/greet.command.ts
export class GreetCommand extends GreetDefinition {
    public async run(): Promise<void> {
        await this.reply(`Hello ${this.name}! 👋`);
    }
}
```

### Command with Discord User

```typescript
// definition/hug.definition.ts
@Command({
    name: 'hug',
    description: 'Hug a user',
})
export abstract class HugDefinition extends BaseCommand {
    @Arg({
        name: 'user',
        description: 'User to hug',
        index: 0,
        required: true,
    })
    public user!: User;
}

// commands/hug.command.ts
export class HugCommand extends HugDefinition {
    public async run(): Promise<void> {
        const embed = new EmbedBuilder()
            .setDescription(`${this.user} hugs ${this.user}! 🤗`)
            .setColor('#5180d6');

        await this.reply({ embeds: [embed] });
    }
}
```

### Command with Validation

```typescript
// definition/transfer.definition.ts
@Command({
    name: 'transfer',
    description: 'Transfer coins',
})
export abstract class TransferDefinition extends BaseCommand {
    @Arg({
        name: 'amount',
        description: 'Amount to transfer',
        index: 0,
        required: true,
        validate: (value: number) => {
            if (value <= 0) return 'Must be greater than 0';
            if (value > 1000000) return 'Maximum 1,000,000';
            return true;
        },
    })
    public amount!: number;

    @Arg({
        name: 'recipient',
        description: 'Recipient user',
        index: 1,
        required: true,
    })
    public recipient!: User;
}
```

---

## 🔧 Advanced Configuration

### Change Prefix

Edit `src/events/messageCreate.event.ts`:

```typescript
const PREFIX = '?'; // Change '!' to your prefix
```

### Change Presence

Edit `src/events/ready.event.ts` and uncomment/modify the examples.

### Custom Intents

If you need additional intents, edit `src/bot.ts`:

```typescript
intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates, // Example: voice states
    // ... more intents
];
```

---

## 🐛 Troubleshooting

### Error: "Missing Access"

**Cause:** Missing `applications.commands` scope  
**Solution:** Re-invite the bot with the correct scope

### Error: "Unknown interaction"

**Cause:** Commands are not registered  
**Solution:** Wait for "✅ Slash Commands registered" to appear in console

### Text commands don't work

**Cause:** `USE_MESSAGE_CONTENT` is not configured or intent is not enabled  
**Solution:** See [`docs/MESSAGE_CONTENT_CONFIG.md`](../docs/MESSAGE_CONTENT_CONFIG.md)

### Error: "Cannot find module '@/...'"

**Cause:** Path aliases not configured  
**Solution:** Make sure to run with `ts-node -r tsconfig-paths/register`

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License. See the [`LICENSE`](../LICENSE) file for details.

---

## 👨‍💻 Author

**HormigaDev**

-   GitHub: [@HormigaDev](https://github.com/HormigaDev)

---

## 🙏 Acknowledgments

-   [Discord.js](https://discord.js.org/) - Discord library for Node.js
-   [TypeScript](https://www.typescriptlang.org/) - JavaScript superset
-   [reflect-metadata](https://github.com/rbuckton/reflect-metadata) - Metadata Reflection API

---

<div align="center">

**⭐ If you like this project, give it a star on GitHub! ⭐**

[Report Bug](https://github.com/HormigaDev/patto-bot-template/issues) • [Request Feature](https://github.com/HormigaDev/patto-bot-template/issues)

</div>
