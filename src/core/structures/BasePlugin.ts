import { BaseCommand } from './BaseCommand';

/**
 * Clase base para crear plugins que se ejecutan en diferentes etapas del ciclo de vida de los comandos
 *
 * Los plugins permiten extender la funcionalidad de los comandos sin modificar su código.
 * Ejemplos: Cooldowns, Permisos, Logging, Rate Limiting, Modificación de comandos, etc.
 */
export abstract class BasePlugin {
    /**
     * Se ejecuta ANTES de registrar el comando en Discord API
     *
     * Permite modificar el JSON del comando antes de enviarlo a Discord.
     * Útil para: agregar opciones dinámicas, modificar descripciones, agregar traducciones, etc.
     *
     * @param commandClass - Clase del comando (sin instanciar) que se va a registrar
     * @param commandJson - Copia del JSON del comando que se va a registrar
     * @returns JSON modificado | null/undefined (usar original) | false (cancelar registro)
     *
     * IMPORTANTE: El commandJson es una COPIA, modificar el objeto no afecta el original.
     *
     * @example
     * # Modificar comando basado en metadata
     * ```typescript
     * async onBeforeRegisterCommand(
     *     commandClass: new (...args: any[]) => BaseCommand,
     *     commandJson: any
     * ): Promise<any | false | null> {
     *     // Acceder a metadata del comando
     *     const metadata = Reflect.getMetadata(COMMAND_METADATA_KEY, commandClass);
     *
     *     commandJson.description = `[${metadata.category}] ${commandJson.description}`;
     *     return commandJson; // Usar versión modificada
     * }
     * ```
     *
     * @example
     * # Cancelar registro según clase
     * ```typescript
     * async onBeforeRegisterCommand(
     *     commandClass: new (...args: any[]) => BaseCommand,
     *     commandJson: any
     * ): Promise<any | false | null> {
     *     if (commandClass.name === 'DebugCommand') {
     *         return false; // No registrar en producción
     *     }
     *     return null; // Usar original para los demás
     * }
     * ```
     */
    async onBeforeRegisterCommand?(
        commandClass: new (...args: any[]) => BaseCommand,
        commandJson: any,
    ): Promise<any | false | null | undefined>;

    /**
     * Se ejecuta DESPUÉS de registrar el comando en Discord API
     *
     * Recibe el JSON del comando ya registrado con su ID de Discord.
     * Útil para: logging, analytics, caché, sincronización con BD, etc.
     *
     * @param commandClass - Clase del comando (sin instanciar) que fue registrado
     * @param registeredCommandJson - JSON del comando registrado (incluye ID de Discord)
     *
     * @example
     * ```typescript
     * async onAfterRegisterCommand(
     *     commandClass: new (...args: any[]) => BaseCommand,
     *     registeredCommandJson: any
     * ): Promise<void> {
     *     console.log(`✅ ${commandClass.name} registrado como "${registeredCommandJson.name}" (ID: ${registeredCommandJson.id})`);
     *     await database.saveCommand(commandClass.name, registeredCommandJson.id);
     * }
     * ```
     */
    async onAfterRegisterCommand?(
        commandClass: new (...args: any[]) => BaseCommand,
        registeredCommandJson: any,
    ): Promise<void>;

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
