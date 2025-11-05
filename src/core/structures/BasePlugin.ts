import { BaseCommand } from './BaseCommand';

/**
 * Clase base para crear plugins que se ejecutan antes o después de un comando
 *
 * Los plugins permiten extender la funcionalidad de los comandos sin modificar su código.
 * Ejemplos: Cooldowns, Permisos, Logging, Rate Limiting, etc.
 */
export abstract class BasePlugin {
    /**
     * Se ejecuta ANTES de que el comando ejecute su método run()
     *
     * @param command - Instancia del comando que se va a ejecutar
     * @returns boolean - true para continuar con la ejecución, false para cancelar silenciosamente
     * @throws Error - Lanza un error para cancelar la ejecución y mostrar un mensaje de error
     *
     * @example
     * # Cancelar con mensaje de error
     * ```typescript
     * async onBeforeExecute(command: BaseCommand): Promise<boolean> {
     *     if (!hasPermission(command.user)) {
     *         throw new ReplyError('No tienes permisos');
     *     }
     *     return true; // Continuar ejecución
     * }
     * ```
     *
     * @example
     * # Cancelar silenciosamente (sin mensaje)
     * ```typescript
     * async onBeforeExecute(command: BaseCommand): Promise<boolean> {
     *     if (isInCooldown(command.user)) {
     *         return false; // Cancelar sin mostrar error
     *     }
     *     return true; // Continuar ejecución
     * }
     * ```
     */
    async onBeforeExecute?(command: BaseCommand): Promise<boolean>;

    /**
     * Se ejecuta DESPUÉS de que el comando ejecute su método run() exitosamente
     *
     * Solo se ejecuta si el comando no lanzó ningún error.
     *
     * @param command - Instancia del comando que se ejecutó
     *
     * @example
     * ```typescript
     * async onAfterExecute(command: BaseCommand): Promise<void> {
     *     console.log(`Comando ${command.constructor.name} ejecutado por ${command.user.tag}`);
     * }
     * ```
     */
    async onAfterExecute?(command: BaseCommand): Promise<void>;
}
