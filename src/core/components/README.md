# Sistema de Componentes Interactivos

## 📖 Descripción

Este sistema proporciona **wrappers** para crear componentes interactivos de Discord (botones, selects, modales) con **callbacks inline**, eliminando la necesidad de crear archivos separados para cada componente.

## 🎯 Problema que Resuelve

**Antes (sin este sistema):**

```
src/
├── buttons/
│   ├── helpButton.button.ts      ❌ Archivo por cada botón
│   ├── pageNextButton.button.ts  ❌ Difícil de mantener
│   └── confirmButton.button.ts   ❌ Información en customId
└── selects/
    └── categorySelect.select.ts  ❌ Archivo por cada select
```

**Ahora (con este sistema):**

```typescript
// ✅ Todo en el mismo archivo del comando
const button = Button.primary('Next Page').onClick(async (interaction) => {
    // Lógica inline
});

const select = new Select({...}).onChange(async (interaction, values) => {
    // Lógica inline
});
```

## 🏗️ Arquitectura

```
core/
├── components/
│   ├── Button.ts           # Wrapper para botones
│   ├── Select.ts           # Wrapper para selects
│   └── index.ts            # Exports
├── registry/
│   └── component.registry.ts  # Registry global (customId → callback)
└── events/
    └── interactionCreate.event.ts  # Handler integrado de interacciones
```

## 🔧 Componentes

### RichMessage Wrapper

**Wrapper para mensajes con componentes interactivos** que gestiona el ciclo de vida de todos los componentes de forma centralizada con **un solo timeout global**.

#### ¿Por qué usar RichMessage?

**Problema:** Cada componente individual crea su propio `setTimeout()`, lo que puede causar múltiples timeouts ejecutándose simultáneamente.

```typescript
// ❌ SIN RichMessage: 5 setTimeout() diferentes
const btn1 = Button.primary('A').onClick(callback).setTimeout(Times.minutes(1));
const btn2 = Button.success('B').onClick(callback).setTimeout(Times.minutes(1));
const btn3 = Button.danger('C').onClick(callback).setTimeout(Times.minutes(1));
const select = new Select({...}).onChange(callback).setTimeout(Times.minutes(1));
const btn4 = Button.secondary('D').onClick(callback).setTimeout(Times.minutes(1));
// = 5 timeouts activos ❌
```

```typescript
// ✅ CON RichMessage: 1 SOLO setTimeout()
const richMsg = new RichMessage({
    components: [btn1, btn2, btn3, select, btn4],
    timeout: Times.minutes(1),
});
// = 1 timeout activo ✅
```

#### Interfaz

```typescript
interface RichMessageOptions {
    content?: string;
    embeds?: EmbedBuilder[];
    components?: (Button | Select)[];
    timeout?: number; // Timeout global en milisegundos
}
```

#### Ejemplo Básico

```typescript
import { RichMessage, Button, Select } from '@/core/components';
import { Times } from '@/utils/Times';

// Crear componentes (no necesitan timeout individual)
const btn1 = Button.primary('Opción A', '🅰️').onClick(async (interaction) => {
    await interaction.reply('Seleccionaste A');
});

const btn2 = Button.success('Opción B', '🅱️').onClick(async (interaction) => {
    await interaction.reply('Seleccionaste B');
});

const select = new Select({
    placeholder: 'Elige un color',
    options: [
        { label: 'Rojo', value: 'red', emoji: '🔴' },
        { label: 'Azul', value: 'blue', emoji: '🔵' },
    ],
}).onChange(async (interaction, values) => {
    await interaction.reply(`Color: ${values[0]}`);
});

// Crear RichMessage con timeout global
const richMsg = new RichMessage({
    content: 'Mensaje con componentes',
    embeds: [embed],
    components: [btn1, btn2, select],
    timeout: Times.minutes(2), // Timeout único para TODOS los componentes
});

// Enviar mensaje
await richMsg.send(this.ctx);
// Después de 2 minutos: TODOS los componentes se eliminan automáticamente
```

**Nota sobre `send()`:** El método detecta automáticamente el tipo de target:

