# 📘 Grupos de Subcomandos

Los **grupos de subcomandos** permiten crear una jerarquía de 3 niveles para organizar comandos complejos: `comando grupo subcomando`.

## 📋 Índice

- [¿Qué son los Grupos de Subcomandos?](#-qué-son-los-grupos-de-subcomandos)
- [Cuándo Usar Grupos](#cuándo-debo-usar-grupos-en-lugar-de-múltiples-comandos-base)
- [Sintaxis Básica](#-sintaxis-básica)
- [Ejemplos Prácticos](#-ejemplos-prácticos)
- [Estructura de Archivos](#-estructura-de-archivos)
- [Uso en Discord](#-uso-en-discord)
- [Mejores Prácticas](#-mejores-prácticas)
- [Diferencias con Subcomandos](#-diferencias-con-subcomandos-simples)

---

## 🎯 ¿Qué son los Grupos de Subcomandos?

Los grupos de subcomandos son el nivel más alto de organización en Discord, permitiendo crear una jerarquía de 3 niveles para comandos complejos.

**Estructura:** `comando grupo subcomando [argumentos]`

**Ejemplo:**

```
/server config get
/server config set prefix !
/server user info @usuario
/server user list
!server config get
!server user info @usuario
```

---

## 🤔 Cuándo Usar Grupos

Usa grupos de subcomandos cuando:

✅ Necesitas organizar múltiples categorías de funcionalidad bajo un comando  
✅ Tienes más de 10 subcomandos relacionados que pueden agruparse  
✅ Quieres máxima organización y claridad  
✅ Las funcionalidades son complejas y tienen múltiples operaciones

❌ **NO uses grupos cuando:**

- Solo tienes 2-5 subcomandos simples → Usa `@Subcommand`
- Las funcionalidades no están relacionadas → Usa comandos base separados
- Agregarías complejidad innecesaria → Mantén simple con `@Subcommand`

---

## 📝 Sintaxis Básica

### Decorador `@SubcommandGroup`

```typescript
import { SubcommandGroup } from '@/core/decorators/subcommand-group.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@SubcommandGroup({
    parent: 'server', // Nombre del comando padre
    name: 'config', // Nombre del grupo
    subcommand: 'get', // Nombre del subcomando dentro del grupo
    description: 'Ver config', // Descripción del subcomando
})
export class ServerConfigGetCommand extends BaseCommand {
    async run(): Promise<void> {
        await this.reply('Configuración del servidor...');
    }
}
```

### Propiedades del Decorador

| Propiedad     | Tipo                 | Requerido | Descripción                                  |
| ------------- | -------------------- | --------- | -------------------------------------------- |
| `parent`      | `string`             | ✅        | Nombre del comando padre (nivel 1)           |
| `name`        | `string`             | ✅        | Nombre del grupo (nivel 2)                   |
| `subcommand`  | `string`             | ✅        | Nombre del subcomando (nivel 3)              |
| `description` | `string`             | ✅        | Descripción visible en Discord               |
| `category`    | `CommandCategoryTag` | ❌        | Categoría para organización (default: Other) |

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Sistema de Servidor Completo

```typescript
// src/commands/server/config/get.command.ts
import { SubcommandGroup } from '@/core/decorators/subcommand-group.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@SubcommandGroup({
    parent: 'server',
    name: 'config',
    subcommand: 'get',
    description: 'Ver la configuración del servidor',
})
export class ServerConfigGetCommand extends BaseCommand {
    async run(): Promise<void> {
        const config = await this.getServerConfig();
        await this.reply({
            embeds: [
                {
                    title: '⚙️ Configuración del Servidor',
                    description: config.toString(),
                    color: 0x5865f2,
                },
            ],
        });
    }
}
```

```typescript
// src/commands/server/config/set.command.ts
import { SubcommandGroup } from '@/core/decorators/subcommand-group.decorator';
import { Arg } from '@/core/decorators/argument.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@SubcommandGroup({
    parent: 'server',
    name: 'config',
    subcommand: 'set',
    description: 'Cambiar la configuración del servidor',
})
export class ServerConfigSetCommand extends BaseCommand {
    @Arg({
        name: 'key',
        description: 'Clave de configuración',
        required: true,
        options: [
            { label: 'Prefijo', value: 'prefix' },
            { label: 'Idioma', value: 'language' },
            { label: 'Logs Channel', value: 'logs_channel' },
        ],
    })
    key!: string;

    @Arg({
        name: 'value',
        description: 'Nuevo valor',
        required: true,
    })
    value!: string;

    async run(): Promise<void> {
        await this.updateServerConfig(this.key, this.value);
        await this.reply(`✅ Configuración actualizada: ${this.key} = ${this.value}`);
    }
}
```

```typescript
// src/commands/server/user/info.command.ts
import { SubcommandGroup } from '@/core/decorators/subcommand-group.decorator';
import { Arg } from '@/core/decorators/argument.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { User } from 'discord.js';

@SubcommandGroup({
    parent: 'server',
    name: 'user',
    subcommand: 'info',
    description: 'Ver información de un usuario',
})
export class ServerUserInfoCommand extends BaseCommand {
    @Arg({
        name: 'user',
        description: 'Usuario a consultar',
        required: true,
        type: () => User,
    })
    user!: User;

    async run(): Promise<void> {
        const member = await this.guild?.members.fetch(this.user.id);

        await this.reply({
            embeds: [
                {
                    title: `👤 ${this.user.tag}`,
                    thumbnail: { url: this.user.displayAvatarURL() },
                    fields: [
                        { name: 'ID', value: this.user.id, inline: true },
                        {
                            name: 'Creado',
                            value: this.user.createdAt.toLocaleDateString(),
                            inline: true,
                        },
                        {
                            name: 'Se unió',
                            value: member?.joinedAt?.toLocaleDateString() || 'N/A',
                            inline: true,
                        },
                        {
                            name: 'Roles',
                            value: member?.roles.cache.map((r) => r.name).join(', ') || 'Ninguno',
                        },
                    ],
                    color: 0x5865f2,
                },
            ],
        });
    }
}
```

```typescript
// src/commands/server/user/list.command.ts
import { SubcommandGroup } from '@/core/decorators/subcommand-group.decorator';
import { Arg } from '@/core/decorators/argument.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@SubcommandGroup({
    parent: 'server',
    name: 'user',
    subcommand: 'list',
    description: 'Listar usuarios del servidor',
})
export class ServerUserListCommand extends BaseCommand {
    @Arg({
        name: 'filter',
        description: 'Filtrar por estado',
        required: false,
        options: [
            { label: 'Todos', value: 'all' },
            { label: 'En línea', value: 'online' },
            { label: 'Bots', value: 'bots' },
        ],
    })
    filter?: string;

    async run(): Promise<void> {
        const members = await this.guild?.members.fetch();
        let filtered = members?.filter((m) => {
            if (this.filter === 'online') return m.presence?.status === 'online';
            if (this.filter === 'bots') return m.user.bot;
            return true;
        });

        const list = filtered?.map((m) => `• ${m.user.tag}`).join('\n') || 'Ninguno';

        await this.reply({
            embeds: [
                {
                    title: `👥 Usuarios del Servidor (${filtered?.size || 0})`,
                    description: list,
                    color: 0x5865f2,
                },
            ],
        });
    }
}
```

### Ejemplo 2: Sistema de Economía

```typescript
// src/commands/economy/balance/view.command.ts
@SubcommandGroup({
    parent: 'economy',
    name: 'balance',
    subcommand: 'view',
    description: 'Ver tu balance actual',
})
export class EconomyBalanceViewCommand extends BaseCommand {
    async run(): Promise<void> {
        const balance = await this.getUserBalance(this.user.id);
        await this.reply(`💰 Tu balance: **${balance}** monedas`);
    }
}

// src/commands/economy/balance/transfer.command.ts
@SubcommandGroup({
    parent: 'economy',
    name: 'balance',
    subcommand: 'transfer',
    description: 'Transferir dinero a otro usuario',
})
export class EconomyBalanceTransferCommand extends BaseCommand {
    @Arg({ name: 'user', description: 'Usuario destinatario', required: true, type: () => User })
    targetUser!: User;

    @Arg({
        name: 'amount',
        description: 'Cantidad a transferir',
        required: true,
        type: () => Number,
    })
    amount!: number;

    async run(): Promise<void> {
        await this.transferBalance(this.user.id, this.targetUser.id, this.amount);
        await this.reply(`✅ Transferidos **${this.amount}** monedas a ${this.targetUser.tag}`);
    }
}

// src/commands/economy/shop/list.command.ts
@SubcommandGroup({
    parent: 'economy',
    name: 'shop',
    subcommand: 'list',
    description: 'Ver items disponibles en la tienda',
})
export class EconomyShopListCommand extends BaseCommand {
    async run(): Promise<void> {
        const items = await this.getShopItems();
        await this.reply({ embeds: [this.buildShopEmbed(items)] });
    }
}

// src/commands/economy/shop/buy.command.ts
@SubcommandGroup({
    parent: 'economy',
    name: 'shop',
    subcommand: 'buy',
    description: 'Comprar un item de la tienda',
})
export class EconomyShopBuyCommand extends BaseCommand {
    @Arg({ name: 'item', description: 'ID del item', required: true })
    itemId!: string;

    async run(): Promise<void> {
        await this.purchaseItem(this.user.id, this.itemId);
        await this.reply(`✅ Item comprado exitosamente!`);
    }
}
```

---

## 📁 Estructura de Archivos

### Organización Recomendada

```
src/commands/
├── server/                              # Carpeta padre (SIN archivo base)
│   ├── config/                          # Grupo: config
│   │   ├── get.command.ts              # /server config get
│   │   ├── set.command.ts              # /server config set
│   │   └── reset.command.ts            # /server config reset
│   ├── user/                            # Grupo: user
│   │   ├── info.command.ts             # /server user info
│   │   ├── list.command.ts             # /server user list
│   │   └── roles.command.ts            # /server user roles
│   └── moderation/                      # Grupo: moderation
│       ├── warn.command.ts             # /server moderation warn
│       ├── kick.command.ts             # /server moderation kick
│       └── ban.command.ts              # /server moderation ban
├── economy/                             # Carpeta padre (SIN archivo base)
│   ├── balance/                         # Grupo: balance
│   │   ├── view.command.ts             # /economy balance view
│   │   └── transfer.command.ts         # /economy balance transfer
│   └── shop/                            # Grupo: shop
│       ├── list.command.ts             # /economy shop list
│       └── buy.command.ts              # /economy shop buy
└── info/                                # Comandos base simples
    ├── help.command.ts
    └── ping.command.ts
```

> **⚡ Importante:** **NO necesitas crear archivos `server.command.ts` o `economy.command.ts`**. El sistema crea automáticamente el comando padre como "fantasma" en Discord. Solo define los subcomandos de cada grupo.

### Ventajas de esta Estructura

✅ **Sin overhead** - No creas archivos base vacíos innecesarios  
✅ **DX excepcional** - Solo código que ejecuta lógica real  
✅ **Menos verboso** - Estructura limpia y directa  
✅ **Organización jerárquica** - Refleja la estructura del comando  
✅ **Navegación intuitiva** - Fácil encontrar cualquier subcomando  
✅ **Escalabilidad máxima** - Agregar grupos o subcomandos es trivial  
✅ **Separación de responsabilidades** - Cada archivo tiene un propósito claro

---

## 🎮 Uso en Discord

### Slash Commands

Discord agrupa automáticamente por niveles:

```
/server
  ├─ config
  │   ├─ get       Ver la configuración del servidor
  │   ├─ set       Cambiar la configuración
  │   └─ reset     Restaurar configuración por defecto
  ├─ user
  │   ├─ info      Ver información de un usuario
  │   ├─ list      Listar usuarios del servidor
  │   └─ roles     Ver roles de un usuario
  └─ moderation
      ├─ warn      Advertir a un usuario
      ├─ kick      Expulsar un usuario
      └─ ban       Banear un usuario
```

### Text Commands

Los usuarios pueden usar espacios:

```
!server config get
!server config set prefix !
!server user info @usuario
!economy balance view
!economy shop buy item-123
```

---

## ✨ Mejores Prácticas

### 1. Agrupación Lógica

Agrupa subcomandos que realmente están relacionados:

```typescript
// ✅ BIEN - Grupos lógicos y relacionados
/server config get     // Configuración del servidor
/server config set
/server user info      // Gestión de usuarios
/server user list

// ❌ EVITAR - Grupos sin relación clara
/server config get
/server joke random    // No relacionado con server
```

### 2. Nomenclatura Consistente

```typescript
// ✅ BIEN - Nombres verbos claros y consistentes
@SubcommandGroup({ parent: 'data', name: 'backup', subcommand: 'create' })
@SubcommandGroup({ parent: 'data', name: 'backup', subcommand: 'restore' })
@SubcommandGroup({ parent: 'data', name: 'backup', subcommand: 'delete' })

// ❌ EVITAR - Nombres inconsistentes
@SubcommandGroup({ parent: 'data', name: 'backup', subcommand: 'make' })
@SubcommandGroup({ parent: 'data', name: 'backup', subcommand: 'load' })
@SubcommandGroup({ parent: 'data', name: 'backup', subcommand: 'remove' })
```

### 3. Límites de Discord

Discord tiene límites específicos:

- **25 grupos** por comando padre
- **25 subcomandos** por grupo
- **25 opciones (argumentos)** por subcomando

```typescript
// ✅ BIEN - Dentro de límites
/server (1 comando padre)
  ├─ config (1 grupo, 3 subcomandos)
  ├─ user (1 grupo, 5 subcomandos)
  └─ moderation (1 grupo, 8 subcomandos)
// Total: 3 grupos, 16 subcomandos ✅

// ❌ EVITAR - Exceder límites
/admin (1 comando padre)
  ├─ group1 (30 subcomandos) ❌ Excede 25
```

### 4. Descripciones Descriptivas

```typescript
// ✅ BIEN - Descripciones específicas y útiles
@SubcommandGroup({
    parent: 'server',
    name: 'config',
    subcommand: 'set',
    description: 'Cambiar un valor de configuración del servidor',
})

// ❌ EVITAR - Descripciones genéricas
@SubcommandGroup({
    parent: 'server',
    name: 'config',
    subcommand: 'set',
    description: 'Configurar',
})
```

### 5. Jerarquía Clara

```typescript
// ✅ BIEN - Jerarquía lógica de general a específico
parent: 'server'; // General: servidor
name: 'config'; // Categoría: configuración
subcommand: 'set'; // Acción específica: establecer

// ❌ EVITAR - Jerarquía confusa o invertida
parent: 'set'; // Demasiado específico para padre
name: 'server'; // Demasiado general para grupo
subcommand: 'config'; // No es una acción
```

### 6. Evitar Duplicación

```typescript
// ✅ BIEN - Sin redundancia en nombres
/server config get      // Claro y conciso
/server user info

// ❌ EVITAR - Redundancia en nombres
/server server-config get       // "server" repetido
/server get-user-info           // Redundante con la estructura
```

---

## 🔄 Diferencias con Subcomandos Simples

| Característica   | Subcomandos              | Grupos de Subcomandos          |
| ---------------- | ------------------------ | ------------------------------ |
| **Niveles**      | 2 (`comando subcomando`) | 3 (`comando grupo subcomando`) |
| **Decorador**    | `@Subcommand`            | `@SubcommandGroup`             |
| **Propiedades**  | `parent`, `name`         | `parent`, `name`, `subcommand` |
| **Organización** | Plana                    | Jerárquica con grupos          |
| **Complejidad**  | Simple                   | Compleja                       |
| **Capacidad**    | ~25 subcomandos          | ~625 comandos (25×25)          |
| **Uso típico**   | Operaciones simples      | Sistemas complejos             |

### Cuándo Migrar de Subcomandos a Grupos

Considera migrar cuando:

1. **Tienes >10 subcomandos** bajo un mismo padre
2. **Los subcomandos pueden categorizarse** claramente
3. **La navegación se vuelve confusa** para los usuarios
4. **Planeas agregar más funcionalidades** en el futuro

### Ejemplo de Migración

**Antes (con `@Subcommand`):**

```
/admin kick
/admin ban
/admin warn
/admin mute
/admin config-set
/admin config-get
/admin role-add
/admin role-remove
// 8+ comandos en un nivel
```

**Después (con `@SubcommandGroup`):**

```
/admin moderation kick
/admin moderation ban
/admin moderation warn
/admin config set
/admin config get
/admin roles add
/admin roles remove
// Organizado en grupos lógicos
```

---

## 🎯 Casos de Uso Reales

### 1. Bot de Administración

```
/admin
  ├─ server (configuración del servidor)
  │   ├─ settings
  │   ├─ backup
  │   └─ restore
  ├─ members (gestión de miembros)
  │   ├─ list
  │   ├─ info
  │   └─ roles
  └─ moderation (moderación)
      ├─ warn
      ├─ kick
      └─ ban
```

### 2. Bot de Música

```
/music
  ├─ player (control del reproductor)
  │   ├─ play
  │   ├─ pause
  │   └─ stop
  ├─ queue (gestión de cola)
  │   ├─ view
  │   ├─ clear
  │   └─ shuffle
  └─ settings (configuración)
      ├─ volume
      ├─ loop
      └─ filter
```

### 3. Bot de Utilidades

```
/tools
  ├─ image (manipulación de imágenes)
  │   ├─ resize
  │   ├─ filter
  │   └─ meme
  ├─ text (manipulación de texto)
  │   ├─ reverse
  │   ├─ uppercase
  │   └─ translate
  └─ math (calculadora)
      ├─ calc
      ├─ convert
      └─ random
```

---

## 📚 Recursos Adicionales

- [Subcomandos Simples](./Subcommands.README.md) - Para anidamiento de 2 niveles
- [Decoradores de Comandos](../src/core/decorators/README.md) - Documentación de decoradores
- [Ejemplos de Comandos](../src/commands/README.md) - Más ejemplos prácticos

---

## ❓ FAQ

### ¿Puedo mezclar subcomandos y grupos en el mismo comando padre?

No, Discord no permite mezclar. Debes elegir entre usar solo subcomandos (`@Subcommand`) o solo grupos (`@SubcommandGroup`) para un comando padre.

### ¿Cuándo debo usar grupos en lugar de múltiples comandos base?

Usa grupos cuando las funcionalidades estén fuertemente relacionadas y compartan contexto. Por ejemplo, todas las operaciones de "server" bajo `/server` en lugar de `/server-config`, `/server-users`, etc.

### ¿Los grupos heredan permisos?

No automáticamente. Debes aplicar `@RequirePermissions` a cada subcomando individual si necesitas control de permisos.

### ¿Puedo tener argumentos en el grupo?

No, solo los subcomandos (nivel 3) pueden tener argumentos. Los niveles 1 y 2 son solo para organización.

### ¿Cómo decido entre 2 o 3 niveles?

- **2 niveles** (`@Subcommand`): ≤ 10 comandos relacionados simples
- **3 niveles** (`@SubcommandGroup`): > 10 comandos o múltiples categorías claras

### ¿Necesito crear un comando base para los grupos?

**No es necesario.** El sistema crea automáticamente "comandos fantasma" cuando detecta grupos sin comando base:

```typescript
// Solo defines esto:
@SubcommandGroup({
    parent: 'server',  // No existe como @Command
    name: 'config',
    subcommand: 'get',
    description: 'Ver configuración del servidor'
})
```

El sistema:

1. Detecta que `server` no existe como comando base
2. Crea automáticamente `/server` en Discord como contenedor
3. Registra el grupo `config` con su subcomando `get`
4. Log: `👻 Comando fantasma creado: "server" (solo contenedor de subcomandos)`

**Ventaja:** Puedes crear jerarquías complejas sin archivos vacíos de comandos base.

---

**Versión:** 1.1.0  
**Última actualización:** 2025-11-12
