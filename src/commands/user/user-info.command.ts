import { UserInfoDefinition } from '@/definition/user-info.definition';
import { Times } from '@/utils/Times';

/**
 * Subcomando: user info
 * Muestra información de un usuario
 */
export class UserInfoCommand extends UserInfoDefinition {
    async run(): Promise<void> {
        // Si no se especifica usuario, usar el que ejecuta el comando
        const targetUser = this.targetUser || this.user;

        const embed = this.getEmbed('info')
            .setTitle(`Información de ${targetUser.username}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: 'ID', value: targetUser.id, inline: true },
                {
                    name: 'Nombre de usuario',
                    value: targetUser.username,
                    inline: true,
                },
                {
                    name: 'Nombre global',
                    value: targetUser.globalName || '*No establecido*',
                    inline: true,
                },
                {
                    name: 'Es bot',
                    value: targetUser.bot ? 'Sí' : 'No',
                    inline: true,
                },
                {
                    name: 'Creado',
                    value: `<t:${Math.floor(targetUser.createdTimestamp / Times.seconds(1))}:R>`,
                    inline: true,
                },
            );

        await this.reply({ embeds: [embed] });
    }
}