-   Si es una **interacción** (con `followUp`): Usa `followUp()` para evitar referencias a mensajes eliminados
-   Si es un **contexto** o similar (con `reply`): Usa `reply()`
-   Si es un **canal** (con `send`): Usa `send()`

#### ¿Qué hace RichMessage cuando expira el timeout?

1. **Limpia el registry primero:** Elimina todos los `customId` del `ComponentRegistry`
2. **Actualiza el mensaje:** Elimina los componentes visuales del mensaje en Discord
3. **Evita memory leaks:** Libera las referencias a callbacks

```typescript
// Cuando expira el timeout, esto sucede automáticamente:
private async destroyAll(): Promise<void> {
    // 1. Limpiar registry
    for (const component of this.components) {
        component.destroy(); // Elimina del registry
    }

    // 2. Actualizar mensaje en Discord
    const msg = await this.getMessage();
    await msg.edit({ components: [] }); // Remover componentes visuales
}
```

#### Ejemplo Avanzado: Panel de Control

```typescript
const adminPanel = new RichMessage({
    embeds: [
        new EmbedBuilder()
            .setTitle('🛡️ Panel de Administración')
            .setDescription('Selecciona una acción')
            .setColor('#5180d6'),
    ],
    components: [
        Button.danger('Ban User', '🔨').onClick(async (i) => {
            await i.reply('Iniciando proceso de ban...');
        }),
        Button.secondary('Mute User', '🔇').onClick(async (i) => {
            await i.reply('Iniciando proceso de mute...');
        }),
        Button.success('Verify User', '✅').onClick(async (i) => {
            await i.reply('Verificando usuario...');
        }),
        new Select({
            placeholder: 'Acciones avanzadas',
            options: [
                { label: 'Ver Logs', value: 'logs', emoji: '📝' },
                { label: 'Configuración', value: 'config', emoji: '⚙️' },
                { label: 'Estadísticas', value: 'stats', emoji: '📊' },
            ],
        }).onChange(async (i, values) => {
            await i.reply(`Acción: ${values[0]}`);
        }),
    ],
    timeout: Times.minutes(5), // Panel disponible por 5 minutos
});

await adminPanel.send(channel);
```

#### Ventajas de RichMessage

-   ✅ **Mejor performance:** 1 timeout en lugar de N timeouts
-   ✅ **Auto-reset automático:** El timeout se reinicia en cada interacción (patrón DRY)
-   ✅ **Sin código repetitivo:** No necesitas llamar `resetTimeout()` manualmente
-   ✅ **Menos memoria:** Solo un `NodeJS.Timeout` activo
-   ✅ **Limpieza coordinada:** Todos los componentes se eliminan al mismo tiempo
-   ✅ **Gestión centralizada:** Un solo lugar controla el ciclo de vida
-   ✅ **Manejo robusto de errores:** Gestiona mensajes eliminados sin crashear
-   ✅ **Silencioso:** Sin logs innecesarios que saturen la consola en producción

#### Auto-Reset del Timeout

RichMessage **intercepta automáticamente** todos los callbacks de los componentes y resetea el timeout después de cada interacción:

```typescript
// ✅ El timeout se resetea automáticamente (sin código extra)
const btn = Button.primary('Click').onClick(async (interaction) => {
    await interaction.reply('Clickeado!');
    // NO necesitas llamar resetTimeout() - es automático
});

const richMsg = new RichMessage({
    components: [btn],
    timeout: Times.minutes(2),
});
// Cada vez que el usuario interactúe, el timeout de 2 minutos se reinicia
```

**Cómo funciona internamente:**

1. RichMessage wrappea los callbacks originales
2. Ejecuta el callback del usuario
3. Resetea el timeout automáticamente
4. ¡Todo transparente para el usuario!

#### Editar un RichMessage Existente

Puedes editar el contenido, embeds o componentes de un mensaje ya enviado usando el método `edit()`:

