import { ValidationError } from '@/error/ValidationError';
import 'reflect-metadata';

export interface IArgumentOption {
    label: string;
    value: string | number;
}

export interface IArgumentOptions {
    name: string;
    normalizedName?: string; // Nombre normalizado (lowercase, sin acentos, solo alfanumérico)
    description: string;
    index?: number;
    required?: boolean;
    validate?: (val: any) => boolean | string;
    type?: () => any;
    parser?: (val: any) => any;
    rawText?: boolean; // Captura todo el texto después del comando (solo text commands)
    options?: IArgumentOption[]; // Opciones predefinidas (choices en Discord)
    propertyName?: string | symbol;
    designType?: any;
}

export const ARGUMENT_METADATA_KEY = Symbol('commandArguments');

export function Arg(options: IArgumentOptions): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol) => {
        if (options.index !== undefined) {
            throw new ValidationError('No se permite definir Index manualmente');
        }
        const designType = Reflect.getMetadata('design:type', target, propertyKey);

        const args = Reflect.getOwnMetadata(ARGUMENT_METADATA_KEY, target.constructor) || [];
        options.index = args.length;

        args.push({
            ...options,
            propertyName: propertyKey,
            designType,
        });

        args.sort((a: IArgumentOptions, b: IArgumentOptions) => a.index! - b.index!);

        Reflect.defineMetadata(ARGUMENT_METADATA_KEY, args, target.constructor);
    };
}
