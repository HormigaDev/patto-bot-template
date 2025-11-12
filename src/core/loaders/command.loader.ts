import * as fs from 'fs';
import * as path from 'path';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { COMMAND_METADATA_KEY, ICommandOptions } from '@/core/decorators/command.decorator';
import { ARGUMENT_METADATA_KEY, IArgumentOptions } from '@/core/decorators/argument.decorator';
import {
    SUBCOMMAND_GROUP_METADATA_KEY,
    ISubcommandOptions as ISubcommandGroupOptions,
} from '@/core/decorators/subcommand-group.decorator';
import {
    SUBCOMMAND_METADATA_KEY,
    ISubcommandOptions,
} from '@/core/decorators/subcommand.decorator';
import { CommandCategoryTag } from '@/utils/CommandCategories';
import { getPrefix } from '@/core/resolvers/prefix.resolver';

type CommandClass = new (...args: any[]) => BaseCommand;

/**
 * Umbral para decidir entre carga completa en memoria vs caching.
 *
 * Razonamiento:
 * - Cada comando ocupa aproximadamente 10KB de metadata en memoria.
 * - En la mayoría de despliegues, el número de comandos no supera los 100, lo que implica un uso de ~1MB de RAM.
 * - Por encima de 100 comandos (~1MB), el beneficio de cargar toda la metadata en memoria disminuye y puede afectar el rendimiento en sistemas con recursos limitados.
 * - El valor 100 fue elegido como un punto de equilibrio entre rendimiento (acceso rápido en memoria) y consumo de recursos, basado en pruebas internas y escenarios de crecimiento.
 * - Si el número de comandos aumenta significativamente, se recomienda ajustar este valor y considerar benchmarks específicos del entorno de producción.
 */
const MEMORY_THRESHOLD = 100;

type CommandMetadata =
    | { type: 'command'; meta: ICommandOptions }
    | { type: 'subcommand'; meta: ISubcommandOptions }
    | { type: 'subcommand-group'; meta: ISubcommandGroupOptions };

export interface CommandEntry {
    class: CommandClass;
    path: string; // Ruta relativa a /src/commands/
    category: CommandCategoryTag;
    metadata: CommandMetadata;
    key: string; // Clave en kebab-case para recuperación
}

export class CommandLoader {
    public prefix = getPrefix();
    private commands = new Map<string, CommandEntry>();
    private aliases = new Map<string, string>();
    private metadataCache = new Map<string, CommandMetadata>();
    private useMemoryStorage = false;

    /**
     * Normaliza un nombre de argumento: lowercase, sin acentos, solo alfanumérico
     */
    private normalizeArgumentName(name: string): string {
        return name
            .toLowerCase()
            .normalize('NFD') // Descompone caracteres con acentos
            .replace(/[\u0300-\u036f]/g, '') // Elimina marcas diacríticas (acentos)
            .replace(/[^a-z0-9]/g, ''); // Solo alfanumérico
    }

    /**
     * Convierte un array de strings a formato kebab-case
     */
    private toKebabCase(...parts: string[]): string {
        return parts.map((p) => p.toLowerCase()).join('-');
    }

    /**
     * Obtiene la metadata de un comando (con jerarquía)
     * Prioridad: @SubcommandGroup > @Subcommand > @Command
     */
    private getCommandMetadata(commandClass: CommandClass): CommandMetadata | null {
        // 1. Intentar SubcommandGroup
        const subcommandGroupMeta: ISubcommandGroupOptions | undefined = Reflect.getMetadata(
            SUBCOMMAND_GROUP_METADATA_KEY,
            commandClass,
        );
        if (subcommandGroupMeta) {
            return { type: 'subcommand-group', meta: subcommandGroupMeta };
        }

        // 2. Intentar Subcommand
        const subcommandMeta: ISubcommandOptions | undefined = Reflect.getMetadata(
            SUBCOMMAND_METADATA_KEY,
            commandClass,
        );
        if (subcommandMeta) {
            return { type: 'subcommand', meta: subcommandMeta };
        }

        // 3. Intentar Command
        let commandMeta: ICommandOptions | undefined = Reflect.getMetadata(
            COMMAND_METADATA_KEY,
            commandClass,
        );

        // Si no encuentra metadata en la clase, buscar en el prototipo padre
        if (!commandMeta && commandClass.prototype) {
            const parentClass = Object.getPrototypeOf(commandClass);
            if (parentClass && parentClass !== Function.prototype) {
                commandMeta = Reflect.getMetadata(COMMAND_METADATA_KEY, parentClass);
            }
        }

        if (commandMeta) {
            return { type: 'command', meta: commandMeta };
        }

        return null;
    }

