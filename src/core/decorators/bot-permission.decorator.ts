export const BOT_PERMISSIONS_METADATA_KEY = Symbol('botPermissionMetadata');

/**
 * Decorador aplicado a una CLASE para requerir permisos específicos en el bot
 * @important Solo se aplica a CLASES
 */
export function BotPermissions(...permissions: bigint[]) {
    return (target: Function) => {
        Reflect.defineMetadata(BOT_PERMISSIONS_METADATA_KEY, permissions, target);
    };
}
