![Banner](../assets/patto-banner.png)

# Patto Bot Template

<div align="center">

![Discord.js](https://img.shields.io/badge/discord.js-v14-blue?style=for-the-badge&logo=discord)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Template moderno e escalável para bots do Discord com TypeScript**

[Recursos](#-recursos) • [Instalação](#-instalação) • [Uso](#-uso) • [Documentação](#-documentação) • [Arquitetura](#-arquitetura)

---

**📖 Leia em outros idiomas:** [Español](../README.md) • [English](README_ENGLISH.md)

</div>

---

## 🌟 Recursos

### 🎯 Sistema de Comandos Avançado

-   ✅ **Decoradores TypeScript** para definição declarativa de comandos
-   ✅ **Slash Commands** (/comando) - Sempre disponíveis
-   ✅ **Text Commands** (!comando) - Opcionais e configuráveis
-   ✅ **Resolução automática** de argumentos com validação
-   ✅ **Aliases** para comandos de texto
-   ✅ **Tipos Discord** (User, Role, Channel, Member) resolvidos automaticamente
-   ✅ **Sistema de Plugins** extensível (onBeforeExecute, onAfterExecute)

### 🏗️ Arquitetura Limpa

-   ✅ **Princípios SOLID** aplicados
-   ✅ **Separação de responsabilidades** (Loaders, Handlers, Resolvers, Plugins)
-   ✅ **Código modular** e fácil de testar
-   ✅ **Decoradores reutilizáveis** (@Command, @Arg)
-   ✅ **Context unificado** para Messages e Interactions
-   ✅ **Plugins reutilizáveis** (Cooldowns, Permissões, Logging, etc.)

### 🛠️ Experiência do Desenvolvedor

-   ✅ **TypeScript** com modo strict
-   ✅ **Path aliases** (@/core, @/commands, etc.)
-   ✅ **Hot reload** em desenvolvimento (ts-node)
-   ✅ **Documentação completa** por pasta
-   ✅ **Exemplos prontos para usar**

### ⚙️ Configuração Flexível

-   ✅ **Variáveis de ambiente** para configuração
-   ✅ **Intents automáticos** de acordo com recursos usados
-   ✅ **Presenças personalizáveis** com templates
-   ✅ **Tratamento robusto de erros**

---

## 📋 Pré-requisitos

-   **Node.js** v18 ou superior
-   **npm** ou **yarn**
-   **Bot do Discord** criado no [Discord Developer Portal](https://discord.com/developers/applications)

---

## 🚀 Instalação

### 1. Clonar o Repositório

```bash
git clone https://github.com/HormigaDev/patto-bot-template.git
cd patto-bot-template
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Copie o template de configuração:

```bash
cp .env.template .env
```

Edite `.env` com suas credenciais:

```env
# Token do bot (obtido no Discord Developer Portal)
BOT_TOKEN=seu_token_aqui

# ID da aplicação do bot
CLIENT_ID=seu_client_id_aqui

# Habilitar comandos de texto (opcional)
# Valores aceitos: yes, Yes, YES, yés, yês (insensível a maiúsculas e acentos)
USE_MESSAGE_CONTENT=yes
```

### 4. Configurar Discord Developer Portal

#### Habilitar Intents Privilegiados

Se você configurou `USE_MESSAGE_CONTENT=yes`:

1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Selecione sua aplicação
3. Vá em **Bot** → **Privileged Gateway Intents**
4. Ative: ✅ **MESSAGE CONTENT INTENT**
5. Salve as alterações

#### Convidar o Bot

Gere uma URL de convite:

1. Vá em **OAuth2** → **URL Generator**
2. Selecione scopes:
    - ✅ `bot`
    - ✅ `applications.commands`
3. Selecione as permissões do bot de acordo com suas necessidades
4. Copie a URL gerada e use-a para convidar o bot

---

## 🎮 Uso

### Desenvolvimento

Inicie o bot em modo de desenvolvimento com hot reload:

```bash
npm run dev
```

### Produção

Compile e execute:

```bash
npm run build
npm start
```

---

## 📖 Criar Seu Primeiro Comando

### 1. Criar a Definição

Crie `src/definition/ping.definition.ts`:

```typescript
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@Command({
    name: 'ping',
    description: 'Verifica a latência do bot',
    aliases: ['latencia', 'pong'],
})
export abstract class PingDefinition extends BaseCommand {
    // Sem argumentos para este comando
}
```

### 2. Criar a Implementação

Crie `src/commands/ping.command.ts`:

```typescript
import { EmbedBuilder } from 'discord.js';
import { PingDefinition } from '@/definition/ping.definition';

export class PingCommand extends PingDefinition {
    public async run(): Promise<void> {
        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setDescription(`Latência: ${this.ctx.client.ws.ping}ms`)
            .setColor('#5180d6')
            .setFooter({
                text: this.user.username,
                iconURL: this.user.displayAvatarURL(),
            });

        await this.reply({ embeds: [embed] });
    }
}
```

### 3. Pronto!

O comando é carregado automaticamente. Reinicie o bot e teste:

-   Slash: `/ping`
-   Texto: `!ping`, `!latencia`, `!pong`

---

## 📚 Documentação

### Por Pasta

Cada pasta importante tem seu próprio README com documentação detalhada:

-   📁 [`/src/commands/`](../src/commands/README.md) - Implementações de comandos
-   📁 [`/src/definition/`](../src/definition/README.md) - Definições de comandos (opcional)
-   📁 [`/src/plugins/`](../src/plugins/README.md) - Plugins extensíveis (Cooldowns, Permissões, etc.)
-   📁 [`/src/core/`](../src/core/README.md) - Núcleo do framework
    -   📁 [`/decorators/`](../src/core/decorators/README.md) - Decoradores @Command e @Arg
    -   📁 [`/handlers/`](../src/core/handlers/README.md) - CommandHandler
    -   📁 [`/loaders/`](../src/core/loaders/README.md) - Carregadores de comandos
    -   📁 [`/resolvers/`](../src/core/resolvers/README.md) - Resolvedores de tipos
    -   📁 [`/structures/`](../src/core/structures/README.md) - BaseCommand, CommandContext, BasePlugin
-   📁 [`/src/error/`](../src/error/README.md) - Erros personalizados
-   📁 [`/src/events/`](../src/events/README.md) - Eventos do Discord

### Guias

-   📄 [`ARCHITECTURE.md`](../ARCHITECTURE.md) - Arquitetura completa do sistema
-   📄 [`docs/MESSAGE_CONTENT_CONFIG.md`](../docs/MESSAGE_CONTENT_CONFIG.md) - Configuração de comandos de texto

---

## 🏗️ Arquitetura

### Estrutura do Projeto

```
patto-bot-template/
├── src/
│   ├── bot.ts                    # Classe principal do bot
│   ├── index.ts                  # Ponto de entrada
│   ├── commands/                 # Implementações de comandos
│   │   └── *.command.ts
│   ├── core/                     # Núcleo do framework
│   │   ├── decorators/           # @Command, @Arg
│   │   ├── handlers/             # CommandHandler
│   │   ├── loaders/              # CommandLoader, SlashCommandLoader
│   │   ├── resolvers/            # TypeResolver, ArgumentResolver
│   │   └── structures/           # BaseCommand, CommandContext
│   ├── definition/               # Definições de comandos
│   │   └── *.definition.ts
│   ├── error/                    # Erros personalizados
│   │   ├── ValidationError.ts
│   │   └── ReplyError.ts
│   └── events/                   # Eventos do Discord
│       ├── ready.event.ts
│       ├── interactionCreate.event.ts
│       └── messageCreate.event.ts
├── .env.template                 # Template de configuração
├── package.json
├── tsconfig.json
└── README.md
```

### Fluxo de Execução

```
Usuário executa comando
         ↓
┌────────────────────┐
│  Event Handler     │ (interactionCreate ou messageCreate)
│  • Detecta comando │
│  • Busca no loader │
└────────────────────┘
         ↓
┌────────────────────┐
│  CommandHandler    │
│  • Instancia       │
│  • Injeta ctx      │
└────────────────────┘
         ↓
┌────────────────────┐
│  ArgumentResolver  │
│  • Obtém args      │
│  • Valida          │
│  • Resolve tipos   │
└────────────────────┘
         ↓
┌────────────────────┐
│  Command.run()     │
│  • Lógica do       │
│    comando         │
└────────────────────┘
```

---

## 🎨 Exemplos de Comandos

### Comando com Argumentos

```typescript
// definition/greet.definition.ts
@Command({
    name: 'greet',
    description: 'Cumprimenta alguém',
})
export abstract class GreetDefinition extends BaseCommand {
    @Arg({
        name: 'nome',
        description: 'Nome da pessoa',
        index: 0,
        required: true,
    })
    public nome!: string;
}

// commands/greet.command.ts
export class GreetCommand extends GreetDefinition {
    public async run(): Promise<void> {
        await this.reply(`Olá ${this.nome}! 👋`);
    }
}
```

### Comando com Usuário do Discord

```typescript
// definition/hug.definition.ts
@Command({
    name: 'hug',
    description: 'Abraça um usuário',
})
export abstract class HugDefinition extends BaseCommand {
    @Arg({
        name: 'usuario',
        description: 'Usuário para abraçar',
        index: 0,
        required: true,
    })
    public usuario!: User;
}

// commands/hug.command.ts
export class HugCommand extends HugDefinition {
    public async run(): Promise<void> {
        const embed = new EmbedBuilder()
            .setDescription(`${this.user} abraça ${this.usuario}! 🤗`)
            .setColor('#5180d6');

        await this.reply({ embeds: [embed] });
    }
}
```

### Comando com Validação

```typescript
// definition/transfer.definition.ts
@Command({
    name: 'transfer',
    description: 'Transfere moedas',
})
export abstract class TransferDefinition extends BaseCommand {
    @Arg({
        name: 'quantidade',
        description: 'Quantidade a transferir',
        index: 0,
        required: true,
        validate: (value: number) => {
            if (value <= 0) return 'Deve ser maior que 0';
            if (value > 1000000) return 'Máximo 1,000,000';
            return true;
        },
    })
    public quantidade!: number;

    @Arg({
        name: 'destinatario',
        description: 'Usuário destinatário',
        index: 1,
        required: true,
    })
    public destinatario!: User;
}
```

---

## 🔧 Configuração Avançada

### Alterar o Prefixo

Edite `src/events/messageCreate.event.ts`:

```typescript
const PREFIX = '?'; // Mude '!' para seu prefixo
```

### Alterar a Presença

Edite `src/events/ready.event.ts` e descomente/modifique os exemplos.

### Intents Personalizados

Se precisar de intents adicionais, edite `src/bot.ts`:

```typescript
intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates, // Exemplo: estados de voz
    // ... mais intents
];
```

---

## 🐛 Solução de Problemas

### Erro: "Missing Access"

**Causa:** Falta o scope `applications.commands`  
**Solução:** Re-convide o bot com o scope correto

### Erro: "Unknown interaction"

**Causa:** Os comandos não estão registrados  
**Solução:** Aguarde até que "✅ Comandos Slash registrados" apareça no console

### Comandos de texto não funcionam

**Causa:** `USE_MESSAGE_CONTENT` não está configurado ou o intent não está habilitado  
**Solução:** Veja [`docs/MESSAGE_CONTENT_CONFIG.md`](../docs/MESSAGE_CONTENT_CONFIG.md)

### Erro: "Cannot find module '@/...'"

**Causa:** Path aliases não configurados  
**Solução:** Certifique-se de executar com `ts-node -r tsconfig-paths/register`

---

## 🤝 Contribuir

Contribuições são bem-vindas! Por favor:

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas alterações (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a Licença MIT. Veja o arquivo [`LICENSE`](../translates/LICENSE_PORTUGUESE) para mais detalhes.

---

## 👨‍💻 Autor

**HormigaDev**

-   GitHub: [@HormigaDev](https://github.com/HormigaDev)

---

## 🙏 Agradecimentos

-   [Discord.js](https://discord.js.org/) - Biblioteca do Discord para Node.js
-   [TypeScript](https://www.typescriptlang.org/) - Superset do JavaScript
-   [reflect-metadata](https://github.com/rbuckton/reflect-metadata) - Metadata Reflection API

---

<div align="center">

**⭐ Se você gosta deste projeto, dê uma estrela no GitHub! ⭐**

[Reportar Bug](https://github.com/HormigaDev/patto-bot-template/issues) • [Solicitar Feature](https://github.com/HormigaDev/patto-bot-template/issues)

</div>
