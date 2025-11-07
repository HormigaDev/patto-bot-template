import 'reflect-metadata';
import { CommandCategoryTag } from '@/utils/CommandCategories';

export interface ICommandOptions {
    name: string;
    description: string;
    category?: CommandCategoryTag; // Categoría opcional del comando (default: Other)
    aliases?: string[];
    subcommands?: string[]; // Subcomandos opcionales (solo alfanuméricos lowercase sin acentos)
}

export const COMMAND_METADATA_KEY = Symbol('commandMetadata');

export function Command(options: ICommandOptions): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(COMMAND_METADATA_KEY, options, target);
    };
}
