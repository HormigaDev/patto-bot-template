import 'reflect-metadata';
import { ICommandOptions, COMMAND_METADATA_KEY } from '@/core/decorators/command.decorator';
import { IArgumentOptions, ARGUMENT_METADATA_KEY } from '@/core/decorators/argument.decorator';
import {
    ISubcommandOptions,
    SUBCOMMAND_METADATA_KEY,
} from '@/core/decorators/subcommand.decorator';
import {
    ISubcommandOptions as ISubcommandGroupOptions,
    SUBCOMMAND_GROUP_METADATA_KEY,
} from '@/core/decorators/subcommand-group.decorator';
import { CooldownOptions, COOLDOWN_METADATA_KEY } from '@/core/decorators/cooldown.decorator';
import { REQUIRE_PERMISSIONS_METADATA_KEY } from '@/core/decorators/permission.decorator';
import { BOT_PERMISSIONS_METADATA_KEY } from '@/core/decorators/bot-permission.decorator';
import { PLUGIN_METADATA_KEY } from '@/core/decorators/plugin.decorator';
import { BasePlugin } from '@/core/structures/BasePlugin';

/**
 * Tipo de constructor genérico
 */
type Constructor<T = any> = new (...args: any[]) => T;
type PluginClass = new (...args: any[]) => BasePlugin;

/**
 * Estructura completa de metadata para un comando
 */
export interface CommandMetadataEntry {
    command?: ICommandOptions;
    subcommand?: ISubcommandOptions;
    subcommandGroup?: ISubcommandGroupOptions;
    arguments?: IArgumentOptions[];
    cooldown?: CooldownOptions;
    requiredPermissions?: bigint[];
    botPermissions?: bigint[];
    plugins?: PluginClass[];
}

/**
 * MetadataStore - Almacén centralizado de metadatos con caché
 *
 * Este store lee la metadata desde Reflect una sola vez y la cachea
 * para evitar múltiples llamadas a Reflect.getMetadata durante el runtime.
 *
 * Reflect.getMetadata ya maneja automáticamente la herencia de clases,
 * por lo que no necesitamos buscar manualmente en la cadena de prototipos.
 *
 * @example
 * \`\`\`ts
 * // Los decoradores usan Reflect.defineMetadata normalmente
 * @Command({ name: 'ping' })
 * @Cooldown({ time: 5000 })
 * class PingCommand extends BaseCommand { }
 *
 * // La primera consulta lee de Reflect y cachea
 * const cooldown = MetadataStore.getCooldown(PingCommand);
 *
 * // Las consultas siguientes usan el caché
 * const cooldown2 = MetadataStore.getCooldown(PingCommand); // desde caché
 * \`\`\`
 */
class MetadataStoreClass {
    /**
     * Caché de metadata de comandos indexado por referencia de clase
     */
    private commandCache = new Map<Constructor, CommandMetadataEntry>();

    /**
     * Set para rastrear clases que ya fueron consultadas (incluso si no tienen metadata)
     */
    private checkedClasses = new Set<Constructor>();

    /**
     * Indica si el store ha sido inicializado (carga inicial completada)
     */
    private initialized = false;

    // ========================================
    // MÉTODOS PRIVADOS DE LECTURA DESDE REFLECT
    // ========================================

    /**
     * Lee toda la metadata de Reflect para una clase y la cachea
     * Solo se ejecuta una vez por clase
     */
    private loadCommandMetadata(target: Constructor): CommandMetadataEntry | undefined {
        // Si ya la cacheamos, retornamos el caché
        if (this.commandCache.has(target)) {
            return this.commandCache.get(target);
        }

        // Si ya la revisamos y no tenía metadata, no la buscamos de nuevo
        if (this.checkedClasses.has(target)) {
            return undefined;
        }

        // Marcar como revisada
        this.checkedClasses.add(target);

        // Leer metadata desde Reflect (maneja herencia automáticamente)
        const command = Reflect.getMetadata(COMMAND_METADATA_KEY, target) as
            | ICommandOptions
            | undefined;
        const subcommand = Reflect.getMetadata(SUBCOMMAND_METADATA_KEY, target) as
            | ISubcommandOptions
            | undefined;
        const subcommandGroup = Reflect.getMetadata(SUBCOMMAND_GROUP_METADATA_KEY, target) as
            | ISubcommandGroupOptions
            | undefined;
        const args = Reflect.getMetadata(ARGUMENT_METADATA_KEY, target) as
            | IArgumentOptions[]
            | undefined;
        const cooldown = Reflect.getMetadata(COOLDOWN_METADATA_KEY, target) as
            | CooldownOptions
            | undefined;
        const requiredPermissions = Reflect.getMetadata(
            REQUIRE_PERMISSIONS_METADATA_KEY,
            target,
        ) as bigint[] | undefined;
        const botPermissions = Reflect.getMetadata(BOT_PERMISSIONS_METADATA_KEY, target) as
            | bigint[]
            | undefined;
        const plugins = Reflect.getMetadata(PLUGIN_METADATA_KEY, target) as
            | PluginClass[]
            | undefined;

        // Si no tiene ninguna metadata de comando, no cachear
        if (
            !command &&
            !subcommand &&
            !subcommandGroup &&
            !args &&
            !cooldown &&
            !requiredPermissions &&
            !botPermissions &&
            !plugins
        ) {
            return undefined;
        }

        // Construir entrada de metadata
        const entry: CommandMetadataEntry = {};
        if (command) entry.command = command;
        if (subcommand) entry.subcommand = subcommand;
        if (subcommandGroup) entry.subcommandGroup = subcommandGroup;
        if (args) entry.arguments = args;
        if (cooldown) entry.cooldown = cooldown;
        if (requiredPermissions) entry.requiredPermissions = requiredPermissions;
        if (botPermissions) entry.botPermissions = botPermissions;
        if (plugins) entry.plugins = plugins;

        // Cachear y retornar
        this.commandCache.set(target, entry);
        return entry;
    }

