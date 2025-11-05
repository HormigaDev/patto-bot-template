import {
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    type APISelectMenuComponent,
} from 'discord.js';
import { ComponentRegistry, type SelectCallback } from '@/core/registry/component.registry';
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
 * Opciones para crear un select
 */
export interface SelectOptions {
    placeholder?: string;
    minValues?: number;
    maxValues?: number;
    disabled?: boolean;
    options: SelectOption[];
}

/**
 * Wrapper para crear select menus de Discord con callbacks inline
 *
 * @example
 * ```ts
 * const select = new Select({
 *     placeholder: 'Selecciona una opción',
 *     options: [
 *         { label: 'Opción 1', value: 'opt1', emoji: '1️⃣' },
 *         { label: 'Opción 2', value: 'opt2', emoji: '2️⃣' },
 *         { label: 'Opción 3', value: 'opt3', emoji: '3️⃣' },
 *     ],
 * }).onChange(async (interaction, values) => {
 *     await interaction.reply(`Seleccionaste: ${values.join(', ')}`);
 * });
 *
 * await channel.send({
 *     content: 'Elige una opción',
 *     components: [select.toActionRow()],
 * });
 * ```
 */
export class Select {
    private customId: string;
    private builder: StringSelectMenuBuilder;
    private callback?: SelectCallback;
    private options: SelectOptions;

    constructor(options: SelectOptions) {
        this.options = options;
        this.customId = `select_${nanoid(10)}`;
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
     * Define el callback que se ejecutará cuando se seleccione una opción
     * @param callback Función que recibe la interaction y los valores seleccionados
     */
    public onChange(callback: SelectCallback): this {
        this.callback = callback;
        ComponentRegistry.registerSelect(this.customId, callback);

        return this;
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
     * Obtiene el SelectMenuBuilder para usar con ActionRow
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
     * Desregistra el select del registry y limpia el timeout
     */
    public destroy(): void {
        ComponentRegistry.unregisterSelect(this.customId);
    }
}
