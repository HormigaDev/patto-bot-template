import { Arg } from '@/core/decorators/argument.decorator';
import { SubcommandGroup } from '@/core/decorators/subcommand-group.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { User } from 'discord.js';

@SubcommandGroup({
    parent: 'server',
    name: 'user',
    subcommand: 'info',
    description: 'Muestra la información de un usuario',
})
export class ServerUserInfoCommand extends BaseCommand {
    @Arg({
        name: 'usuario',
        description: 'El usuario de cual se quiere visualizar la información',
    })
    targetUser!: User;

    async run() {
        const user = this.targetUser || this.user;
        const embed = this.getEmbed('info');
        embed.setTitle(`Información de usuario: ${user.tag}`);
        embed.setThumbnail(user.displayAvatarURL({ forceStatic: false }));
        embed.addFields(
            { name: 'ID', value: user.id, inline: true },
            {
                name: 'Creado el',
                value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`,
                inline: true,
            },
        );

        await this.send({ embeds: [embed] });
    }
}
