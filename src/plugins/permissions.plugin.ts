import { BaseCommand } from '@/core/structures/BaseCommand';
import { BasePlugin } from '@/core/structures/BasePlugin';
import { metadataHandler } from '@/core/metadata';

/**
 * @docs docs/plugins/permissions.plugin.README.md
 */
export class PermissionsPlugin extends BasePlugin {
    async onBeforeRegisterCommand(
        commandClass: new (...args: any[]) => BaseCommand,
        commandJson: any,
    ): Promise<any | false | null | undefined> {
        // Usar metadataHandler centralizado
        const requiredPermissions = metadataHandler.getRequiredPermissions(commandClass);
        if (requiredPermissions && requiredPermissions.length > 0) {
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
        // Usar metadataHandler centralizado
        const requiredPermissions = metadataHandler.getRequiredPermissions(
            command.constructor as new (...args: any[]) => any,
        );
        if (requiredPermissions && requiredPermissions.length > 0) {
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
