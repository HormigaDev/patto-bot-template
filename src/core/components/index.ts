/**
 * Sistema de componentes interactivos
 *
 * Los handlers son **métodos estáticos** del comando que crea el componente,
 * con prefijo según el tipo (`button*`, `select*`, `modal*`). No hay
 * registro en runtime: el dispatcher resuelve el handler vía
 * `CommandLoader.getCommand(commandKey)` + lookup directo en la clase.
 *
 * Cada instancia solo guarda un `payload` (datos serializables) en un
 * {@link PayloadStore}. La implementación por defecto es in-memory; se
 * puede reemplazar por Redis/Mongo respetando el contrato del store.
 *
 * Formato del customId: `<commandKey>:<methodName>:<id>`
 *
 * @example Botón
 * ```ts
 * import { Button, ButtonVariant } from '@/core/components';
 *
 * export class MyCommand extends BaseCommand {
 *     // Handler estático: vive en la app, no se registra en runtime
 *     public static async buttonGreet(
 *         interaction: ButtonInteraction,
 *         payload: { msg: string } | undefined,
 *     ) {
 *         if (payload === undefined) {
 *             await BaseCommand.replyEphemeral(interaction, 'Expirado');
 *             return;
 *         }
 *         await interaction.reply(payload.msg);
 *     }
 *
 *     async run() {
 *         const button = new Button({
 *             label: 'Click me',
 *             variant: ButtonVariant.Primary,
 *             command: 'my',           // clave en CommandLoader
 *             method: 'buttonGreet',   // método estático
 *             payload: { msg: '¡Hola!' },
 *         });
 *         // ... agregar al RichMessage
 *     }
 * }
 * ```
 *
 * @example Select menu
 * ```ts
 * export class MyCommand extends BaseCommand {
 *     public static async selectPick(
 *         interaction: StringSelectMenuInteraction,
 *         values: string[],
 *         payload: { menu: string } | undefined,
 *     ) {
 *         await interaction.reply(`En menú ${payload?.menu} elegiste ${values[0]}`);
 *     }
 *
 *     async run() {
 *         const select = new Select({
 *             command: 'my',
 *             method: 'selectPick',
 *             payload: { menu: 'main' },
 *             placeholder: 'Elige...',
 *             options: [
 *                 { label: 'Opción 1', value: '1' },
 *                 { label: 'Opción 2', value: '2' },
 *             ],
 *         });
 *     }
 * }
 * ```
 *
 * @example Modal
 * ```ts
 * import { Modal, TextInputStyle } from '@/core/components';
 *
 * export class MyCommand extends BaseCommand {
 *     public static async modalContact(
 *         interaction: ModalSubmitInteraction,
 *         payload: { topic: string } | undefined,
 *     ) {
 *         const name = interaction.fields.getTextInputValue('name');
 *         await interaction.reply(`Hola ${name}, tema: ${payload?.topic}`);
 *     }
 *
 *     async run() {
 *         const modal = new Modal({
 *             command: 'my',
 *             method: 'modalContact',
 *             title: 'Formulario',
 *             payload: { topic: 'soporte' },
 *             fields: [{ customId: 'name', label: 'Nombre', style: TextInputStyle.Short }],
 *         });
 *         await modal.commit();
 *         await this.ctx.interaction.showModal(modal.getBuilder());
 *     }
 * }
 * ```
 */

export { Button, ButtonVariant, type ButtonOptions } from './Button';
export { Select, type SelectOptions, type SelectOption } from './Select';
export { Modal, type ModalOptions, type ModalFieldOptions } from './Modal';
export {
    RichMessage,
    NEVER_EXPIRES,
    type RichMessageOptions,
    type RichMessageTimeout,
} from './RichMessage';
export { TextInputStyle } from 'discord.js';
export { ComponentRegistry } from '@/core/registry/component.registry';
export type {
    ComponentOwner,
    ComponentType,
    ParsedCustomId,
} from '@/core/registry/component.registry';
export { MemoryPayloadStore, type PayloadStore } from '@/core/store/payload.store';
