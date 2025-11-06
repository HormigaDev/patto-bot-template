import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { ComponentRegistry, type ModalCallback } from '@/core/registry/component.registry';
import { nanoid } from 'nanoid';

/**
 * Opciones para un campo de texto en el modal
 */
export interface ModalFieldOptions {
    customId: string;
    label: string;
    style?: TextInputStyle;
    placeholder?: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    value?: string;
}

/**
 * Opciones para crear un modal
 */
export interface ModalOptions {
    title: string;
    fields: ModalFieldOptions[];
}

/**
 * Wrapper para crear modales de Discord con callbacks inline
 *
 * @example
 * ```ts
 * const modal = new Modal({
 *     title: 'Formulario de Contacto',
 *     fields: [
 *         {
 *             customId: 'name',
 *             label: 'Nombre',
 *             style: TextInputStyle.Short,
 *             required: true,
 *         },
 *         {
 *             customId: 'message',
 *             label: 'Mensaje',
 *             style: TextInputStyle.Paragraph,
 *             required: true,
 *         },
 *     ],
 * }).onSubmit(async (interaction) => {
 *     const name = interaction.fields.getTextInputValue('name');
 *     const message = interaction.fields.getTextInputValue('message');
 *     await interaction.reply(`Gracias ${name}! Mensaje: ${message}`);
 * });
 *
 * await interaction.showModal(modal.getBuilder());
 * ```
 */
export class Modal {
    private customId: string;
    private builder: ModalBuilder;
    private callback?: ModalCallback;
    private options: ModalOptions;

    constructor(options: ModalOptions) {
        this.options = options;
        this.customId = `modal_${nanoid(10)}`;
        this.builder = new ModalBuilder().setCustomId(this.customId).setTitle(options.title);

        // Agregar campos de texto
        for (const field of options.fields) {
            const textInput = new TextInputBuilder()
                .setCustomId(field.customId)
                .setLabel(field.label)
                .setStyle(field.style ?? TextInputStyle.Short);

            if (field.placeholder) {
                textInput.setPlaceholder(field.placeholder);
            }

            if (field.required !== undefined) {
                textInput.setRequired(field.required);
            }

            if (field.minLength !== undefined) {
                textInput.setMinLength(field.minLength);
            }

            if (field.maxLength !== undefined) {
                textInput.setMaxLength(field.maxLength);
            }

            if (field.value !== undefined) {
                textInput.setValue(field.value);
            }

            const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);
            this.builder.addComponents(actionRow);
        }
    }

    /**
     * Define el callback que se ejecutará cuando se envíe el modal
     */
    public onSubmit(callback: ModalCallback): this {
        this.callback = callback;
        ComponentRegistry.registerModal(this.customId, callback);

        return this;
    }

    /**
     * Obtiene el ModalBuilder para mostrar el modal
     */
    public toJSON() {
        return this.builder.toJSON();
    }

    /**
     * Obtiene el ModalBuilder nativo de Discord.js
     */
    public getBuilder(): ModalBuilder {
        return this.builder;
    }

    /**
     * Obtiene el customId del modal
     */
    public getCustomId(): string {
        return this.customId;
    }

    /**
     * Desregistra el modal del registry y limpia el timeout
     */
    public destroy(): void {
        ComponentRegistry.unregisterModal(this.customId);
    }
}
