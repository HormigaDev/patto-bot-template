import { UserAvatarDefinition } from '@/definition/user.avatar.definition';

/**
 * Subcomando: user avatar
 * Muestra el avatar de un usuario
 */
export class UserAvatarCommand extends UserAvatarDefinition {
    async run(): Promise<void> {
        // Si no se especifica usuario, usar el que ejecuta el comando
        const targetUser = this.targetUser || this.user;

        const avatarUrl = targetUser.displayAvatarURL({ size: 1024 });

        const embed = this.getEmbed('info')
            .setTitle(`Avatar de ${targetUser.username}`)
            .setImage(avatarUrl)
            .setDescription(`[Descargar](${avatarUrl})`);

        await this.reply({ embeds: [embed] });
    }
}
