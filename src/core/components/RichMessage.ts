import {
    Message,
    InteractionResponse,
    ActionRowBuilder,
    ButtonBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder,
    MessageEditOptions,
    BaseMessageOptions,
} from 'discord.js';
import { Button } from './Button';
import { Select } from './Select';
import { Modal } from './Modal';
import { Times } from '@/utils/Times';
import { ComponentRegistry, type ComponentOwner } from '@/core/registry/component.registry';

/**
 * Valor sentinel para indicar que un RichMessage no debe expirar nunca.
 * Sólo válido cuando ningún componente tiene payload (ver
 * {@link RichMessageOptions.timeout}).
 */
export const NEVER_EXPIRES = null;
export type RichMessageTimeout = number | typeof NEVER_EXPIRES;

/**
 * Opciones para crear un RichMessage
 */
export interface RichMessageOptions {
    content?: string;
    embeds?: EmbedBuilder[];
    components?: (Button | Select)[];
    /**
     * Tiempo en milisegundos antes de que el mensaje expire y se eliminen sus
     * componentes. El TTL se **refresca automáticamente** en cada interacción
     * con cualquiera de los componentes del RichMessage.
     *
     * Pasar `null` (o {@link NEVER_EXPIRES}) crea un mensaje **permanente**.
     * Caso de uso típico: paneles públicos como un selector de roles donde
     * cualquier miembro puede interactuar indefinidamente.
     *
     * **Restricción:** un RichMessage permanente NO puede tener componentes
     * con payload. Un payload requiere expiración (TTL); sin TTL no hay
     * forma de evitar que la memoria/store crezca sin límite. Si necesitás
     * estado por interacción, usá un RichMessage con timeout numérico.
     *
     * Por defecto: 20 segundos.
     */
    timeout?: RichMessageTimeout;
}

/**
 * Wrapper para mensajes con componentes interactivos.
 *
 * Gestiona el ciclo de vida de los componentes (commit de payloads al
 * enviar, refresh de TTL en cada interacción, eliminación al expirar)
 * sin guardar closures por instancia.
 *
 * Implementa {@link ComponentOwner}: cuando uno de sus componentes recibe
 * una interacción, el dispatcher llama a {@link RichMessage.onComponentInteraction}
 * para refrescar el TTL de los payloads y reiniciar el timeout global.
 *
 * @example RichMessage con expiración (caso común)
 * ```ts
 * const richMsg = new RichMessage({
 *     embeds: [embed],
 *     components: [select],
 *     timeout: Times.minutes(2),
 * });
 * await richMsg.send(this.ctx);
 * ```
 *
 * @example RichMessage permanente (sin payloads)
 * ```ts
 * import { RichMessage, NEVER_EXPIRES } from '@/core/components';
 *
 * // Selector de roles persistente: los botones no llevan payload, todo lo
 * // que el handler necesita está codificado en el `method` (ej. buttonAssignAdmin).
 * const richMsg = new RichMessage({
 *     embeds: [embed],
 *     components: [adminBtn, modBtn, memberBtn],
 *     timeout: NEVER_EXPIRES,
 * });
 * await richMsg.send(channel);
 * ```
 */
export class RichMessage implements ComponentOwner {
    private static readonly DEFAULT_TIMEOUT_MS = Times.seconds(20);

    private options: RichMessageOptions;
    private message?: Message | InteractionResponse;
    private timeoutMs: RichMessageTimeout;
    private timeoutId?: NodeJS.Timeout;
    private components: (Button | Select | Modal)[] = [];

    constructor(options: RichMessageOptions) {
        this.options = options;
        this.timeoutMs =
            options.timeout === undefined ? RichMessage.DEFAULT_TIMEOUT_MS : options.timeout;

        if (options.components) {
            this.components = options.components;
        }

        this.assertNoPayloadsWhenPermanent();
    }

    /**
     * Define el timeout global. `null` deshabilita la expiración (sólo
     * válido si ningún componente tiene payload).
     */
    public setTimeout(ms: RichMessageTimeout): this {
        this.timeoutMs = ms;
        this.assertNoPayloadsWhenPermanent();
        return this;
    }

    /**
     * Indica si este RichMessage está configurado para no expirar
     */
    public isPermanent(): boolean {
        return this.timeoutMs === NEVER_EXPIRES;
    }

