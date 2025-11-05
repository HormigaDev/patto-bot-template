/**
 * Definiciones de categorías de comandos.
 * Cada categoría tiene un nombre, descripción y etiqueta única.
 * Estas categorías se utilizan para organizar y mostrar los comandos en la ayuda del bot.
 *
 * ## Uso en comandos
 *
 * La propiedad `category` en el decorador @Command es opcional.
 * Si no se especifica, el loader asignará automáticamente la categoría `Other`.
 *
 * @example
 * ```typescript
 * import { CommandCategoryTag } from '@/utils/CommandCategories';
 *
 * @Command({
 *     name: 'help',
 *     description: 'Muestra la ayuda',
 *     category: CommandCategoryTag.Info, // Opcional
 * })
 * ```
 *
 * ## Agregar nuevas categorías
 *
 * 1. Agrega el tag al enum `CommandCategoryTag`
 * 2. Agrega la definición completa al array `CommandCategories`
 *
 * @example
 * ```typescript
 * export enum CommandCategoryTag {
 *     Info = 'info',
 *     Moderation = 'moderation', // Nueva categoría
 *     Other = 'other',
 * }
 * ```
 */

export enum CommandCategoryTag {
    Info = 'info',
    Other = 'other',
}

export interface CommandCategory {
    name: string;
    description: string;
    tag: CommandCategoryTag;
    icon?: string; // Emoji o ícono representativo
}

export const CommandCategories: CommandCategory[] = [
    {
        name: 'Información',
        description: 'Comandos relacionados con la información del bot y del servidor.',
        tag: CommandCategoryTag.Info,
        icon: 'ℹ️',
    },
    {
        name: 'Otros',
        description: 'Comandos que no encajan en otras categorías.',
        tag: CommandCategoryTag.Other,
        icon: '❓',
    },
];
