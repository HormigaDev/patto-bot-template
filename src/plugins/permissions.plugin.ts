import { REQUIRE_PERMISSIONS_METADATA_KEY } from '@/core/decorators/permission.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { BasePlugin } from '@/core/structures/BasePlugin';

/**
 * @docs docs/plugins/permissions.plugin.README.md
 */
export class PermissionsPlugin extends BasePlugin {
    async onBeforeRegisterCommand(
        commandClass: new (...args: any[]) => BaseCommand,
        commandJson: any,
    ): Promise<any | false | null | undefined> {
        const requiredPermissions = Reflect.getMetadata(
            REQUIRE_PERMISSIONS_METADATA_KEY,
            commandClass,
        ) as bigint[] | undefined;
        if (requiredPermissions) {
            const modifiedJson = {
                ...commandJson,
                default_member_permissions: requiredPermissions
                    .reduce((a, b) => a | b, BigInt(0))
                    .toString(),
            };

            return modifiedJson;
        }
    }

    async onBeforeExecute(command: BaseCommand): Promise<boolean> {
        const requiredPermissions = Reflect.getMetadata(
            REQUIRE_PERMISSIONS_METADATA_KEY,
            command.constructor,
        ) as bigint[] | undefined;
        if (requiredPermissions) {
            const member = command.ctx.member;

            for (const permission of requiredPermissions) {
                if (!member.permissions.has(permission)) {
                    const embed = command.getEmbed('error');
                    embed.setTitle('Permisos insuficientes');
                    embed.setDescription(
                        'No tienes los permisos necesarios para ejecutar este comando.',
                    );

                    await command.reply({ embeds: [embed] });
                    return false;
                }
            }
        }
        return true;
    }
}
