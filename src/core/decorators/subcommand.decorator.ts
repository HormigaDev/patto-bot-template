import 'reflect-metadata';
import { Category } from '@/utils/CommandCategories';

export interface ISubcommandOptions {
    parent: string;
    name: string;
    description: string;
    category?: Category;
}

export const SUBCOMMAND_METADATA_KEY = Symbol('subcommandMetadata');

export function Subcommand(options: ISubcommandOptions): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(SUBCOMMAND_METADATA_KEY, options, target);
    };
}
