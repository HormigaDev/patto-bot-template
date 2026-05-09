import {
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    type APISelectMenuComponent,
} from 'discord.js';
import { ComponentRegistry } from '@/core/registry/component.registry';
import { nanoid } from 'nanoid';

/**
 * Opción de un select menu
 */
export interface SelectOption {
    label: string;
    value: string;
    description?: string;
    emoji?: string;
    default?: boolean;
}

/**
 * Opciones para crear un select.
 *
 * El handler de un select es un **método estático** del comando, con prefijo
 * `select*`. La instancia solo guarda un `payload`.
 */
export interface SelectOptions<P = unknown> {
    placeholder?: string;
    minValues?: number;
    maxValues?: number;
    disabled?: boolean;
    options: SelectOption[];
    /**
     * Clave kebab-case del comando que expone el método estático handler
     * (ej. `'help'`).
     */
    command: string;
    /**
     * Nombre exacto del método estático que maneja la interacción. Debe
     * empezar con `select` (ej. `'selectCategory'`).
     */
    method: string;
    /**
     * Payload asociado a esta instancia. Se persiste en el {@link PayloadStore}
     * al llamar {@link Select.commit} (RichMessage lo hace automáticamente).
     */
    payload?: P;
    /**
     * TTL del payload en milisegundos
     */
    ttl?: number;
}

/**
 * Wrapper para crear select menus de Discord.
 *
 * Los handlers son métodos estáticos en la clase del comando con prefijo
 * `select*`. La instancia solo guarda payload — cero closures.
 *
 * @example
 * ```ts
 * export class HelpCommand extends HelpDefinition {
 *     public static async selectCategory(
 *         interaction: StringSelectMenuInteraction,
 *         values: string[],
 *         payload: HelpCategoryPayload | undefined,
 *     ) {
 *         // ...
 *     }
 *
 *     async run() {
 *         const select = new Select({
 *             command: 'help',
 *             method: 'selectCategory',
 *             payload: { ... },
 *             placeholder: 'Selecciona una categoría',
 *             options: [...],
 *         });
 *         // ...
 *     }
 * }
 * ```
 */
export class Select<P = unknown> {
    private customId: string;
    private builder: StringSelectMenuBuilder;
    private command: string;
    private method: string;
    private payload?: P;
    private ttl?: number;

    constructor(options: SelectOptions<P>) {
        if (!options.command || !options.method) {
            throw new Error(
                'Los selects requieren "command" (clave del comando) y "method" (nombre del método estático).',
            );
        }
        if (!options.method.startsWith('select')) {
            throw new Error(
                `El método "${options.method}" no es válido para un select: debe empezar con "select".`,
            );
        }

        this.command = options.command;
        this.method = options.method;
        this.payload = options.payload;
        this.ttl = options.ttl;
        this.customId = ComponentRegistry.buildCustomId(
            options.command,
            options.method,
            nanoid(10),
        );

        this.builder = new StringSelectMenuBuilder().setCustomId(this.customId);

        if (options.placeholder) {
            this.builder.setPlaceholder(options.placeholder);
        }

        if (options.minValues !== undefined) {
            this.builder.setMinValues(options.minValues);
        }

        if (options.maxValues !== undefined) {
            this.builder.setMaxValues(options.maxValues);
        }

        if (options.disabled) {
            this.builder.setDisabled(true);
        }

        // Agregar opciones
        const selectOptions = options.options.map((opt) => {
            const option = new StringSelectMenuOptionBuilder()
                .setLabel(opt.label)
                .setValue(opt.value);

            if (opt.description) {
                option.setDescription(opt.description);
            }

            if (opt.emoji) {
                option.setEmoji(opt.emoji);
            }

            if (opt.default) {
                option.setDefault(true);
            }

            return option;
        });

        this.builder.addOptions(selectOptions);
    }

    /**
     * Actualiza el payload asociado a esta instancia (en memoria local).
     * Para persistirlo en el store llamar {@link Select.commit}.
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
     *
     * @param defaultTtl TTL a usar si la instancia no definió uno propio
     */
    public async commit(defaultTtl?: number): Promise<void> {
        await ComponentRegistry.setPayload(this.customId, this.payload, this.ttl ?? defaultTtl);
    }

    /**
     * Elimina el payload del store
     */
    public async destroy(): Promise<void> {
        await ComponentRegistry.deletePayload(this.customId);
    }

    /**
     * Deshabilita el select
     */
    public disable(): this {
        this.builder.setDisabled(true);
        return this;
    }

    /**
     * Habilita el select
     */
    public enable(): this {
        this.builder.setDisabled(false);
        return this;
    }

    /**
     * Cambia el placeholder del select
     */
    public setPlaceholder(placeholder: string): this {
        this.builder.setPlaceholder(placeholder);
        return this;
    }

    /**
     * Cambia los valores mínimos y máximos
     */
    public setMinMaxValues(min: number, max: number): this {
        this.builder.setMinValues(min);
        this.builder.setMaxValues(max);
        return this;
    }

    /**
     * Obtiene el SelectMenuBuilder en formato JSON
     */
    public toJSON(): APISelectMenuComponent {
        return this.builder.toJSON() as APISelectMenuComponent;
    }

    /**
     * Obtiene el StringSelectMenuBuilder nativo de Discord.js
     */
    public getBuilder(): StringSelectMenuBuilder {
        return this.builder;
    }

    /**
     * Obtiene el customId del select
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