    /**
     * Envía el mensaje, persiste los payloads de los componentes y arranca
     * el timeout global (si corresponde).
     */
    public async send(target: any): Promise<Message> {
        // Persistir payloads y registrarse como owner ANTES de mostrar el mensaje,
        // así si la interacción llega instantáneamente el dispatcher ya tiene todo.
        await this.commitComponents();

        const payload = this.buildPayload();

        if (typeof target.followUp === 'function') {
            // Es una interacción - usar followUp para evitar "Este mensaje fue eliminado"
            this.message = await target.followUp(payload);
        } else if (typeof target.reply === 'function') {
            // Es un contexto de comando (CommandContext) o similar
            this.message = await target.reply(payload);
        } else if (typeof target.send === 'function') {
            // Es un canal
            this.message = await target.send(payload);
        } else {
            throw new Error('Target inválido: debe ser un canal, interacción o contexto');
        }

        this.startGlobalTimeout();

        if (this.message instanceof Message) {
            return this.message;
        } else if (this.message) {
            return await this.message.fetch();
        }

        throw new Error('Error al enviar mensaje');
    }

    /**
     * Persiste los payloads de los componentes interactivos en el store
     * y registra a este RichMessage como owner para reset de timeout.
     *
     * En modo permanente (`timeoutMs === NEVER_EXPIRES`) sólo se registra
     * el owner; no se persiste ningún payload (se garantiza por el assert
     * en el constructor que ningún componente lo tiene).
     */
    private async commitComponents(): Promise<void> {
        for (const component of this.components) {
            if (component instanceof Button && component.isLinkButton()) {
                continue;
            }

            if (this.timeoutMs !== NEVER_EXPIRES) {
                await component.commit(this.timeoutMs);
            }
            ComponentRegistry.setOwner(component.getCustomId(), this);
        }
    }

    /**
     * Refresca el TTL de los payloads de todos los componentes activos.
     * Llamado en cada interacción para que los payloads no expiren mientras
     * el RichMessage esté siendo usado.
     */
    private async refreshComponentTtls(): Promise<void> {
        if (this.timeoutMs === NEVER_EXPIRES) return;

        for (const component of this.components) {
            if (component instanceof Button && component.isLinkButton()) {
                continue;
            }
            await component.commit(this.timeoutMs);
        }
    }

    /**
     * Construye el payload del mensaje con los componentes
     */
    private buildPayload(): BaseMessageOptions {
        const payload: BaseMessageOptions = {};

        if (this.options.content) {
            payload.content = this.options.content;
        }

        if (this.options.embeds && this.options.embeds.length > 0) {
            payload.embeds = this.options.embeds;
        }

        // Construir ActionRows
        if (this.components.length > 0) {
            const rows: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = [];
            const buttons: Button[] = [];
            const selects: Select[] = [];

            // Separar botones y selects
            for (const component of this.components) {
                if (component instanceof Button) {
                    buttons.push(component);
                } else if (component instanceof Select) {
                    selects.push(component);
                }
            }

            // Agrupar botones en filas (máximo 5 por fila)
            for (let i = 0; i < buttons.length; i += 5) {
                const rowButtons = buttons.slice(i, i + 5);
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    ...rowButtons.map((btn) => btn.getBuilder()),
                );
                rows.push(row);
            }

            // Agregar selects (uno por fila)
            for (const select of selects) {
                const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                    select.getBuilder(),
                );
                rows.push(row);
            }

