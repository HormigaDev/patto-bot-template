import { MemoryPayloadStore, type PayloadStore } from '@/core/store/payload.store';

/**
 * Tipo de componente interactivo. Sólo se usa para validar consistencia
 * entre el método estático invocado y la interacción recibida.
 */
export type ComponentType = 'button' | 'select' | 'modal';

/**
 * Owner notificable cuando uno de sus componentes recibe una interacción.
 * Usado por {@link RichMessage} para resetear su timeout sin necesidad de
 * envolver callbacks por instancia.
 */
export interface ComponentOwner {
    onComponentInteraction(customId: string): void | Promise<void>;
}

/**
 * Resultado parseado de un customId con formato `<commandKey>:<methodName>:<id>`
 */
export interface ParsedCustomId {
    commandKey: string;
    methodName: string;
    id: string;
    raw: string;
}

/**
 * Registry global de componentes interactivos.
 *
 * Arquitectura:
 * - **Handlers**: NO se registran en runtime. Son **métodos estáticos** del
 *   comando que crea el componente, con prefijo según el tipo
 *   (`button*`, `select*`, `modal*`). El dispatcher los localiza vía
 *   `CommandLoader.getCommand(commandKey)` + lookup directo en la clase.
 * - **Payloads**: se guardan por instancia en un {@link PayloadStore}
 *   (in-memory por defecto, swappable por Redis/Mongo sin tocar consumers).
 * - **Owners**: {@link RichMessage} se asocia a sus componentes mediante
 *   {@link ComponentRegistry.setOwner} para recibir notificaciones de
 *   interacción (reset de timeout) sin guardar closures.
 *
 * Formato del customId: `<commandKey>:<methodName>:<id>`
 *   - `commandKey`: clave kebab-case que identifica al comando en
 *     `CommandLoader` (ej. `help`, `config-set`).
 *   - `methodName`: nombre exacto del método estático (ej. `buttonNext`,
 *     `selectCategory`, `modalContact`). El prefijo determina el tipo.
 *   - `id`: identificador único de la instancia, generado por
 *     `generateId()` (ver `src/utils/Id.ts`).
 *
 * @example Definir handlers como métodos estáticos
 * ```ts
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
 * }
 * ```
 *
 * @example Crear instancia
 * ```ts
 * const btn = new Button({
 *     label: 'Siguiente',
 *     command: 'help',
 *     method: 'buttonNext',
 *     payload: { page: 1 },
 * });
 * ```
 */
export class ComponentRegistry {
    /** Owners por customId completo (ej. RichMessage que agrupa el componente) */
    private static owners = new Map<string, ComponentOwner>();

    private static store: PayloadStore = new MemoryPayloadStore();

    /**
     * Reemplaza el store de payloads. Útil para usar Redis/Mongo en producción.
     * Llamar al inicio del bot, antes de crear componentes.
     */
    public static useStore(store: PayloadStore): void {
        this.store = store;
    }

    /**
     * Devuelve el store actual de payloads
     */
    public static getStore(): PayloadStore {
        return this.store;
    }

    /**
     * Guarda el payload de una instancia
     * @param customId Identificador completo del componente (`<commandKey>:<methodName>:<id>`)
     * @param payload Datos a asociar a esta instancia
     * @param ttlMs TTL del payload en milisegundos
     */
    public static async setPayload(
        customId: string,
        payload: unknown,
        ttlMs?: number,
    ): Promise<void> {
        await this.store.set(customId, payload, ttlMs);
    }

    /**
     * Recupera el payload de una instancia
     * @returns Payload guardado, o `undefined` si no existe / expiró.
     *          IMPORTANTE: `null`, `false`, `0`, `''` son payloads válidos.
     *          Solo `undefined` indica ausencia.
     */
    public static async getPayload<P = unknown>(customId: string): Promise<P | undefined> {
        return this.store.get<P>(customId);
    }

    /**
     * Elimina el payload de una instancia
     */
    public static async deletePayload(customId: string): Promise<void> {
        await this.store.delete(customId);
        this.owners.delete(customId);
    }

    /**
     * Asocia un owner a un customId. El owner será notificado cuando el
     * componente reciba una interacción (vía {@link ComponentOwner.onComponentInteraction}).
     * Usado por {@link RichMessage} para resetear su timeout.
     */
    public static setOwner(customId: string, owner: ComponentOwner): void {
        this.owners.set(customId, owner);
    }

    /**
     * Obtiene el owner asociado a un customId, si lo hay
     */
    public static getOwner(customId: string): ComponentOwner | undefined {
        return this.owners.get(customId);
    }

    /**
     * Elimina la asociación de owner para un customId
     */
    public static unsetOwner(customId: string): void {
        this.owners.delete(customId);
    }

    /**
     * Construye un customId con el formato `<commandKey>:<methodName>:<id>`
     */
    public static buildCustomId(commandKey: string, methodName: string, id: string): string {
        this.assertSegment('commandKey', commandKey);
        this.assertSegment('methodName', methodName);
        this.assertSegment('id', id);
        return `${commandKey}:${methodName}:${id}`;
    }

    /**
     * Parsea un customId. Devuelve `undefined` si el formato no coincide.
     */
    public static parseCustomId(customId: string): ParsedCustomId | undefined {
        const parts = customId.split(':');
        if (parts.length !== 3) return undefined;

        const [commandKey, methodName, id] = parts;
        if (!commandKey || !methodName || !id) return undefined;

        return { commandKey, methodName, id, raw: customId };
    }

    /**
     * Devuelve el tipo de componente esperado según el prefijo del nombre del método.
     * `undefined` si el método no corresponde a ningún tipo conocido.
     */
    public static methodType(methodName: string): ComponentType | undefined {
        if (methodName.startsWith('button')) return 'button';
        if (methodName.startsWith('select')) return 'select';
        if (methodName.startsWith('modal')) return 'modal';
        return undefined;
    }

    /**
     * Limpia todos los owners y payloads (útil para tests / shutdown)
     */
    public static async clear(): Promise<void> {
        this.owners.clear();
        if (this.store instanceof MemoryPayloadStore) {
            this.store.clear();
        }
    }

    /**
     * Estadísticas del registry
     */
    public static getStats() {
        return {
            owners: this.owners.size,
            payloads: this.store instanceof MemoryPayloadStore ? this.store.size() : null,
        };
    }

    private static assertSegment(name: string, value: string): void {
        if (!value || value.includes(':')) {
            throw new Error(
                `Segmento "${name}" inválido ("${value}"): no puede estar vacío ni contener ":" (reservado para el customId).`,
            );
        }
    }
}
