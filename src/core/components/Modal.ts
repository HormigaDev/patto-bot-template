import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { ComponentRegistry } from '@/core/registry/component.registry';
import { generateId } from '@/utils/Id';

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
 * Opciones para crear un modal.
 *
 * El handler de un modal es un **método estático** del comando, con prefijo
 * `modal*`. La instancia solo guarda un `payload`.
 */
export interface ModalOptions<P = unknown> {
    title: string;
    fields: ModalFieldOptions[];
    /**
     * Clave kebab-case del comando que expone el método estático handler
     */
    command: string;
    /**
     * Nombre exacto del método estático que maneja el submit. Debe empezar
     * con `modal` (ej. `'modalContact'`).
     */
    method: string;
    /**
     * Payload asociado a esta instancia. Recordá llamar {@link Modal.commit}
     * antes de mostrar el modal con `interaction.showModal()`.
     */
    payload?: P;
    /**
     * TTL del payload en milisegundos. Recomendado para modales ya que la
     * destrucción manual no siempre se da (el usuario puede no enviarlo).
     */
    ttl?: number;
}

/**
 * Wrapper para crear modales de Discord.
 *
 * Los handlers son métodos estáticos en la clase del comando con prefijo
 * `modal*`. La instancia solo guarda payload — cero closures.
 *
 * @example
 * ```ts
 * export class ContactCommand extends BaseCommand {
 *     public static async modalContact(
 *         interaction: ModalSubmitInteraction,
 *         payload: { topic: string } | undefined,
 *     ) {
 *         if (payload === undefined) {
 *             await BaseCommand.replyEphemeral(interaction, 'Formulario expirado');
 *             return;
 *         }
 *         const name = interaction.fields.getTextInputValue('name');
 *         await interaction.reply(`Gracias ${name}! Tema: ${payload.topic}`);
 *     }
 *
 *     async run() {
 *         const modal = new Modal({
 *             command: 'contact',
 *             method: 'modalContact',
 *             title: 'Formulario de Contacto',
 *             payload: { topic: 'soporte' },
 *             fields: [...],
 *         });
 *         await modal.commit();
 *         await this.ctx.interaction.showModal(modal.getBuilder());
 *     }
 * }
 * ```
 */
export class Modal<P = unknown> {
    private customId: string;
    private builder: ModalBuilder;
    private command: string;
    private method: string;
    private payload?: P;
    private ttl?: number;

    constructor(options: ModalOptions<P>) {
        if (!options.command || !options.method) {
            throw new Error(
                'Los modales requieren "command" (clave del comando) y "method" (nombre del método estático).',
            );
        }
        if (!options.method.startsWith('modal')) {
            throw new Error(
                `El método "${options.method}" no es válido para un modal: debe empezar con "modal".`,
            );
        }

        this.command = options.command;
        this.method = options.method;
        this.payload = options.payload;
        this.ttl = options.ttl;
        this.customId = ComponentRegistry.buildCustomId(
            options.command,
            options.method,
            generateId(10),
        );

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
     * Actualiza el payload asociado a esta instancia (en memoria local).
     * Para persistirlo en el store llamar {@link Modal.commit}.
     */
    public setPayload(payload: P): this {
        this.payload = payload;
        return this;
    }

    /**
     * Define el TTL del payload (en milisegundos)
     */
    public setTtl(ms: number): this {
        this.ttl = ms;
        return this;
    }

    /**
     * Persiste el payload en el {@link PayloadStore}.
     * Llamar antes de `interaction.showModal()`.
     *
     * @param defaultTtl TTL a usar si la instancia no definió uno propio
     */
    public async commit(defaultTtl?: number): Promise<void> {
        if (this.payload === undefined) {
            await ComponentRegistry.deletePayload(this.customId);
            return;
        }
        await ComponentRegistry.setPayload(this.customId, this.payload, this.ttl ?? defaultTtl);
    }

    /**
     * Elimina el payload del store
     */
    public async destroy(): Promise<void> {
        await ComponentRegistry.deletePayload(this.customId);
    }

    /**
     * Obtiene el ModalBuilder en formato JSON
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
     * Obtiene la clave del comando handler
     */
    public getCommand(): string {
        return this.command;
    }

    /**
     * Obtiene el nombre del método estático handler
     */
    public getMethod(): string {
        return this.method;
    }

    /**
     * Indica si la instancia tiene un payload definido. `undefined` cuenta
     * como ausencia; cualquier otro valor (incluyendo `null`/`false`/`0`/`''`)
     * cuenta como payload presente.
     */
    public hasPayload(): boolean {
        return this.payload !== undefined;
    }
}
