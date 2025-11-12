import { Arg } from '@/core/decorators/argument.decorator';
import { SubcommandGroup } from '@/core/decorators/subcommand-group.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@SubcommandGroup({
    parent: 'server',
    name: 'config',
    subcommand: 'set',
    description: 'Establece una configuración en el servidor',
})
export class ServerConfigSetCommand extends BaseCommand {
    @Arg({
        name: 'clave',
        description: 'La clave del valor a guardar',
        required: true,
    })
    key!: string;

    @Arg({
        name: 'valor',
        description: 'El valor a guardar',
        required: true,
    })
    value!: string;

    async run() {
        const embed = this.getEmbed('info')
            .setTitle('Configuración establecida')
            .setDescription(
                `Se ha establecido la configuración del servidor \`${this.key}\` = \`${this.value}\``,
            );

        await this.send({ embeds: [embed] });
    }
}