```typescript
const richMsg = new RichMessage({
    embeds: [welcomeEmbed],
    components: [categorySelect],
    timeout: Times.minutes(2),
});

await richMsg.send(this.ctx);

// Más tarde, editar el mensaje
await richMsg.edit({
    embeds: [detailEmbed],
    components: [backButton, nextButton], // Reemplaza los componentes
    timeout: Times.seconds(10), // Nuevo timeout
});

// Eliminar todos los componentes (sin timeout)
await richMsg.edit({
    embeds: [finalEmbed],
    components: [], // Array vacío elimina todos los componentes
});
```

**Características del método `edit()`:**

-   ✅ **Destruye componentes antiguos:** Limpia automáticamente los componentes anteriores del registry
-   ✅ **Registra nuevos componentes:** Wrappea los callbacks de los nuevos componentes con auto-reset
-   ✅ **Gestiona timeout automáticamente:**
    -   Si `components.length > 0`: Reinicia el timeout
    -   Si `components.length === 0`: Elimina el timeout completamente
-   ✅ **Actualiza el mensaje:** Edita el mensaje en Discord con el nuevo contenido
-   ✅ **Parámetros opcionales:** Solo necesitas pasar lo que quieres cambiar

**Ejemplo de paginación con edit():**

```typescript
let currentPage = 0;
const totalPages = 5;

const renderPage = async (page: number) => {
    currentPage = page;

    const prevBtn = Button.secondary('Anterior', '⬅️')
        .setDisabled(currentPage === 0)
        .onClick(async (interaction) => {
            await renderPage(currentPage - 1);
            await interaction.deferUpdate();
        });

    const nextBtn = Button.secondary('Siguiente', '➡️')
        .setDisabled(currentPage === totalPages - 1)
        .onClick(async (interaction) => {
            await renderPage(currentPage + 1);
            await interaction.deferUpdate();
        });

    await richMsg.edit({
        embeds: [createPageEmbed(currentPage)],
        components: [prevBtn, nextBtn],
    });
};

// Iniciar con primera página
await renderPage(0);
```

#### ¿Cuándo usar RichMessage?

| Situación                              | Usar RichMessage | Componentes Standalone |
| -------------------------------------- | :--------------: | :--------------------: |
| Mensaje con múltiples componentes (≥2) |        ✅        |           ⚠️           |
| Panel de control o navegación          |        ✅        |           ⚠️           |
| Formulario con botones y selects       |        ✅        |           ⚠️           |
| Necesitas auto-reset de timeout        |        ✅        |           ❌           |
| Botón individual en respuesta rápida   |        ⚠️        |           ✅           |

### Button Wrapper

Wrapper para crear botones con callbacks inline.

#### Variantes Disponibles

```typescript
enum ButtonVariant {
    Primary = ButtonStyle.Primary, // Azul (morado en algunos clientes)
    Secondary = ButtonStyle.Secondary, // Gris
    Success = ButtonStyle.Success, // Verde
    Danger = ButtonStyle.Danger, // Rojo
    Link = ButtonStyle.Link, // Link (abre URL)
}
```

#### Métodos Estáticos

```typescript
Button.primary(label: string, emoji?: string): Button
Button.secondary(label: string, emoji?: string): Button
Button.success(label: string, emoji?: string): Button
Button.danger(label: string, emoji?: string): Button
Button.link(label: string, url: string, emoji?: string): Button
```

#### Ejemplo Básico

```typescript
import { Button } from '@/core/components';

const button = Button.primary('Click me', '🔵').onClick(async (interaction) => {
    await interaction.reply('¡Clickeado!');
});

// Usar en mensaje
await channel.send({
    content: 'Mensaje con botón',
    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button.getBuilder())],
});
```

**Nota:** Los botones individuales NO tienen timeout automático. Para gestión de timeout, usa `RichMessage`.

#### Ejemplo Avanzado

```typescript
// Botón que se deshabilita después de ser clickeado
const confirmBtn = Button.danger('Confirmar Eliminación', '🗑️').onClick(async (interaction) => {
    // Deshabilitar el botón
    confirmBtn.disable();

    await interaction.update({
        content: '✅ Elemento eliminado',
        components: [], // Remover componentes
    });

    // Hacer la acción
    await deleteItem();
});
    });

    // Hacer la acción
    await deleteItem();
});
```

