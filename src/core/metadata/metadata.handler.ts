import { MetadataStore, CommandMetadataEntry } from './metadata.store';
import { ICommandOptions } from '@/core/decorators/command.decorator';
import { IArgumentOptions } from '@/core/decorators/argument.decorator';
import { ISubcommandOptions } from '@/core/decorators/subcommand.decorator';
import { ISubcommandOptions as ISubcommandGroupOptions } from '@/core/decorators/subcommand-group.decorator';
import { CooldownOptions } from '@/core/decorators/cooldown.decorator';
import { BasePlugin } from '@/core/structures/BasePlugin';

/**
 * Tipo de constructor genérico
 */
type Constructor<T = any> = new (...args: any[]) => T;
type PluginClass = new (...args: any[]) => BasePlugin;

/**
 * Tipo que acepta tanto una clase (Constructor) como instance.constructor (Function)
 * Esto permite usar: metadataHandler.getCooldown(MiClase) o metadataHandler.getCooldown(instancia.constructor)
 */
export type ClassOrConstructor = Constructor | Function;

/**
 * Normaliza el target a Constructor para uso interno
 */
function asConstructor(target: ClassOrConstructor): Constructor {
    return target as Constructor;
}

/**
 * Resultado de la resolución del tipo de comando
 */
export type CommandMetadataResult =
    | { type: 'command'; meta: ICommandOptions }
    | { type: 'subcommand'; meta: ISubcommandOptions }
    | { type: 'subcommand-group'; meta: ISubcommandGroupOptions }
    | null;

/**
 * MetadataHandler - API de alto nivel para acceso a metadatos
 *
 * Proporciona una interfaz limpia y tipada para acceder a la metadata
 * centralizada. Todos los accesos pasan por aquí, eliminando la necesidad
 * de llamar a Reflect.getMetadata directamente.
 *
 * @example
 * ```ts
 * import { metadataHandler } from '@/core/metadata';
 *
 * * Usando la clase directamente
 * const cooldown = metadataHandler.getCooldown(PingCommand);
 *
 * * Usando instance.constructor
 * const cooldown = metadataHandler.getCooldown(command.constructor);
 *
 * * Obtener permisos requeridos
 * const permissions = metadataHandler.getRequiredPermissions(BanCommand);
 *
 * * Obtener argumentos
 * const args = metadataHandler.getArguments(SayCommand);
 * ```
 */
class MetadataHandlerClass {
    // ========================================
    // MÉTODOS DE ACCESO A COMANDOS
    // ========================================

    /**
     * Obtiene la metadata completa de un comando
     * @param target - Clase del comando o instancia.constructor
     */
    getCommandEntry(target: ClassOrConstructor): CommandMetadataEntry | undefined {
        return MetadataStore.getCommandEntry(asConstructor(target));
    }

    /**
     * Obtiene la metadata de @Command
     *
     * @param target - Clase del comando o instancia.constructor
     */
    getCommand(target: ClassOrConstructor): ICommandOptions | undefined {
        return MetadataStore.getCommand(asConstructor(target));
    }

    /**
     * Obtiene la metadata de @Subcommand
     * @param target - Clase del comando o instancia.constructor
     */
    getSubcommand(target: ClassOrConstructor): ISubcommandOptions | undefined {
        return MetadataStore.getSubcommand(asConstructor(target));
    }

    /**
     * Obtiene la metadata de @SubcommandGroup
     * @param target - Clase del comando o instancia.constructor
     */
    getSubcommandGroup(target: ClassOrConstructor): ISubcommandGroupOptions | undefined {
        return MetadataStore.getSubcommandGroup(asConstructor(target));
    }

    /**
     * Obtiene la metadata del comando con su tipo
     * Útil para determinar si es command, subcommand o subcommand-group
     *
     * @param target - Clase del comando o instancia.constructor
     * @returns Objeto con type y meta, o null si no tiene metadata
     */
    getCommandMetadata(target: ClassOrConstructor): CommandMetadataResult {
        const entry = MetadataStore.getCommandEntry(asConstructor(target));
        if (!entry) return null;

        // Prioridad: SubcommandGroup > Subcommand > Command
        if (entry.subcommandGroup) {
            return { type: 'subcommand-group', meta: entry.subcommandGroup };
        }
        if (entry.subcommand) {
            return { type: 'subcommand', meta: entry.subcommand };
        }
        if (entry.command) {
            return { type: 'command', meta: entry.command };
        }

        return null;
    }

    /**
     * Obtiene la metadata del comando, buscando también en la clase padre si es necesario
     *
     * @deprecated Ya no es necesario usar este método, getCommandMetadata() ahora busca automáticamente en la herencia
     * @param target - Clase del comando o instancia.constructor
     * @param _searchParent - Ignorado (siempre busca en herencia ahora)
     */
    getCommandMetadataWithInheritance(
        target: ClassOrConstructor,
        _searchParent = true,
    ): CommandMetadataResult {
        // MetadataStore ahora busca automáticamente en la cadena de herencia
        return this.getCommandMetadata(target);
    }

