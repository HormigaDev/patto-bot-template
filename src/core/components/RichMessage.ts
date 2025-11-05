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
import { ComponentRegistry } from '@/core/registry/component.registry';
import type {
    ButtonCallback,
    SelectCallback,
    ModalCallback,
} from '@/core/registry/component.registry';

/**
 * Opciones para crear un RichMessage
 */
export interface RichMessageOptions {
    content?: string;
    embeds?: EmbedBuilder[];
    components?: (Button | Select)[];
    timeout?: number; // Timeout global para todos los componentes
}

/**
 * Wrapper para mensajes con componentes interactivos
 * Gestiona el ciclo de vida de todos los componentes del mensaje de forma centralizada
 *
 * @example
 * ```ts
 * const richMsg = new RichMessage({
 *     embeds: [embed],
 *     components: [button1, button2, select],
 *     timeout: Times.minutes(2),
 * });
 *
 * await richMsg.send(channel);
 * // Después de 2 minutos: se eliminan los componentes del mensaje y del registry
 * ```
 */
export class RichMessage {
    private options: RichMessageOptions;
    private message?: Message | InteractionResponse;
    private timeoutMs: number;
    private timeoutId?: NodeJS.Timeout;
    private components: (Button | Select | Modal)[] = [];

    constructor(options: RichMessageOptions) {
        this.options = options;
        this.timeoutMs = options.timeout ?? Times.seconds(20); // 20 segundos por defecto

        // Extraer componentes
        if (options.components) {
            this.components = options.components;
            // Wrappear los callbacks para auto-resetear el timeout
            this.wrapComponentCallbacks();
        }
    }

    /**
     * Wrappea los callbacks de los componentes para interceptar interacciones
     * y resetear el timeout automáticamente (patrón DRY)
     */
    private wrapComponentCallbacks(): void {
        for (const component of this.components) {
            const customId = component.getCustomId();

            if (component instanceof Button) {
                const originalCallback = ComponentRegistry.getButton(customId);
                if (originalCallback) {
                    const wrappedCallback: ButtonCallback = async (interaction) => {
                        await originalCallback(interaction);
                        this.resetTimeout(); // Auto-reset después de cada interacción
                    };
                    ComponentRegistry.registerButton(customId, wrappedCallback);
                }
            } else if (component instanceof Select) {
                const originalCallback = ComponentRegistry.getSelect(customId);
                if (originalCallback) {
                    const wrappedCallback: SelectCallback = async (interaction, values) => {
                        await originalCallback(interaction, values);
                        this.resetTimeout(); // Auto-reset después de cada interacción
                    };
                    ComponentRegistry.registerSelect(customId, wrappedCallback);
                }
            } else if (component instanceof Modal) {
                const originalCallback = ComponentRegistry.getModal(customId);
                if (originalCallback) {
                    const wrappedCallback: ModalCallback = async (interaction) => {
                        await originalCallback(interaction);
                        this.resetTimeout(); // Auto-reset después de cada interacción
                    };
                    ComponentRegistry.registerModal(customId, wrappedCallback);
                }
            }
        }
    }

    /**
     * Define el timeout global para todos los componentes
     */
    public setTimeout(ms: number): this {
        this.timeoutMs = ms;
        return this;
    }

    /**
     * Envía el mensaje y inicia el timeout global
     */
    public async send(target: any): Promise<Message> {
        const payload = this.buildPayload();

        // Enviar mensaje
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

        // Iniciar timeout global
        this.startGlobalTimeout();

        if (this.message instanceof Message) {
            return this.message;
        } else if (this.message) {
            return await this.message.fetch();
        }

        throw new Error('Error al enviar mensaje');
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
     * Inicia el timeout global que elimina todos los componentes
     */
    private startGlobalTimeout(): void {
        this.timeoutId = setTimeout(async () => {
            await this.destroyAll();
        }, this.timeoutMs);
    }

    /**
     * Reinicia el timeout global (útil para extender el tiempo en cada interacción)
     *
     * @example
     * ```ts
     * button.onClick(async (interaction) => {
     *     await interaction.reply('Clickeado!');
     *     richMessage.resetTimeout(); // Reinicia el timeout
     * });
     * ```
     */
    public resetTimeout(): this {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.startGlobalTimeout();
        return this;
    }

    /**
     * Elimina todos los componentes del mensaje y del registry
     */
    private async destroyAll(): Promise<void> {
        // 1. Eliminar todos los componentes del registry PRIMERO
        for (const component of this.components) {
            component.destroy();
        }

        // 2. Intentar actualizar el mensaje para remover los componentes visuales
        if (this.message) {
            try {
                // Verificar si el mensaje existe antes de intentar editarlo
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

                // Verificar que el mensaje existe
                if (!messageToEdit) {
                    return;
                }

                // Construir payload de actualización
                const updatePayload: MessageEditOptions = {
                    components: [], // Remover todos los componentes
                };

                // Mantener el contenido y embeds
                if (this.options.content) {
                    updatePayload.content = this.options.content;
                }
                if (this.options.embeds) {
                    updatePayload.embeds = this.options.embeds;
                }

                // Actualizar mensaje
                await messageToEdit.edit(updatePayload);
            } catch (error: any) {
                // Silenciosamente ignorar errores comunes de Discord
                // (mensaje eliminado, sin permisos, etc.)
                // Solo errores críticos serían re-lanzados si fuera necesario
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
     * Edita el mensaje actual con nuevas opciones
     * Útil para actualizar contenido, embeds o componentes sin crear un mensaje nuevo
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

        // Actualizar opciones
        if (options.content !== undefined) {
            this.options.content = options.content;
        }
        if (options.embeds !== undefined) {
            this.options.embeds = options.embeds;
        }
        if (options.components !== undefined) {
            // Destruir componentes antiguos del registry
            for (const component of this.components) {
                component.destroy();
            }

            // Actualizar con nuevos componentes
            this.components = options.components;
            this.wrapComponentCallbacks();
        }
        if (options.timeout !== undefined) {
            this.timeoutMs = options.timeout;
        }

        // Construir el nuevo payload
        const payload = this.buildPayload();

        // Obtener el mensaje a editar
        let messageToEdit: Message;

        if (this.message instanceof Message) {
            messageToEdit = this.message;
        } else {
            messageToEdit = await this.message.fetch();
        }

        // Editar el mensaje
        await messageToEdit.edit(payload as MessageEditOptions);

        // Gestionar timeout según componentes
        if (this.components.length > 0) {
            // Hay componentes: reiniciar timeout
            this.resetTimeout();
        } else {
            // No hay componentes: limpiar timeout
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
                this.timeoutId = undefined;
            }
        }
    }

    /**
     * Obtiene el mensaje enviado
     */
    public getMessage(): Message | InteractionResponse | undefined {
        return this.message;
    }
}
