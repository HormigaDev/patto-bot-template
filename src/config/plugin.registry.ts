import { BasePlugin } from '@/core/structures/BasePlugin';
import { BaseCommand } from '@/core/structures/BaseCommand';

/**
 * Tipo de scope para plugins
 */
export enum PluginScope {
    /** Comandos en una carpeta específica (no incluye subcarpetas) */
    Folder = 'folder',

    /** Comandos en una carpeta y todas sus subcarpetas */
    DeepFolder = 'deep-folder',

    /** Lista específica de comandos */
    Specified = 'specified',
}

/**
 * Configuración de un plugin con su scope
 */
export interface PluginConfig {
    /** Instancia del plugin */
    plugin: BasePlugin;

    /** Tipo de scope */
    scope: PluginScope;

    /**
     * Ruta de la carpeta (relativa a /src/commands/)
     * Solo aplica para Folder y DeepFolder
     * Ejemplo: '' (raíz), 'admin', 'moderation'
     */
    folderPath?: string;

    /**
     * Lista de clases de comandos específicos
     * Solo aplica para Specified
     */
    commands?: (new (...args: any[]) => BaseCommand)[];
}

/**
 * Registro global de plugins con sus configuraciones
 */
export class PluginRegistry {
    private static configs: PluginConfig[] = [];

    /**
     * Registra una configuración de plugin
     */
    static register(config: PluginConfig): void {
        this.configs.push(config);
    }

    /**
     * Obtiene todos los plugins aplicables a un comando
     * @param commandClass Clase del comando
     * @param commandPath Ruta del archivo del comando (relativa a /src/commands/)
     */
    static getPluginsForCommand(
        commandClass: new (...args: any[]) => BaseCommand,
        commandPath: string,
    ): BasePlugin[] {
        const plugins: BasePlugin[] = [];

        for (const config of this.configs) {
            if (this.shouldApplyPlugin(config, commandClass, commandPath)) {
                plugins.push(config.plugin);
            }
        }

        return plugins;
    }

    /**
     * Determina si un plugin debe aplicarse a un comando
     */
    private static shouldApplyPlugin(
        config: PluginConfig,
        commandClass: new (...args: any[]) => BaseCommand,
        commandPath: string,
    ): boolean {
        switch (config.scope) {
            case PluginScope.Folder:
                return this.matchesFolder(commandPath, config.folderPath || '');

            case PluginScope.DeepFolder:
                return this.matchesDeepFolder(commandPath, config.folderPath || '');

            case PluginScope.Specified:
                return this.matchesSpecified(commandClass, config.commands || []);

            default:
                return false;
        }
    }

    /**
     * Verifica si el comando está en la carpeta exacta
     */
    private static matchesFolder(commandPath: string, folderPath: string): boolean {
        const normalizedCommandPath = commandPath.replace(/\\/g, '/');
        const normalizedFolderPath = folderPath.replace(/\\/g, '/');

        // Si folderPath es vacío, solo coincide con archivos en la raíz
        if (normalizedFolderPath === '') {
            return !normalizedCommandPath.includes('/');
        }

        // Verificar que esté en la carpeta pero no en subcarpetas
        const commandDir = normalizedCommandPath.substring(
            0,
            normalizedCommandPath.lastIndexOf('/'),
        );

        return commandDir === normalizedFolderPath;
    }

    /**
     * Verifica si el comando está en la carpeta o subcarpetas
     */
    private static matchesDeepFolder(commandPath: string, folderPath: string): boolean {
        const normalizedCommandPath = commandPath.replace(/\\/g, '/');
        const normalizedFolderPath = folderPath.replace(/\\/g, '/');

        // Si folderPath es vacío, coincide con todos los comandos
        if (normalizedFolderPath === '') {
            return true;
        }

        // Verificar que empiece con la carpeta especificada
        return (
            normalizedCommandPath.startsWith(normalizedFolderPath + '/') ||
            normalizedCommandPath === normalizedFolderPath
        );
    }

    /**
     * Verifica si el comando está en la lista especificada
     */
    private static matchesSpecified(
        commandClass: new (...args: any[]) => BaseCommand,
        commands: (new (...args: any[]) => BaseCommand)[],
    ): boolean {
        return commands.includes(commandClass);
    }

    /**
     * Limpia el registro (útil para testing)
     */
    static clear(): void {
        this.configs = [];
    }

    /**
     * Obtiene todas las configuraciones registradas
     */
    static getAll(): PluginConfig[] {
        return [...this.configs];
    }
}