    // ========================================
    // MÉTODOS DE ACCESO A ARGUMENTOS
    // ========================================

    /**
     * Obtiene los argumentos de un comando
     * @param target - Clase del comando o instancia.constructor
     */
    getArguments(target: ClassOrConstructor): IArgumentOptions[] {
        return MetadataStore.getArguments(asConstructor(target));
    }

    /**
     * Verifica si un comando tiene argumentos
     * @param target - Clase del comando o instancia.constructor
     */
    hasArguments(target: ClassOrConstructor): boolean {
        return MetadataStore.getArguments(asConstructor(target)).length > 0;
    }

    // ========================================
    // MÉTODOS DE ACCESO A COOLDOWN
    // ========================================

    /**
     * Obtiene la configuración de cooldown de un comando
     * @param target - Clase del comando o instancia.constructor
     */
    getCooldown(target: ClassOrConstructor): CooldownOptions | undefined {
        return MetadataStore.getCooldown(asConstructor(target));
    }

    /**
     * Verifica si un comando tiene cooldown configurado
     * @param target - Clase del comando o instancia.constructor
     */
    hasCooldown(target: ClassOrConstructor): boolean {
        return MetadataStore.getCooldown(asConstructor(target)) !== undefined;
    }

    /**
     * Obtiene el tiempo de cooldown en milisegundos
     * @param target - Clase del comando o instancia.constructor
     */
    getCooldownTime(target: ClassOrConstructor): number {
        return MetadataStore.getCooldown(asConstructor(target))?.time ?? 0;
    }

    // ========================================
    // MÉTODOS DE ACCESO A PERMISOS
    // ========================================

    /**
     * Obtiene los permisos requeridos para ejecutar un comando
     * @param target - Clase del comando o instancia.constructor
     */
    getRequiredPermissions(target: ClassOrConstructor): bigint[] | undefined {
        return MetadataStore.getRequiredPermissions(asConstructor(target));
    }

    /**
     * Verifica si un comando requiere permisos específicos
     * @param target - Clase del comando o instancia.constructor
     */
    hasRequiredPermissions(target: ClassOrConstructor): boolean {
        const perms = MetadataStore.getRequiredPermissions(asConstructor(target));
        return perms !== undefined && perms.length > 0;
    }

    /**
     * Obtiene los permisos que el bot necesita para ejecutar el comando
     * @param target - Clase del comando o instancia.constructor
     */
    getBotPermissions(target: ClassOrConstructor): bigint[] | undefined {
        return MetadataStore.getBotPermissions(asConstructor(target));
    }

    /**
     * Verifica si un comando requiere permisos del bot
     * @param target - Clase del comando o instancia.constructor
     */
    hasBotPermissions(target: ClassOrConstructor): boolean {
        const perms = MetadataStore.getBotPermissions(asConstructor(target));
        return perms !== undefined && perms.length > 0;
    }

    // ========================================
    // MÉTODOS DE ACCESO A PLUGINS
    // ========================================

    /**
     * Obtiene los plugins configurados para un comando via @UsePlugins
     * @param target - Clase del comando o instancia.constructor
     */
    getPlugins(target: ClassOrConstructor): PluginClass[] {
        return MetadataStore.getPlugins(asConstructor(target));
    }

    /**
     * Verifica si un comando tiene plugins configurados
     * @param target - Clase del comando o instancia.constructor
     */
    hasPlugins(target: ClassOrConstructor): boolean {
        return MetadataStore.getPlugins(asConstructor(target)).length > 0;
    }

    // ========================================
    // MÉTODOS UTILITARIOS
    // ========================================

    /**
     * Verifica si una clase tiene metadata de comando registrada
     * @param target - Clase del comando o instancia.constructor
     */
    isCommand(target: ClassOrConstructor): boolean {
        return MetadataStore.hasCommandMetadata(asConstructor(target));
    }

    /**
     * Obtiene el tipo de comando
     * @param target - Clase del comando o instancia.constructor
     */
    getCommandType(
        target: ClassOrConstructor,
    ): 'command' | 'subcommand' | 'subcommand-group' | null {
        return MetadataStore.getCommandType(asConstructor(target));
    }

    /**
     * Obtiene todas las clases de comandos registradas
     */
    getAllCommands(): Constructor[] {
        return MetadataStore.getAllCachedCommandClasses();
    }

    /**
     * Obtiene estadísticas del sistema de metadata
     */
    getStats(): { commands: number; initialized: boolean } {
        return MetadataStore.getStats();
    }
}

/**
 * Instancia singleton del MetadataHandler
 * Esta es la API principal para acceder a metadatos desde cualquier parte del código
 */
export const metadataHandler = new MetadataHandlerClass();
