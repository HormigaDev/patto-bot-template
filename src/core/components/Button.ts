import { ButtonBuilder, ButtonStyle, type APIButtonComponent } from 'discord.js';
import { ComponentRegistry, type ButtonCallback } from '@/core/registry/component.registry';
import { nanoid } from 'nanoid';

/**
 * Estilos de botón disponibles con nombres intuitivos
 */
export enum ButtonVariant {
    Primary = ButtonStyle.Primary,
    Secondary = ButtonStyle.Secondary,
    Success = ButtonStyle.Success,
    Danger = ButtonStyle.Danger,
    Link = ButtonStyle.Link,
}

/**
 * Opciones para crear un botón
 */
export interface ButtonOptions {
    label: string;
    variant?: ButtonVariant | ButtonStyle;
    emoji?: string;
    disabled?: boolean;
    url?: string; // Solo para ButtonVariant.Link
}

/**
 * Wrapper para crear botones de Discord con callbacks inline
 *
 * @example
 * ```ts
 * const button = new Button({
 *     label: 'Click me',
 *     variant: ButtonVariant.Primary,
 * }).onClick(async (interaction) => {
 *     await interaction.reply('¡Botón clickeado!');
 * }).setTimeout(Times.minutes(1));
 *
 * await channel.send({
 *     content: 'Mensaje con botón',
 *     components: [button.toActionRow()],
 * });
 * ```
 */
export class Button {
    private customId: string;
    private builder: ButtonBuilder;
    private callback?: ButtonCallback;
    private options: ButtonOptions;

    constructor(options: ButtonOptions) {
        this.options = options;
        this.customId = `btn_${nanoid(10)}`;
        this.builder = new ButtonBuilder();

        this.builder.setLabel(options.label);
        this.builder.setStyle((options.variant ?? ButtonVariant.Primary) as ButtonStyle);

        if (options.emoji) {
            this.builder.setEmoji(options.emoji);
        }

        if (options.disabled) {
            this.builder.setDisabled(true);
        }

        // Si es un botón Link, usar URL en lugar de customId
        if (options.variant === ButtonVariant.Link && options.url) {
            this.builder.setURL(options.url);
        } else {
            this.builder.setCustomId(this.customId);
        }
    }

    /**
     * Método estático para crear botones con variantes predefinidas
     */
    public static primary(label: string, emoji?: string): Button {
        return new Button({ label, variant: ButtonVariant.Primary, emoji });
    }

    public static secondary(label: string, emoji?: string): Button {
        return new Button({ label, variant: ButtonVariant.Secondary, emoji });
    }

    public static success(label: string, emoji?: string): Button {
        return new Button({ label, variant: ButtonVariant.Success, emoji });
    }

    public static danger(label: string, emoji?: string): Button {
        return new Button({ label, variant: ButtonVariant.Danger, emoji });
    }

    public static link(label: string, url: string, emoji?: string): Button {
        return new Button({ label, variant: ButtonVariant.Link, url, emoji });
    }

    /**
     * Define el callback que se ejecutará cuando se haga click en el botón
     */
    public onClick(callback: ButtonCallback): this {
        if (this.options.variant === ButtonVariant.Link) {
            console.warn('⚠️ Los botones Link no pueden tener callbacks (abren URL directamente)');
            return this;
        }

        this.callback = callback;
        ComponentRegistry.registerButton(this.customId, callback);

        return this;
    }

    /**
     * Deshabilita el botón
     */
    public disable(): this {
        this.builder.setDisabled(true);
        return this;
    }

    /**
     * Habilita el botón
     */
    public enable(): this {
        this.builder.setDisabled(false);
        return this;
    }

    /**
     * Cambia el label del botón
     */
    public setLabel(label: string): this {
        this.builder.setLabel(label);
        return this;
    }

    /**
     * Cambia el emoji del botón
     */
    public setEmoji(emoji: string): this {
        this.builder.setEmoji(emoji);
        return this;
    }

    /**
     * Obtiene el ButtonBuilder para usar con ActionRow
     */
    public toJSON(): APIButtonComponent {
        return this.builder.toJSON() as APIButtonComponent;
    }

    /**
     * Obtiene el ButtonBuilder nativo de Discord.js
     */
    public getBuilder(): ButtonBuilder {
        return this.builder;
    }

    /**
     * Obtiene el customId del botón
     */
    public getCustomId(): string {
        return this.customId;
    }

    /**
     * Desregistra el botón del registry y limpia el timeout
     */
    public destroy(): void {
        ComponentRegistry.unregisterButton(this.customId);
    }
}