    // ========================================
    // MÉTODOS DE CONSULTA (API pública)
    // ========================================

    /**
     * Obtiene toda la metadata de un comando
     */
    getCommandEntry(target: Constructor): CommandMetadataEntry | undefined {
        return this.loadCommandMetadata(target);
    }

    /**
     * Obtiene la metadata de @Command
     */
    getCommand(target: Constructor): ICommandOptions | undefined {
        return this.loadCommandMetadata(target)?.command;
    }

    /**
     * Obtiene la metadata de @Subcommand
     */
    getSubcommand(target: Constructor): ISubcommandOptions | undefined {
        return this.loadCommandMetadata(target)?.subcommand;
    }

    /**
     * Obtiene la metadata de @SubcommandGroup
     */
    getSubcommandGroup(target: Constructor): ISubcommandGroupOptions | undefined {
        return this.loadCommandMetadata(target)?.subcommandGroup;
    }

    /**
     * Obtiene la metadata de @Arg[]
     */
    getArguments(target: Constructor): IArgumentOptions[] {
        return this.loadCommandMetadata(target)?.arguments ?? [];
    }

    /**
     * Obtiene la metadata de @Cooldown
     */
    getCooldown(target: Constructor): CooldownOptions | undefined {
        return this.loadCommandMetadata(target)?.cooldown;
    }

    /**
     * Obtiene la metadata de @RequirePermissions
     */
    getRequiredPermissions(target: Constructor): bigint[] | undefined {
        return this.loadCommandMetadata(target)?.requiredPermissions;
    }

    /**
     * Obtiene la metadata de @BotPermissions
     */
    getBotPermissions(target: Constructor): bigint[] | undefined {
        return this.loadCommandMetadata(target)?.botPermissions;
    }

    /**
     * Obtiene la metadata de @UsePlugins
     */
    getPlugins(target: Constructor): PluginClass[] {
        return this.loadCommandMetadata(target)?.plugins ?? [];
    }

    /**
     * Verifica si un comando tiene metadata registrada
     */
    hasCommandMetadata(target: Constructor): boolean {
        return this.loadCommandMetadata(target) !== undefined;
    }

    /**
     * Obtiene el tipo de comando
     */
    getCommandType(target: Constructor): 'command' | 'subcommand' | 'subcommand-group' | null {
        const entry = this.loadCommandMetadata(target);
        if (!entry) return null;

        if (entry.subcommandGroup) return 'subcommand-group';
        if (entry.subcommand) return 'subcommand';
        if (entry.command) return 'command';

        return null;
    }

    /**
     * Obtiene todas las clases de comandos en caché
     * Nota: Solo retorna las clases que ya fueron consultadas
     */
    getAllCachedCommandClasses(): Constructor[] {
        return Array.from(this.commandCache.keys());
    }

    // ========================================
    // MÉTODOS DE CICLO DE VIDA
    // ========================================

    /**
     * Marca el store como inicializado
     */
    markInitialized(): void {
        this.initialized = true;
    }

    /**
     * Verifica si el store está inicializado
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Limpia todo el caché (útil para tests)
     */
    clear(): void {
        this.commandCache.clear();
        this.checkedClasses.clear();
        this.initialized = false;
    }

    /**
     * Obtiene estadísticas del store
     */
    getStats(): { commands: number; initialized: boolean } {
        return {
            commands: this.commandCache.size,
            initialized: this.initialized,
        };
    }
}

/**
 * Instancia singleton del MetadataStore
 * Esta es la única referencia global a toda la metadata del sistema
 */
export const MetadataStore = new MetadataStoreClass();
