import { Arg } from '@/core/decorators/argument.decorator';
import { SubcommandGroup } from '@/core/decorators/subcommand-group.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@SubcommandGroup({
    parent: 'server',
    name: 'config',
    subcommand: 'get',
    description: 'Obtiene la configuración del servidor',
})
export class ServerConfigGetCommand extends BaseCommand {
    @Arg({
        name: 'clave',
        description: 'La clave de la configuración a buscar',
        required: true,
    })
    key!: string;

    async run() {
        const embed = this.getEmbed('info')
            .setTitle('Configuración')
            .setDescription(
                `El valor de la configuración del servidor \`${this.key}\` es \`Dato genérico\``,
            );

        await this.send({ embeds: [embed] });
    }
}
