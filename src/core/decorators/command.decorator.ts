import 'reflect-metadata';
import { Category } from '@/utils/CommandCategories';

export interface ICommandOptions {
    name: string;
    description: string;
    category?: Category; // Categoría opcional del comando (default: Other)
    aliases?: string[];
}

export const COMMAND_METADATA_KEY = Symbol('commandMetadata');

export function Command(options: ICommandOptions): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(COMMAND_METADATA_KEY, options, target);
    };
}
