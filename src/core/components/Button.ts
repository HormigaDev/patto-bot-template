import { ButtonBuilder, ButtonStyle, type APIButtonComponent } from 'discord.js';
import { ComponentRegistry } from '@/core/registry/component.registry';
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
 * Opciones para crear un botón.
 *
 * El handler de un botón es un **método estático** del comando, con prefijo
 * `button*`. No se registran closures: la instancia solo guarda un `payload`
 * y el customId codifica `<command>:<method>:<id>` para localizar el método
 * estático en el dispatcher.
 */
export interface ButtonOptions<P = unknown> {
    label: string;
    variant?: ButtonVariant | ButtonStyle;
    emoji?: string;
    disabled?: boolean;
    url?: string; // Solo para ButtonVariant.Link
    /**
     * Clave kebab-case del comando que expone el método estático handler
     * (ej. `'help'`, `'config-set'`). Debe coincidir con la key bajo la que
     * `CommandLoader` registra al comando.
     */
    command?: string;
    /**
     * Nombre exacto del método estático que maneja la interacción. Debe
     * empezar con `button` (ej. `'buttonNext'`, `'buttonConfirm'`).
     */
    method?: string;
    /**
     * Payload asociado a esta instancia. Se persiste en el {@link PayloadStore}
     * al llamar {@link Button.commit} (RichMessage lo hace automáticamente).
     */
    payload?: P;
    /**
     * TTL del payload en milisegundos. Si se usa dentro de RichMessage el TTL
     * por defecto es el timeout del RichMessage.
     */
    ttl?: number;
}

/**
 * Wrapper para crear botones de Discord.
 *
 * Los handlers son métodos estáticos en la clase del comando con prefijo
 * `button*`. La instancia solo guarda payload — cero closures.
 *
 * @example
 * ```ts
 * // En el comando: definir handler estático
 * export class HelpCommand extends HelpDefinition {
 *     public static async buttonNext(
 *         interaction: ButtonInteraction,
 *         payload: PaginationPayload | undefined,
 *     ) {
 *         if (payload === undefined) {
 *             await BaseCommand.replyEphemeral(interaction, 'Expirado');
 *             return;
 *         }
 *         // ...
 *     }
 *
 *     async run() {
 *         const button = new Button({
 *             label: 'Siguiente',
 *             variant: ButtonVariant.Secondary,
 *             command: 'help',
 *             method: 'buttonNext',
 *             payload: { page: 1 },
 *         });
 *         // ... agregar a un RichMessage o ActionRow
 *     }
 * }
 * ```
 */
export class Button<P = unknown> {
    private customId: string;
    private builder: ButtonBuilder;
    private command?: string;
    private method?: string;
    private payload?: P;
    private ttl?: number;
    private isLink: boolean;

    constructor(options: ButtonOptions<P>) {
        this.payload = options.payload;
        this.ttl = options.ttl;
        this.isLink = options.variant === ButtonVariant.Link;

        this.builder = new ButtonBuilder();
        this.builder.setLabel(options.label);
        this.builder.setStyle((options.variant ?? ButtonVariant.Primary) as ButtonStyle);

        if (options.emoji) {
            this.builder.setEmoji(options.emoji);
        }

        if (options.disabled) {
            this.builder.setDisabled(true);
        }

        if (this.isLink) {
            // Botones Link no tienen customId ni handler
            if (!options.url) {
                throw new Error('Los botones Link requieren la opción "url".');
            }
            this.customId = '';
            this.builder.setURL(options.url);
        } else {
            if (!options.command || !options.method) {
                throw new Error(
                    'Los botones interactivos requieren "command" (clave del comando) y "method" (nombre del método estático).',
                );
            }
            if (!options.method.startsWith('button')) {
                throw new Error(
                    `El método "${options.method}" no es válido para un botón: debe empezar con "button".`,
                );
            }

            this.command = options.command;
            this.method = options.method;
            this.customId = ComponentRegistry.buildCustomId(
                options.command,
                options.method,
                nanoid(10),
            );
            this.builder.setCustomId(this.customId);
        }
    }

    /**
     * Método estático para crear botones con variantes predefinidas
     */
    public static primary<P = unknown>(
        label: string,
        command: string,
        method: string,
        payload?: P,
        emoji?: string,
    ): Button<P> {
        return new Button<P>({
            label,
            variant: ButtonVariant.Primary,
            command,
            method,
            payload,
            emoji,
        });
    }

    public static secondary<P = unknown>(
        label: string,
        command: string,
        method: string,
        payload?: P,
        emoji?: string,
    ): Button<P> {
        return new Button<P>({
            label,
            variant: ButtonVariant.Secondary,
            command,
            method,
            payload,
            emoji,
        });
    }

    public static success<P = unknown>(
        label: string,
        command: string,
        method: string,
        payload?: P,
        emoji?: string,
    ): Button<P> {
        return new Button<P>({
            label,
            variant: ButtonVariant.Success,
            command,
            method,
            payload,
            emoji,
        });
    }

    public static danger<P = unknown>(
        label: string,
        command: string,
        method: string,
        payload?: P,
        emoji?: string,
    ): Button<P> {
        return new Button<P>({
            label,
            variant: ButtonVariant.Danger,
            command,
            method,
            payload,
            emoji,
        });
    }

    public static link(label: string, url: string, emoji?: string): Button {
        return new Button({ label, variant: ButtonVariant.Link, url, emoji });
    }

    /**
     * Actualiza el payload asociado a esta instancia (en memoria local).
     * Para persistirlo en el store llamar {@link Button.commit}.
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
     * Idempotente: llamar varias veces sobreescribe.
     * No-op para botones Link.
     *
     * @param defaultTtl TTL a usar si la instancia no definió uno propio
     */
    public async commit(defaultTtl?: number): Promise<void> {
        if (this.isLink) return;
        await ComponentRegistry.setPayload(this.customId, this.payload, this.ttl ?? defaultTtl);
    }

    /**
     * Elimina el payload del store. No-op para botones Link.
     */
    public async destroy(): Promise<void> {
        if (this.isLink) return;
        await ComponentRegistry.deletePayload(this.customId);
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
     * Obtiene el ButtonBuilder en formato JSON
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
     * Obtiene el customId del botón (vacío para botones Link)
     */
    public getCustomId(): string {
        return this.customId;
    }

    /**
     * Obtiene la clave del comando handler (undefined para botones Link)
     */
    public getCommand(): string | undefined {
        return this.command;
    }

    /**
     * Obtiene el nombre del método estático handler (undefined para botones Link)
     */
    public getMethod(): string | undefined {
        return this.method;
    }

    /**
     * Indica si el botón es de tipo Link (sin handler ni payload)
     */
    public isLinkButton(): boolean {
        return this.isLink;
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
