import * as fs from 'fs';
import * as path from 'path';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { COMMAND_METADATA_KEY, ICommandOptions } from '@/core/decorators/command.decorator';
import { ARGUMENT_METADATA_KEY, IArgumentOptions } from '@/core/decorators/argument.decorator';
import { CommandCategoryTag } from '@/utils/CommandCategories';
import { getPrefix } from '@/core/resolvers/prefix.resolver';
import { getSubcommandMethodName, validateCommandLevels } from '@/utils/CommandUtils';

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
     * Valida que existan los métodos subcommand<Name> para cada subcomando declarado
     */
    private validateSubcommands(commandClass: CommandClass, meta: ICommandOptions): void {
        if (!meta.subcommands || meta.subcommands.length === 0) {
            return;
        }

        const prototype = commandClass.prototype;
        const missingMethods: string[] = [];
        const invalidNames: string[] = [];

        for (const subcommand of meta.subcommands) {
            // Validar que el nombre sea válido (Discord requirements)
            // Puede ser:
            // - 1 palabra: "get" (subcomando simple)
            // - 2 palabras: "config get" (grupo + subcomando para 3 niveles)
            // Cada palabra debe ser lowercase, solo alfanumérico y guiones

            const words = subcommand.split(' ');

            // Máximo 2 palabras (para 3 niveles: comando + "grupo subcomando")
            if (words.length > 2) {
                invalidNames.push(subcommand);
                continue;
            }

            // Validar cada palabra
            const validWordRegex = /^[a-z0-9-]+$/;
            let hasInvalidWord = false;

            for (const word of words) {
                if (!validWordRegex.test(word)) {
                    hasInvalidWord = true;
                    break;
                }
            }

            if (hasInvalidWord) {
                invalidNames.push(subcommand);
                continue;
            }

            // Convertir kebab-case a camelCase para el nombre del método
            // "get" → "subcommandGet"
            // "delete-all" → "subcommandDeleteAll"
            const methodName = getSubcommandMethodName(subcommand);

            if (typeof prototype[methodName] !== 'function') {
                missingMethods.push(`${methodName}() para "${subcommand}"`);
            }
        }

        if (invalidNames.length > 0) {
            throw new Error(
                `❌ El comando "${meta.name}" tiene subcomandos con nombres inválidos:\n` +
                    `   ${invalidNames.join(', ')}\n\n` +
                    `Los nombres de subcomandos deben:\n` +
                    `   • Estar en minúsculas\n` +
                    `   • Contener solo letras, números y guiones en cada palabra\n` +
                    `   • Máximo 2 palabras separadas por espacio (para 3 niveles)\n\n` +
                    `Ejemplos válidos:\n` +
                    `   • "get" (1 nivel)\n` +
                    `   • "config get" (2 palabras para 3 niveles)\n` +
                    `   • "delete-all" (kebab-case)\n\n` +
                    `Ejemplos inválidos:\n` +
                    `   • "Get" (mayúscula)\n` +
                    `   • "set_value" (underscore)\n` +
                    `   • "config get set" (3 palabras - excede límite)`,
            );
        }

        if (missingMethods.length > 0) {
            throw new Error(
                `❌ El comando "${meta.name}" declara subcomandos pero faltan los siguientes métodos:\n` +
                    `   ${missingMethods.map((m) => `- ${m}`).join('\n   ')}\n\n` +
                    `Asegúrate de implementar todos los métodos requeridos en la clase.`,
            );
        }
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

                // Validar que el nombre del comando sea válido según Discord
                const nameParts = meta.name.split(' ');

                // Validar niveles usando función centralizada
                validateCommandLevels(meta.name, `archivo: ${path.basename(filePath)}`);

                // Validar que cada parte del nombre sea válida
                const validNameRegex = /^[a-z0-9-]+$/;
                for (const part of nameParts) {
                    if (!validNameRegex.test(part)) {
                        throw new Error(
                            `❌ El comando "${meta.name}" (archivo: ${path.basename(filePath)}) tiene una palabra inválida: "${part}"\n\n` +
                                `Cada palabra debe:\n` +
                                `  • Estar en minúsculas\n` +
                                `  • Contener solo letras, números y guiones\n` +
                                `  • NO contener espacios ni caracteres especiales\n\n` +
                                `Ejemplos válidos: "ping", "user-info", "server-config"\n` +
                                `Ejemplos inválidos: "Ping", "user Info", "server_config"`,
                        );
                    }
                }

                // Detectar nombre esperado del comando basado en el nombre del archivo
                // Convención: kebab-case en archivo → espacios en metadata
                // Ejemplo: user-info.command.ts → name: 'user info'
                // Ejemplo: server-config-get.command.ts → name: 'server config get'
                const fileName = path.basename(filePath, extension);

                // Eliminar .command del nombre
                const commandFileName = fileName.replace(/\.command$/, '');

                // Convertir kebab-case a espacios para el nombre esperado
                // "user-info" → "user info"
                // "server-config-get" → "server config get"
                const expectedNameFromFile = commandFileName.replace(/-/g, ' ');

                // Validar que el nombre en @Command coincida con el nombre del archivo
                if (meta.name !== expectedNameFromFile) {
                    console.warn(
                        `⚠️  Advertencia: El archivo "${path.basename(filePath)}" debería tener name: "${expectedNameFromFile}" en @Command\n` +
                            `   Archivo: ${commandFileName} (kebab-case)\n` +
                            `   Esperado en @Command: name: '${expectedNameFromFile}' (con espacios)\n` +
                            `   Actual en @Command: name: '${meta.name}'`,
                    );
                }

                // Validar subcomandos declarados explícitamente
                this.validateSubcommands(commandClass, meta);

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
     * Obtiene todos los subcomandos que empiezan con un prefijo
     * Ej: prefix "user" → ["user info", "user avatar"]
     */
    getSubcommandsByPrefix(prefix: string): string[] {
        const subcommands: string[] = [];
        const prefixLower = prefix.toLowerCase();

        for (const commandName of this.commands.keys()) {
            // Verificar si el comando empieza con el prefijo seguido de un espacio
            if (commandName.startsWith(prefixLower + ' ')) {
                subcommands.push(commandName);
            }
        }

        return subcommands.sort();
    }

    /**
     * Obtiene el tamaño de comandos cargados
     */
    get size(): number {
        return this.commands.size;
    }
}
