import { Message, ChatInputCommandInteraction } from 'discord.js';
import { CommandContext } from '@/core/structures/CommandContext';
import { IArgumentOptions } from '@/core/decorators/argument.decorator';
import { ValidationError } from '@/error/ValidationError';
import { TypeResolver } from './type.resolver';

export class ArgumentResolver {
    /**
     * Resuelve y valida todos los argumentos de un comando
     */
    static async resolveArguments(
        source: Message | ChatInputCommandInteraction,
        ctx: CommandContext,
        argsMeta: IArgumentOptions[],
        TCommandClass: any,
        textArgs?: any[],
    ): Promise<Map<string, any>> {
        const resolvedArgs = new Map<string, any>();

        for (const meta of argsMeta) {
            let rawValue: any;

            // Manejar rawText (solo para text commands)
            if (meta.rawText && !ctx.isInteraction) {
                rawValue = this.extractRawText(textArgs, meta);
            }
            // Obtener valor raw dependiendo del tipo de fuente (comportamiento normal)
            else if (ctx.isInteraction) {
                const interaction = source as ChatInputCommandInteraction;
                rawValue = interaction.options.get(meta.name)?.value;
            } else {
                rawValue = textArgs && meta.index !== undefined ? textArgs[meta.index] : undefined;
            }

            // Validar si es requerido
            if (meta.required && (rawValue === undefined || rawValue === null)) {
                throw new ValidationError(`El argumento \`${meta.name}\` es obligatorio.`);
            }

            // Si no hay valor y no es requerido, continuar
            if (rawValue === undefined || rawValue === null) {
                continue;
            }

            // Obtener tipo esperado (ya está almacenado en la metadata del argumento)
            const designType = (meta as any).designType;
            const typeName = designType?.name?.toLowerCase() || 'string';
            let value: any;

            // Tipos personalizados con parser
            if (meta.parser) {
                try {
                    value = meta.parser(rawValue);
                } catch (error) {
                    throw new ValidationError(
                        `Error al parsear \`${meta.name}\`: ${error instanceof Error ? error.message : 'Valor inválido'}`,
                    );
                }

                // Validar tipo si se especificó
                if (meta.type) {
                    const expectedType = meta.type();
                    if (!(value instanceof expectedType)) {
                        throw new ValidationError(
                            `El valor \`${meta.name}\` es inválido. Tipo esperado: \`${expectedType.name}\``,
                        );
                    }
                }
            }
            // Resolver tipos de Discord para slash commands
            else if (
                ctx.isInteraction &&
                ['user', 'channel', 'textchannel', 'role', 'guildmember'].includes(typeName)
            ) {
                value = await this.resolveDiscordTypeFromInteraction(
                    source as ChatInputCommandInteraction,
                    meta,
                    typeName,
                );

                if (!value && meta.required) {
                    throw new ValidationError(`No se pudo encontrar el ${typeName} especificado.`);
                }
            }
            // Resolver tipos de Discord para mensajes de texto
            else if (
                !ctx.isInteraction &&
                ['user', 'channel', 'textchannel', 'role', 'guildmember'].includes(typeName)
            ) {
                const msg = source as Message;
                value = await TypeResolver.resolveDiscordType(rawValue, typeName, msg, ctx);

                if (!value) {
                    throw new ValidationError(
                        `No se pudo encontrar el ${typeName} especificado: \`${rawValue}\``,
                    );
                }
            }
            // Coerción de tipos primitivos
            else {
                // Verificar si es un tipo personalizado sin parser
                const isPrimitive = ['string', 'number', 'boolean', 'array'].includes(typeName);
                const isDiscordType = [
                    'user',
                    'channel',
                    'textchannel',
                    'role',
                    'guildmember',
                ].includes(typeName);

                if (!isPrimitive && !isDiscordType) {
                    // Mensaje en español: es un error del desarrollador
                    // (mal uso de @Arg), no algo que el usuario final deba
                    // leer en producción.
                    throw new ValidationError(
                        `El argumento \`${meta.name}\` es de tipo personalizado \`${designType.name}\` y requiere un parser.\n` +
                            `Ejemplo: @Arg({ ..., parser: (val) => new ${designType.name}(val), type: () => ${designType.name} })`,
                    );
                }

                const coerced = TypeResolver.coerceType(rawValue, designType);
                if (coerced.error) {
                    throw new ValidationError(
                        `El valor \`${meta.name}\` es inválido. Tipo esperado: \`${designType.name}\``,
                    );
                }
                value = coerced.value;
            }

            // Validar opciones predefinidas (choices)
            if (meta.options && meta.options.length > 0) {
                const validValues = meta.options.map((opt) => opt.value);
                if (!validValues.includes(value)) {
                    const validOptions = meta.options
                        .map((opt) => `\`${opt.label}\` (${opt.value})`)
                        .join(', ');
                    throw new ValidationError(
                        `El valor de \`${meta.name}\` debe ser una de las opciones válidas: ${validOptions}`,
                    );
                }
            }

            // Ejecutar validación personalizada
            if (meta.validate) {
                const result = meta.validate(value);
                if (result !== true) {
                    const errorMsg =
                        typeof result === 'string' ? result : `Valor \`${value}\` no válido`;
                    throw new ValidationError(errorMsg);
                }
            }

            // Guardar argumento resuelto
            resolvedArgs.set((meta as any).propertyName, value);
        }

        return resolvedArgs;
    }

    /**
     * Resuelve tipos de Discord desde una interacción (Discord.js ya los resuelve)
     */
    private static async resolveDiscordTypeFromInteraction(
        interaction: ChatInputCommandInteraction,
        meta: IArgumentOptions,
        typeName: string,
    ): Promise<any> {
        const option = interaction.options.get(meta.name);

        switch (typeName) {
            case 'user':
                return option?.user;
            case 'guildmember':
                return option?.member;
            case 'channel':
                return option?.channel;
            case 'textchannel':
                return option?.channel;
            case 'role':
                return option?.role;
            default:
                return null;
        }
    }

    /**
     * Extrae texto crudo desde los argumentos parseados
     * Toma todos los elementos desde el índice del argumento rawText y los une
     */
    private static extractRawText(
        textArgs: any[] | undefined,
        currentMeta: IArgumentOptions,
    ): string {
        if (!textArgs || textArgs.length === 0) {
            return '';
        }

        // El índice del argumento rawText indica desde dónde empezar
        const startIndex = currentMeta.index ?? 0;

        // Tomar todos los elementos desde startIndex y unirlos con espacio
        const remainingArgs = textArgs.slice(startIndex);

        if (remainingArgs.length === 0) {
            return '';
        }

        // Unir todos los argumentos restantes como texto
        return remainingArgs.map((arg) => String(arg)).join(' ');
    }
}
