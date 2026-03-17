import 'reflect-metadata';

export interface CooldownOptions {
    time: number;
}

export const COOLDOWN_METADATA_KEY = Symbol('cooldownMetadata');

/**
 * Decorador para marcar los comandos que usan cooldown
 */
export function Cooldown(options: CooldownOptions): ClassDecorator {
    return (target) => {
        Reflect.defineMetadata(COOLDOWN_METADATA_KEY, options, target);
    };
}
