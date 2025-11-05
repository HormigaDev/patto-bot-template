/**
 * Sistema de componentes interactivos
 *
 * Este módulo proporciona wrappers para crear componentes de Discord (botones, selects, modales)
 * con callbacks inline, evitando la necesidad de crear archivos separados para cada componente.
 *
 * @example Botón básico
 * ```ts
 * import { Button, ButtonVariant } from '@/core/components';
 *
 * const button = new Button({
 *     label: 'Click me',
 *     variant: ButtonVariant.Primary,
 * }).onClick(async (interaction) => {
 *     await interaction.reply('¡Clickeado!');
 * });
 * ```
 *
 * @example Select menu
 * ```ts
 * import { Select } from '@/core/components';
 *
 * const select = new Select({
 *     placeholder: 'Elige...',
 *     options: [
 *         { label: 'Opción 1', value: '1' },
 *         { label: 'Opción 2', value: '2' },
 *     ],
 * }).onChange(async (interaction, values) => {
 *     await interaction.reply(`Seleccionaste: ${values[0]}`);
 * });
 * ```
 *
 * @example Modal
 * ```ts
 * import { Modal, TextInputStyle } from '@/core/components';
 *
 * const modal = new Modal({
 *     title: 'Formulario',
 *     fields: [
 *         { customId: 'name', label: 'Nombre', style: TextInputStyle.Short },
 *     ],
 * }).onSubmit(async (interaction) => {
 *     const name = interaction.fields.getTextInputValue('name');
 *     await interaction.reply(`Hola ${name}!`);
 * });
 * ```
 */

export { Button, ButtonVariant, type ButtonOptions } from './Button';
export { Select, type SelectOptions, type SelectOption } from './Select';
export { Modal, type ModalOptions, type ModalFieldOptions } from './Modal';
export { RichMessage, type RichMessageOptions } from './RichMessage';
export { TextInputStyle } from 'discord.js';
export { ComponentRegistry } from '@/core/registry/component.registry';
export type {
    ButtonCallback,
    SelectCallback,
    ModalCallback,
} from '@/core/registry/component.registry';
