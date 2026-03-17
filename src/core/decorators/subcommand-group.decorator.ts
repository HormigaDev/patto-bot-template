import 'reflect-metadata';
import { Category } from '@/utils/CommandCategories';

export interface ISubcommandOptions {
    parent: string;
    name: string;
    subcommand: string;
    description: string;
    category?: Category;
}

export const SUBCOMMAND_GROUP_METADATA_KEY = Symbol('subcommandMetadata');

export function SubcommandGroup(options: ISubcommandOptions): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(SUBCOMMAND_GROUP_METADATA_KEY, options, target);
    };
}