### Select Wrapper

Wrapper para crear select menus con callbacks inline.

#### Interfaz de Opciones

```typescript
interface SelectOption {
    label: string;
    value: string;
    description?: string;
    emoji?: string;
    default?: boolean;
}

interface SelectOptions {
    placeholder?: string;
    minValues?: number;
    maxValues?: number;
    disabled?: boolean;
    options: SelectOption[];
}
```

#### Ejemplo Básico

```typescript
import { Select } from '@/core/components';

const select = new Select({
    placeholder: 'Elige una opción',
    options: [
        { label: 'Opción 1', value: 'opt1', emoji: '1️⃣' },
        { label: 'Opción 2', value: 'opt2', emoji: '2️⃣' },
        { label: 'Opción 3', value: 'opt3', emoji: '3️⃣' },
    ],
}).onChange(async (interaction, values) => {
    await interaction.reply(`Seleccionaste: ${values[0]}`);
});

// Usar en mensaje
await channel.send({
    content: 'Elige una opción',
    components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select.getBuilder()),
    ],
});
```

#### Ejemplo Avanzado: Sistema de Ayuda

```typescript
const helpSelect = new Select({
    placeholder: 'Selecciona una categoría',
    options: [
        {
            label: 'Moderación',
            value: 'moderation',
            description: 'Comandos de moderación',
            emoji: '🛡️',
        },
        {
            label: 'Utilidades',
            value: 'utility',
            description: 'Comandos útiles',
            emoji: '🔧',
        },
        {
            label: 'Diversión',
            value: 'fun',
            description: 'Comandos de entretenimiento',
            emoji: '🎮',
        },
    ],
}).onChange(async (interaction, values) => {
    const category = values[0];

    const commands = {
        moderation: ['ban', 'kick', 'mute', 'warn'],
        utility: ['ping', 'info', 'userinfo'],
        fun: ['meme', 'joke', '8ball'],
    };

    const embed = new EmbedBuilder()
        .setTitle(`📚 Comandos de ${category}`)
        .setDescription(commands[category].map((cmd) => `\`/${cmd}\``).join(', '));

    await interaction.reply({ embeds: [embed], ephemeral: true });
});
```

### Modal Wrapper

Wrapper para crear modales (formularios) con callbacks inline.

#### Interfaz de Opciones

```typescript
interface ModalOptions {
    title: string;
    fields: ModalFieldOptions[];
}

interface ModalFieldOptions {
    customId: string;
    label: string;
    style?: TextInputStyle;
    placeholder?: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    value?: string;
}
```

#### Estilos de TextInput

```typescript
enum TextInputStyle {
    Short = 1, // Texto corto (una línea)
    Paragraph = 2, // Texto largo (múltiples líneas)
}
```

#### Ejemplo Básico

```typescript
import { Modal, TextInputStyle } from '@/core/components';

const modal = new Modal({
    title: 'Formulario de Contacto',
    fields: [
        {
            customId: 'name',
            label: 'Tu Nombre',
            style: TextInputStyle.Short,
            placeholder: 'Escribe tu nombre aquí',
            required: true,
            minLength: 2,
            maxLength: 50,
        },
        {
            customId: 'message',
            label: 'Mensaje',
            style: TextInputStyle.Paragraph,
            placeholder: 'Escribe tu mensaje aquí...',
            required: true,
            minLength: 10,
            maxLength: 1000,
        },
    ],
}).onSubmit(async (interaction) => {
    const name = interaction.fields.getTextInputValue('name');
    const message = interaction.fields.getTextInputValue('message');

    await interaction.reply({
        content: `Gracias **${name}**!\n\nTu mensaje:\n${message}`,
        ephemeral: true,
    });
});

