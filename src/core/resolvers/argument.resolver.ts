import { Message, ChatInputCommandInteraction } from 'discord.js';
import { CommandContext } from '@/core/structures/CommandContext';
import { IArgumentOptions } from '@/core/decorators/argument.decorator';
import { ValidationError } from '@/error/ValidationError';
import { TypeResolver } from './type.resolver';
import { getPrefix } from './prefix.resolver';

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

        // Para comandos de texto, obtener el contenido completo del mensaje
        const fullMessageContent = source instanceof Message ? source.content.trim() : undefined;

        for (const meta of argsMeta) {
            let rawValue: any;

            // Manejar rawText (solo para text commands)
            if (meta.rawText && !ctx.isInteraction) {
                rawValue = this.extractRawText(fullMessageContent!, argsMeta, meta, resolvedArgs);
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

            // Obtener tipo esperado
            const designType = Reflect.getMetadata(
                'design:type',
                TCommandClass.prototype,
                (meta as any).propertyName,
            );

            const typeName = designType.name.toLowerCase();
            let value: any;

            // Tipos personalizados con parser
            if (meta.parser) {
                try {
                    value = meta.parser(rawValue);
                } catch (error) {
                    throw new ValidationError(
                        `Error al parsear \`${meta.name}\`: ${
                            error instanceof Error ? error.message : 'Valor inválido'
                        }`,
                    );
                }

                // Validar tipo si se especificó
                if (meta.type) {
                    const expectedType = meta.type();
                    if (!(value instanceof expectedType)) {
                        throw new ValidationError(
                            `El parser de \`${meta.name}\` debe retornar una instancia de \`${expectedType.name}\``,
                        );
                    }
                }
            }
            // Resolver tipos de Discord para slash commands
            else if (
                ctx.isInteraction &&
                ['user', 'channel', 'role', 'member'].includes(typeName)
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
                ['user', 'channel', 'role', 'member'].includes(typeName)
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
                const isDiscordType = ['user', 'channel', 'role', 'member', 'guildmember'].includes(
                    typeName,
                );

                if (!isPrimitive && !isDiscordType) {
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
            case 'member':
                return option?.member;
            case 'channel':
                return option?.channel;
            case 'role':
                return option?.role;
            default:
                return null;
        }
    }

    /**
     * Extrae texto crudo desde el mensaje completo
     * Salta el prefijo, nombre del comando y argumentos anteriores
     */
    private static extractRawText(
        fullMessageContent: string,
        allArgsMeta: IArgumentOptions[],
        currentMeta: IArgumentOptions,
        resolvedArgs: Map<string, any>,
    ): string {
        // Remover prefijo (por defecto "!")
        const PREFIX = getPrefix();
        let content = fullMessageContent;

        if (content.startsWith(PREFIX)) {
            content = content.slice(PREFIX.length).trim();
        }

        // Remover nombre del comando (primera palabra)
        const parts = content.split(/\s+/);
        parts.shift(); // Remover nombre del comando

        // Si no hay argumentos previos con menor índice, retornar todo el texto restante
        const previousArgs = allArgsMeta.filter(
            (arg) =>
                arg.index !== undefined &&
                currentMeta.index !== undefined &&
                arg.index < currentMeta.index &&
                !arg.rawText,
        );

        if (previousArgs.length === 0) {
            return parts.join(' ');
        }

        // Calcular cuántas palabras/tokens saltar basado en argumentos previos
        let tokensToSkip = 0;

        for (const prevArg of previousArgs.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))) {
            const resolvedValue = resolvedArgs.get(prevArg.propertyName as string);

            if (resolvedValue !== undefined && resolvedValue !== null) {
                // Si el argumento previo tenía comillas, solo cuenta como 1 token
                // Si no, cuenta como 1 token también
                tokensToSkip++;
            }
        }

        // Saltar los tokens de argumentos previos y retornar el resto
        const remainingParts = parts.slice(tokensToSkip);
        return remainingParts.join(' ');
    }
}
