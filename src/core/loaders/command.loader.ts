import * as fs from 'fs';
import * as path from 'path';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { COMMAND_METADATA_KEY, ICommandOptions } from '@/core/decorators/command.decorator';
import { ARGUMENT_METADATA_KEY, IArgumentOptions } from '@/core/decorators/argument.decorator';
import { CommandCategoryTag } from '@/utils/CommandCategories';
import { getPrefix } from '@/core/resolvers/prefix.resolver';

type CommandClass = new (...args: any[]) => BaseCommand;

interface CommandEntry {
    class: CommandClass;
    path: string; // Ruta relativa a /src/commands/
    category: CommandCategoryTag;
}

export class CommandLoader {
    public prefix = getPrefix();
    private commands = new Map<string, CommandEntry>();
    private aliases = new Map<string, string>();

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

                // Buscar metadata en la clase actual y en su cadena de herencia
                let meta: ICommandOptions | undefined = Reflect.getMetadata(
                    COMMAND_METADATA_KEY,
                    commandClass,
                );

                // Si no encuentra metadata en la clase, buscar en el prototipo padre (clase abstracta)
                if (!meta && commandClass.prototype) {
                    const parentClass = Object.getPrototypeOf(commandClass);
                    if (parentClass && parentClass !== Function.prototype) {
                        meta = Reflect.getMetadata(COMMAND_METADATA_KEY, parentClass);
                    }
                }

                if (!meta) {
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

                // Obtener categoría desde metadata, usar 'Other' como fallback
                const category = (meta.category as CommandCategoryTag) || CommandCategoryTag.Other;

                this.commands.set(meta.name, {
                    class: commandClass,
                    path: relativePath,
                    category: category, // Almacenar categoría
                });
                loadedCount++;

                // Registrar aliases
                if (meta.aliases && meta.aliases.length > 0) {
                    meta.aliases.forEach((alias) => this.aliases.set(alias, meta.name));
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

    getCommandsByCategory(category: CommandCategoryTag): CommandClass[] {
        const result: CommandClass[] = [];
        for (const [_name, entry] of this.commands) {
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
     * Obtiene todos los comandos
     */
    getAllCommands(): Map<string, CommandClass> {
        const result = new Map<string, CommandClass>();
        for (const [name, entry] of this.commands) {
            result.set(name, entry.class);
        }
        return result;
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