// Botón que abre el modal
const openModalBtn = Button.secondary('Abrir Formulario', '📝').onClick(async (interaction) => {
    await interaction.showModal(modal.getBuilder());
});
```

#### Ejemplo Avanzado: Formulario de Reporte

```typescript
const reportModal = new Modal({
    title: '🚨 Reportar Usuario',
    fields: [
        {
            customId: 'user_id',
            label: 'ID del Usuario',
            style: TextInputStyle.Short,
            placeholder: '123456789012345678',
            required: true,
            minLength: 17,
            maxLength: 19,
        },
        {
            customId: 'reason',
            label: 'Razón del Reporte',
            style: TextInputStyle.Short,
            placeholder: 'Ej: Spam, Acoso, etc.',
            required: true,
            maxLength: 100,
        },
        {
            customId: 'details',
            label: 'Detalles',
            style: TextInputStyle.Paragraph,
            placeholder: 'Describe lo que sucedió...',
            required: true,
            minLength: 20,
            maxLength: 2000,
        },
        {
            customId: 'evidence',
            label: 'Evidencia (URLs)',
            style: TextInputStyle.Paragraph,
            placeholder: 'Links a mensajes, imágenes, etc.',
            required: false,
            maxLength: 500,
        },
    ],
})
    .onSubmit(async (interaction) => {
        const userId = interaction.fields.getTextInputValue('user_id');
        const reason = interaction.fields.getTextInputValue('reason');
        const details = interaction.fields.getTextInputValue('details');
        const evidence = interaction.fields.getTextInputValue('evidence');

        // Enviar reporte al canal de moderación
        const modChannel = interaction.guild?.channels.cache.get('MOD_CHANNEL_ID');

        const embed = new EmbedBuilder()
            .setTitle('🚨 Nuevo Reporte')
            .setColor('#ca5c5c')
            .addFields(
                { name: '👤 Usuario Reportado', value: `<@${userId}>`, inline: true },
                { name: '👮 Reportado Por', value: interaction.user.tag, inline: true },
                { name: '📝 Razón', value: reason },
                { name: '📋 Detalles', value: details },
            )
            .setTimestamp();

        if (evidence) {
            embed.addFields({ name: '🔗 Evidencia', value: evidence });
        }

        await modChannel?.send({ embeds: [embed] });

        await interaction.reply({
            content: '✅ Reporte enviado al equipo de moderación',
            ephemeral: true,
        });
    })
    .setTimeout(Times.minutes(5)); // Los modales pueden tener más tiempo

// Botón que abre el modal de reporte
const reportBtn = Button.danger('Reportar Usuario', '🚨').onClick(async (interaction) => {
    await interaction.showModal(reportModal.getBuilder());
});
```

#### Características de Modal

-   ✅ Soporte para múltiples campos (máximo 5)
-   ✅ Validación automática (minLength, maxLength, required)
-   ✅ Dos estilos: Short (una línea) y Paragraph (multilínea)
-   ✅ Placeholders y valores por defecto
-   ✅ Timeout automático (1 minuto por defecto)
-   ✅ Se abre con `interaction.showModal(modal.getBuilder())`

#### Notas Importantes sobre Modales

1. **Los modales NO se agregan a componentes del mensaje:**

    ```typescript
    // ❌ INCORRECTO
    await this.reply({
        components: [modal], // No funciona así
    });

    // ✅ CORRECTO: Se abren desde un botón
    const btn = Button.primary('Abrir Modal').onClick(async (i) => {
        await i.showModal(modal.getBuilder());
    });
    ```

2. **El timeout del modal es independiente:**

    ```typescript
    // Modal con timeout largo (el usuario puede tardar en completarlo)
    const modal = new Modal({...})
        .onSubmit(callback)
        .setTimeout(Times.minutes(10)); // 10 minutos para completar el formulario
    ```

3. **Los modales NO se pueden usar dentro de RichMessage** porque no son componentes de mensaje:

    ```typescript
    // ❌ NO FUNCIONA
    new RichMessage({
        components: [button, modal], // Modal no es un componente de mensaje
    });

    // ✅ CORRECTO: Botón abre el modal
    const btn = Button.primary('Form').onClick(async (i) => {
        await i.showModal(modal.getBuilder());
    });

    new RichMessage({
        components: [btn], // Solo el botón
    });
    ```

## 🔄 ComponentRegistry

Registry global que almacena `customId → callback`.

### Métodos Públicos

```typescript
class ComponentRegistry {
    // Registrar componentes
    static registerButton(customId: string, callback: ButtonCallback): void;
    static registerSelect(customId: string, callback: SelectCallback): void;
    static registerModal(customId: string, callback: ModalCallback): void;

