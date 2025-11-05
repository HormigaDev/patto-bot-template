import type {
    ButtonInteraction,
    StringSelectMenuInteraction,
    ModalSubmitInteraction,
} from 'discord.js';

/**
 * Tipo de callback para botones
 */
export type ButtonCallback = (interaction: ButtonInteraction) => Promise<void> | void;

/**
 * Tipo de callback para selects
 */
export type SelectCallback = (
    interaction: StringSelectMenuInteraction,
    values: string[],
) => Promise<void> | void;

/**
 * Tipo de callback para modales
 */
export type ModalCallback = (interaction: ModalSubmitInteraction) => Promise<void> | void;

/**
 * Tipo de componente registrado
 */
type ComponentCallback = ButtonCallback | SelectCallback | ModalCallback;

/**
 * Registry global para almacenar componentes interactivos y sus callbacks
 */
export class ComponentRegistry {
    private static buttons = new Map<string, ButtonCallback>();
    private static selects = new Map<string, SelectCallback>();
    private static modals = new Map<string, ModalCallback>();

    /**
     * Registra un botón con su callback
     */
    public static registerButton(customId: string, callback: ButtonCallback): void {
        this.buttons.set(customId, callback);
    }

    /**
     * Registra un select con su callback
     */
    public static registerSelect(customId: string, callback: SelectCallback): void {
        this.selects.set(customId, callback);
    }

    /**
     * Registra un modal con su callback
     */
    public static registerModal(customId: string, callback: ModalCallback): void {
        this.modals.set(customId, callback);
    }

    /**
     * Obtiene el callback de un botón
     */
    public static getButton(customId: string): ButtonCallback | undefined {
        return this.buttons.get(customId);
    }

    /**
     * Obtiene el callback de un select
     */
    public static getSelect(customId: string): SelectCallback | undefined {
        return this.selects.get(customId);
    }

    /**
     * Obtiene el callback de un modal
     */
    public static getModal(customId: string): ModalCallback | undefined {
        return this.modals.get(customId);
    }

    /**
     * Elimina un botón del registry
     */
    public static unregisterButton(customId: string): void {
        this.buttons.delete(customId);
    }

    /**
     * Elimina un select del registry
     */
    public static unregisterSelect(customId: string): void {
        this.selects.delete(customId);
    }

    /**
     * Elimina un modal del registry
     */
    public static unregisterModal(customId: string): void {
        this.modals.delete(customId);
    }

    /**
     * Limpia todos los componentes registrados
     */
    public static clear(): void {
        this.buttons.clear();
        this.selects.clear();
        this.modals.clear();
    }

    /**
     * Obtiene estadísticas del registry
     */
    public static getStats() {
        return {
            buttons: this.buttons.size,
            selects: this.selects.size,
            modals: this.modals.size,
            total: this.buttons.size + this.selects.size + this.modals.size,
        };
    }
}