    /**
     * Genera la clave en kebab-case según el tipo de comando
     */
    private generateKey(metadata: CommandMetadata): string {
        switch (metadata.type) {
            case 'subcommand-group':
                return this.toKebabCase(
                    metadata.meta.parent,
                    metadata.meta.name,
                    metadata.meta.subcommand,
                );
            case 'subcommand':
                return this.toKebabCase(metadata.meta.parent, metadata.meta.name);
            case 'command':
                return this.toKebabCase(metadata.meta.name);
        }
    }

    /**
     * Busca archivos recursivamente en un directorio
     */
    private findCommandFiles(dir: string, extension: string): string[] {
        const files: string[] = [];

        if (!fs.existsSync(dir)) {
            return files;
        }

        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                // Recursión en subdirectorios
                files.push(...this.findCommandFiles(fullPath, extension));
            } else if (entry.isFile() && entry.name.endsWith(`.command${extension}`)) {
                files.push(fullPath);
            }
        }

        return files;
    }

    /**
     * Carga todos los comandos desde el directorio de comandos
     */
    async loadCommands(): Promise<void> {
        console.log('🔄 Cargando comandos...');

        // Determinar extensión según entorno (desarrollo .ts, producción .js)
        const extension = __filename.endsWith('.ts') ? '.ts' : '.js';
        const commandsDir = path.join(
            process.cwd(),
            extension === '.ts' ? 'src' : 'dist/src',
            'commands',
        );

        const commandFiles = this.findCommandFiles(commandsDir, extension);

        let loadedCount = 0;
        let errorCount = 0;

        for (const filePath of commandFiles) {
            try {
                const module = await import(filePath);
                const commandClass = Object.values(module)[0] as CommandClass;

                if (!commandClass) {
                    errorCount++;
                    continue;
                }

                // Obtener metadata con jerarquía
                const metadata = this.getCommandMetadata(commandClass);
                if (!metadata) {
                    errorCount++;
                    continue;
                }

                // Normalizar nombres de argumentos
                const argsMeta: IArgumentOptions[] =
                    Reflect.getMetadata(ARGUMENT_METADATA_KEY, commandClass) || [];

                for (const arg of argsMeta) {
                    arg.normalizedName = this.normalizeArgumentName(arg.name);
                }

                // Actualizar metadata con argumentos normalizados
                if (argsMeta.length > 0) {
                    Reflect.defineMetadata(ARGUMENT_METADATA_KEY, argsMeta, commandClass);
                }

                // Calcular ruta relativa a /src/commands/
                const relativePath = path
                    .relative(commandsDir, filePath)
                    .replace(/\\/g, '/')
                    .replace(/\.command\.(ts|js)$/, '');

                // Obtener categoría según el tipo de metadata
                let category: CommandCategoryTag = CommandCategoryTag.Other;
                if (metadata.type === 'command' && metadata.meta.category) {
                    category = metadata.meta.category;
                } else if (metadata.type === 'subcommand' && metadata.meta.category) {
                    category = metadata.meta.category;
                } else if (metadata.type === 'subcommand-group' && metadata.meta.category) {
                    category = metadata.meta.category;
                }

                // Generar clave en kebab-case
                const key = this.generateKey(metadata);

                // Crear entrada de comando
                const entry: CommandEntry = {
                    class: commandClass,
                    path: relativePath,
                    category,
                    metadata,
                    key,
                };

                this.commands.set(key, entry);
                loadedCount++;

                // Registrar aliases solo para comandos base
                if (metadata.type === 'command' && metadata.meta.aliases) {
                    metadata.meta.aliases.forEach((alias) =>
                        this.aliases.set(alias.toLowerCase(), key),
                    );
                }
            } catch (error) {
                errorCount++;
                console.error(`  ❌ Error al cargar ${path.basename(filePath)}:`);
                console.error(`     ${error instanceof Error ? error.message : String(error)}`);
                if (error instanceof Error && error.stack) {
                    console.error(
                        `     Stack: ${error.stack.split('\n').slice(0, 3).join('\n     ')}`,
                    );
                }
            }
        }

        // Decidir estrategia de storage según umbral
        this.useMemoryStorage = loadedCount <= MEMORY_THRESHOLD;

        if (this.useMemoryStorage) {
            console.log('💾 Usando almacenamiento en memoria (comandos <= umbral)');
            // Cargar toda la metadata en memoria
            for (const [_key, entry] of this.commands) {
                this.metadataCache.set(entry.key, entry.metadata);
            }
        } else {
            console.log('🔄 Usando caché simple (comandos > umbral)');
        }

        console.log(`\n✅ Comandos cargados exitosamente: ${loadedCount}`);
        if (errorCount > 0) {
            console.log(`⚠️  Comandos con errores: ${errorCount}`);
        }

        if (loadedCount === 0 && commandFiles.length > 0) {
            throw new Error('No se pudo cargar ningún comando. Revisa los errores anteriores.');
        }
    }

    /**
     * Obtiene un comando por nombre o alias
     */
    getCommand(nameOrAlias: string): CommandClass | undefined {
        const entry =
            this.commands.get(nameOrAlias) || this.commands.get(this.aliases.get(nameOrAlias)!);
        return entry?.class;
    }

    /**
     * Obtiene comandos por categoría (incluye comandos base, subcomandos y grupos)
     */
    getCommandsByCategory(category: CommandCategoryTag): CommandClass[] {
        const result: CommandClass[] = [];
        for (const [_key, entry] of this.commands) {
            if (entry.category === category) {
                result.push(entry.class);
            }
        }
        return result;
    }

    /**
     * Obtiene la ruta de un comando por nombre o alias
     */
    getCommandPath(nameOrAlias: string): string | undefined {
        const entry =
            this.commands.get(nameOrAlias) || this.commands.get(this.aliases.get(nameOrAlias)!);
        return entry?.path;
    }

    /**
     * Obtiene un comando completo (clase + ruta) por nombre o alias
     */
    getCommandEntry(nameOrAlias: string): CommandEntry | undefined {
        return this.commands.get(nameOrAlias) || this.commands.get(this.aliases.get(nameOrAlias)!);
    }

    /**
     * Obtiene todos los comandos base (sin subcomandos)
     */
    getAllCommands(): Map<string, CommandClass> {
        const result = new Map<string, CommandClass>();
        for (const [key, entry] of this.commands) {
            // Solo incluir comandos base
            if (entry.metadata.type === 'command') {
                result.set(key, entry.class);
            }
        }
        return result;
    }

    /**
     * Obtiene todos los subcomandos de un comando base
     */
    getSubcommands(parentName: string): Map<string, CommandEntry> {
        const result = new Map<string, CommandEntry>();
        const normalizedParent = parentName.toLowerCase();

        for (const [key, entry] of this.commands) {
            if (entry.metadata.type === 'subcommand') {
                if (entry.metadata.meta.parent.toLowerCase() === normalizedParent) {
                    result.set(key, entry);
                }
            }
        }
        return result;
    }

    /**
     * Obtiene todos los grupos de subcomandos de un comando base
     */
    getSubcommandGroups(parentName: string): Map<string, Map<string, CommandEntry>> {
        const groups = new Map<string, Map<string, CommandEntry>>();
        const normalizedParent = parentName.toLowerCase();

        for (const [key, entry] of this.commands) {
            if (entry.metadata.type === 'subcommand-group') {
                if (entry.metadata.meta.parent.toLowerCase() === normalizedParent) {
                    const groupName = entry.metadata.meta.name.toLowerCase();
                    if (!groups.has(groupName)) {
                        groups.set(groupName, new Map());
                    }
                    groups.get(groupName)!.set(key, entry);
                }
            }
        }
        return groups;
    }

    /**
     * Obtiene todos los comandos con sus rutas
     */
    getAllCommandEntries(): Map<string, CommandEntry> {
        return this.commands;
    }

    /**
     * Obtiene el tamaño de comandos cargados
     */
    get size(): number {
        return this.commands.size;
    }
}