    // Obtener callbacks
    static getButton(customId: string): ButtonCallback | undefined;
    static getSelect(customId: string): SelectCallback | undefined;
    static getModal(customId: string): ModalCallback | undefined;

    // Limpiar
    static unregisterButton(customId: string): void;
    static unregisterSelect(customId: string): void;
    static unregisterModal(customId: string): void;
    static clear(): void;

    // Estadísticas
    static getStats(): { buttons: number; selects: number; modals: number; total: number };
}
```

### Uso Interno

**No necesitas usar el registry manualmente**, los wrappers lo hacen automáticamente:

```typescript
// ✅ CORRECTO: El wrapper registra automáticamente
const button = Button.primary('Click').onClick(callback);

// ❌ INCORRECTO: No registres manualmente
ComponentRegistry.registerButton('btn_123', callback); // NO HAGAS ESTO
```

## 📡 Event Handler

El archivo `interactionCreate.event.ts` maneja todos los tipos de interacciones en un solo lugar:

```typescript
// Slash commands
if (interaction.isChatInputCommand()) {
    // Ejecutar comando
}

// Botones
if (interaction.isButton()) {
    const callback = ComponentRegistry.getButton(interaction.customId);
    if (callback) await callback(interaction);
}

// Selects
if (interaction.isStringSelectMenu()) {
    const callback = ComponentRegistry.getSelect(interaction.customId);
    if (callback) await callback(interaction, interaction.values);
}

// Modales
if (interaction.isModalSubmit()) {
    const callback = ComponentRegistry.getModal(interaction.customId);
    if (callback) await callback(interaction);
}
```

**Ventajas de este enfoque:**

-   ✅ Un solo evento para todas las interacciones
-   ✅ Flujo profesional y limpio
-   ✅ Manejo de errores centralizado
-   ✅ Fácil de mantener y debuggear

## 🎮 Ejemplo Completo: Paginación

```typescript
import { RichMessage, Button } from '@/core/components';
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from 'discord.js';
import { Times } from '@/utils/Times';

export class ListCommand extends ListDefinition {
    public async run(): Promise<void> {
        const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];
        let currentPage = 0;
        const pageSize = 2;
        const totalPages = Math.ceil(items.length / pageSize);

        const createEmbed = (page: number): EmbedBuilder => {
            const start = page * pageSize;
            const end = start + pageSize;
            const pageItems = items.slice(start, end);

            return this.getEmbed('info')
                .setTitle(`📋 Lista de Items (Página ${page + 1}/${totalPages})`)
                .setDescription(pageItems.join('\n'));
        };

        // Botones de navegación
        const prevBtn = Button.secondary('◀️ Anterior').onClick(async (interaction) => {
            if (currentPage > 0) {
                currentPage--;
                await interaction.update({
                    embeds: [createEmbed(currentPage)],
                });
            }
        });

        const nextBtn = Button.secondary('Siguiente ▶️').onClick(async (interaction) => {
            if (currentPage < totalPages - 1) {
                currentPage++;
                await interaction.update({
                    embeds: [createEmbed(currentPage)],
                });
            }
        });

        const deleteBtn = Button.danger('🗑️ Cerrar').onClick(async (interaction) => {
            await interaction.update({
                content: '✅ Lista cerrada',
                embeds: [],
                components: [],
            });
        });

        // Usar RichMessage para gestión centralizada
        const richMsg = new RichMessage({
            embeds: [createEmbed(currentPage)],
            components: [prevBtn, nextBtn, deleteBtn],
            timeout: Times.minutes(10), // Timeout único para los 3 botones
        });

        await richMsg.send(this.ctx);
    }
}
```

## ⚠️ Consideraciones Importantes

### 1. Sistema de Timeout

#### ⚠️ Componentes Individuales NO tienen timeout

```typescript
// ❌ Los componentes individuales NO expiran automáticamente
const button = Button.primary('Click').onClick(callback);
const select = new Select({...}).onChange(callback);