            payload.components = rows as any;
        } else {
            // Si no hay componentes, establecer explícitamente array vacío
            // para que Discord elimine los componentes existentes
            payload.components = [];
        }

        return payload;
    }

    /**
     * Inicia el timeout global que elimina todos los componentes.
     * No-op en modo permanente.
     */
    private startGlobalTimeout(): void {
        if (this.timeoutMs === NEVER_EXPIRES) return;
        this.timeoutId = setTimeout(async () => {
            await this.destroyAll();
        }, this.timeoutMs);
    }

    /**
     * Reinicia el timeout global. Llamado automáticamente por el dispatcher
     * de interacciones vía {@link RichMessage.onComponentInteraction}.
     * No-op en modo permanente.
     */
    public resetTimeout(): this {
        if (this.timeoutMs === NEVER_EXPIRES) return this;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.startGlobalTimeout();
        return this;
    }

    /**
     * Hook llamado por el dispatcher cuando uno de los componentes de este
     * RichMessage recibe una interacción. Refresca el TTL de los payloads
     * y reinicia el timeout global. No-op en modo permanente.
     */
    public async onComponentInteraction(_customId: string): Promise<void> {
        if (this.timeoutMs === NEVER_EXPIRES) return;
        await this.refreshComponentTtls();
        this.resetTimeout();
    }

    /**
     * Elimina todos los componentes del mensaje y los payloads del registry
     */
    private async destroyAll(): Promise<void> {
        // 1. Eliminar payloads y owners del registry PRIMERO
        for (const component of this.components) {
            await component.destroy();
            ComponentRegistry.unsetOwner(component.getCustomId());
        }

        // 2. Intentar actualizar el mensaje para remover los componentes visuales
        if (this.message) {
            try {
                let messageToEdit: Message;

                if (this.message instanceof Message) {
                    messageToEdit = this.message;
                } else {
                    // Es InteractionResponse, necesitamos hacer fetch
                    try {
                        messageToEdit = await this.message.fetch();
                    } catch (fetchError: any) {
                        // Mensaje no encontrado (fue eliminado) - silenciosamente ignorar
                        if (fetchError.code === 10008 || fetchError.status === 404) {
                            return;
                        }
                        throw fetchError;
                    }
                }

                if (!messageToEdit) {
                    return;
                }

                const updatePayload: MessageEditOptions = {
                    components: [], // Remover todos los componentes
                };

                if (this.options.content) {
                    updatePayload.content = this.options.content;
                }
                if (this.options.embeds) {
                    updatePayload.embeds = this.options.embeds;
                }

                await messageToEdit.edit(updatePayload);
            } catch (_error: any) {
                // Silenciosamente ignorar errores comunes de Discord
                // (mensaje eliminado, sin permisos, etc.)
            }
        }

        // 3. Limpiar el timeout
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = undefined;
        }
    }

    /**
     * Destruye manualmente todos los componentes antes del timeout
     */
    public async destroy(): Promise<void> {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        await this.destroyAll();
    }

    /**
     * Edita el mensaje actual con nuevas opciones.
     * Si se cambian los componentes, los payloads previos se eliminan y
     * los nuevos se persisten en el store.
     *
     * @example
     * ```ts
     * await richMessage.edit({
     *     embeds: [newEmbed],
     *     components: [newButton],
     * });
     * ```
     */
    public async edit(options: Partial<RichMessageOptions>): Promise<void> {
        if (!this.message) {
            throw new Error('No hay mensaje para editar. Usa send() primero.');
        }

        if (options.content !== undefined) {
            this.options.content = options.content;
        }
        if (options.embeds !== undefined) {
            this.options.embeds = options.embeds;
        }
        if (options.timeout !== undefined) {
            this.timeoutMs = options.timeout;
        }

        if (options.components !== undefined) {
            // Eliminar payloads / owners de los componentes anteriores
            for (const component of this.components) {
                await component.destroy();
                ComponentRegistry.unsetOwner(component.getCustomId());
            }

            this.components = options.components;
            this.assertNoPayloadsWhenPermanent();
            await this.commitComponents();
        } else {
            // Sin cambio de componentes pero sí pudo cambiar el timeout: validar
            this.assertNoPayloadsWhenPermanent();
        }

        const payload = this.buildPayload();

        let messageToEdit: Message;
        if (this.message instanceof Message) {
            messageToEdit = this.message;
        } else {
            messageToEdit = await this.message.fetch();
        }

        await messageToEdit.edit(payload as MessageEditOptions);

        if (this.components.length > 0 && this.timeoutMs !== NEVER_EXPIRES) {
            this.resetTimeout();
        } else if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = undefined;
        }
    }

    /**
     * Obtiene el mensaje enviado
     */
    public getMessage(): Message | InteractionResponse | undefined {
        return this.message;
    }

    /**
     * Garantiza la invariante: en modo permanente ningún componente puede
     * tener payload (sin TTL no hay forma de evitar crecimiento ilimitado
     * del store).
     */
    private assertNoPayloadsWhenPermanent(): void {
        if (this.timeoutMs !== NEVER_EXPIRES) return;

        for (const component of this.components) {
            if (component instanceof Button && component.isLinkButton()) {
                continue;
            }
            if (component.hasPayload()) {
                throw new Error(
                    `RichMessage permanente (timeout: null) no admite componentes con payload. ` +
                        `Componente "${component.getCustomId()}" tiene payload definido. ` +
                        `Usá un timeout numérico o quitá el payload del componente.`,
                );
            }
        }
    }
}
