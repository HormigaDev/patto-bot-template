import 'reflect-metadata';
import { BasePlugin } from '@/core/structures/BasePlugin';

export const PLUGIN_METADATA_KEY = Symbol('commandPlugins');

type PluginClass = new (...args: any[]) => BasePlugin;

/**
 * Decorador para definir plugins específicos de un comando
 * Los plugins se ejecutan en el orden especificado (onBeforeExecute)
 * y en orden inverso (onAfterExecute)
 *
 * @example
 * @Command({ name: 'ban' })
 * @UsePlugins(CooldownPlugin, RolePermissionPlugin)
 * export class BanCommand extends BaseCommand {
 *   async run() { ... }
 * }
 */
export function UsePlugins(...plugins: PluginClass[]): ClassDecorator {
    return (target: Function) => {
        Reflect.defineMetadata(PLUGIN_METADATA_KEY, plugins, target);
    };
}
