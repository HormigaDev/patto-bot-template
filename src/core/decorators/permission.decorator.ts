export const REQUIRE_PERMISSIONS_METADATA_KEY = Symbol('permissionsMetadata');

/**
 * Decorador aplicado a una CLASE para requerir permisos específicos
 * @important Solo se aplica a CLASES
 */
export function RequirePermissions(...permissions: bigint[]) {
    return (target: Function) => {
        Reflect.defineMetadata(REQUIRE_PERMISSIONS_METADATA_KEY, permissions, target);
    };
}