await channel.send({
    components: [buttonRow] // Estos NO tienen timeout
});
```

**Los componentes quedan registrados indefinidamente** hasta que:

-   Se llame manualmente a `.destroy()`
-   Se reinicie el bot
-   Se limpie el `ComponentRegistry` manualmente

#### ✅ RichMessage SÍ tiene timeout con auto-reset

```typescript
// ✅ RichMessage gestiona timeout automáticamente
const button = Button.primary('Click').onClick(async (i) => {
    await i.reply('Clickeado!');
    // El timeout se resetea automáticamente (DRY)
});

const richMsg = new RichMessage({
    components: [button],
    timeout: Times.minutes(2), // Timeout global con auto-reset
});
```

**Características del timeout en RichMessage:**

-   ⏱️ **Timeout global único** para todos los componentes
-   🔄 **Auto-reset automático** en cada interacción (sin código extra)
-   🧹 **Limpieza coordinada** de todos los componentes al expirar
-   🛡️ **Manejo robusto** de mensajes eliminados (sin crashes)
-   🚀 **Mejor performance** (1 timeout en lugar de N)

**RichMessage elimina todos los componentes cuando:**

-   ⏱️ **Expira el timeout global** (después de inactividad)
-   🗑️ Se llama a `richMessage.destroy()`
-   🔄 Se reinicia el bot

**Nota:** El timeout se **resetea automáticamente** cada vez que el usuario interactúa con cualquier componente.

### 2. IDs Únicos

Los wrappers generan IDs únicos usando `nanoid(10)`:

```typescript
btn_xR3p9kLm2Q; // Botón
select_4kL9pXm1Rq; // Select
```

**No necesitas preocuparte por colisiones** de IDs.

### 3. Limitaciones de Discord

-   **Máximo 5 ActionRows** por mensaje
-   **Máximo 5 botones** por ActionRow
-   **Solo 1 select** por ActionRow
-   Los botones Link no pueden tener callbacks (abren URL directamente)

### 4. Manejo de Errores

El handler de eventos maneja errores automáticamente:

```typescript
try {
    await callback(interaction);
} catch (error) {
    console.error('Error en callback:', error);
    await interaction.reply({
        content: '❌ Ocurrió un error',
        ephemeral: true,
    });
}
```

## 📚 Ejemplos de Uso Real

### Comando de Confirmación

```typescript
const confirmBtn = Button.success('✅ Confirmar').onClick(async (interaction) => {
    await interaction.reply('Acción confirmada');
    // Ejecutar lógica
});

const cancelBtn = Button.danger('❌ Cancelar').onClick(async (interaction) => {
    await interaction.update({
        content: 'Acción cancelada',
        components: [],
    });
});

const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    confirmBtn.getBuilder(),
    cancelBtn.getBuilder(),
);

