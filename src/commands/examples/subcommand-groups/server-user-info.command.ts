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
        const embed = this.getEmbed('info');
        embed.setTitle(`Información de usuario: ${this.targetUser.tag}`);
        embed.setThumbnail(this.targetUser.displayAvatarURL({ forceStatic: false }));
        embed.addFields(
            { name: 'ID', value: this.targetUser.id, inline: true },
            {
                name: 'Creado el',
                value: `<t:${Math.floor(this.targetUser.createdTimestamp / 1000)}:F>`,
                inline: true,
            },
        );

        await this.send({ embeds: [embed] });
    }
}