await this.reply({
    content: '¿Estás seguro de esta acción?',
    components: [row],
});
```

### Select de Configuración

```typescript
const configSelect = new Select({
    placeholder: 'Configurar servidor',
    options: [
        { label: 'Cambiar Prefijo', value: 'prefix', emoji: '🔧' },
        { label: 'Cambiar Idioma', value: 'language', emoji: '🌐' },
        { label: 'Canal de Logs', value: 'logs', emoji: '📝' },
    ],
}).onChange(async (interaction, values) => {
    const option = values[0];

    switch (option) {
        case 'prefix':
            await interaction.reply('Usa `/config prefix <nuevo prefijo>`');
            break;
        case 'language':
            await interaction.reply('Usa `/config language <idioma>`');
            break;
        case 'logs':
            await interaction.reply('Menciona el canal: `/config logs #canal`');
            break;
    }
});
```

## 🚀 Mejores Prácticas

1. **✅ SIEMPRE usa RichMessage para mensajes con componentes:**

    ```typescript
    // ✅ CORRECTO: RichMessage con auto-reset de timeout
    const btn1 = Button.primary('A').onClick(async (i) => {
        await i.reply('Clickeado!');
        // El timeout se resetea automáticamente (DRY)
    });

    const richMsg = new RichMessage({
        components: [btn1, btn2, select],
        timeout: Times.minutes(2),
    });
    await richMsg.send(this.ctx);

    // ❌ EVITAR: Componentes sin RichMessage (sin timeout)
    const btn = Button.primary('A').onClick(callback);
    await channel.send({
        components: [row], // Sin timeout, queda en memoria indefinidamente
    });
    ```

2. **Usa métodos estáticos para botones comunes:**

    ```typescript
    Button.primary('Label'); // ✅
    new Button({ label: 'Label', variant: ButtonVariant.Primary }); // ⚠️ Verbose
    ```

3. **Define timeouts apropiados según el uso:**

    ```typescript
    // Confirmación rápida (30 segundos)
    new RichMessage({
        components: [confirmBtn, cancelBtn],
        timeout: Times.seconds(30),
    });

    // Paginación/navegación (10 minutos)
    new RichMessage({
        components: [prevBtn, nextBtn],
        timeout: Times.minutes(10),
    });

    // Paneles de administración (30 minutos)
    new RichMessage({
        components: [adminButtons],
        timeout: Times.minutes(30),
    });
    ```

4. **Confía en el auto-reset automático:**

    ```typescript
    // ✅ CORRECTO: El timeout se resetea automáticamente
    const btn = Button.primary('Click').onClick(async (interaction) => {
        await interaction.reply('Clickeado!');
        // NO necesitas llamar resetTimeout() manualmente
    });

    new RichMessage({ components: [btn], timeout: Times.minutes(2) });
    // Cada interacción resetea el timeout de 2 minutos automáticamente
    ```

5. **Usa ephemeral para interacciones sensibles:**

    ```typescript
    .onClick(async (interaction) => {
        await interaction.reply({
            content: 'Datos sensibles',
            ephemeral: true, // ✅ Solo visible para el usuario
        });
    });
    ```

6. **Combina con embeds para mejor UX:**

    ```typescript
    const embed = this.getEmbed('info').setTitle('Opciones').setDescription('...');

    new RichMessage({
        embeds: [embed],
        components: [btn1, btn2],
        timeout: Times.minutes(2),
    }).send(this.ctx);
    ```

## 📋 Tipos TypeScript

```typescript
// Callbacks
type ButtonCallback = (interaction: ButtonInteraction) => Promise<void> | void;
type SelectCallback = (
    interaction: StringSelectMenuInteraction,
    values: string[],
) => Promise<void> | void;
type ModalCallback = (interaction: ModalSubmitInteraction) => Promise<void> | void;

// Options
interface ButtonOptions {
    label: string;
    variant?: ButtonVariant | ButtonStyle;
    emoji?: string;
    disabled?: boolean;
    url?: string;
}

interface SelectOptions {
    placeholder?: string;
    minValues?: number;
    maxValues?: number;
    disabled?: boolean;
    options: SelectOption[];
}

interface SelectOption {
    label: string;
    value: string;
    description?: string;
    emoji?: string;
    default?: boolean;
}

interface RichMessageOptions {
    content?: string;
    embeds?: EmbedBuilder[];
    components?: (Button | Select)[];
    timeout?: number; // en milisegundos
}

interface ModalOptions {
    title: string;
    fields: ModalFieldOptions[];
}

interface ModalFieldOptions {
    customId: string;
    label: string;
    style?: TextInputStyle;
    placeholder?: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    value?: string;
}
```

## 📖 Recursos Relacionados

-   `/src/commands/demo.command.ts` - Ejemplo completo de uso (incluye RichMessage)
-   `/src/core/components/RichMessage.ts` - Implementación de RichMessage
-   `/src/core/components/Button.ts` - Implementación de Button
-   `/src/core/components/Select.ts` - Implementación de Select
-   `/src/core/components/Modal.ts` - Implementación de Modal
-   `/src/events/interactionCreate.event.ts` - Handler integrado de eventos
-   `/src/utils/Times.ts` - Utilidad para gestión de tiempos
-   [Discord.js Components](https://discord.js.org/docs/packages/discord.js/main/ActionRowBuilder:Class) - Documentación oficial
