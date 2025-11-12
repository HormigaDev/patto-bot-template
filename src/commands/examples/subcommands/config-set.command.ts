import { Arg } from '@/core/decorators/argument.decorator';
import { Subcommand } from '@/core/decorators/subcommand.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@Subcommand({
    parent: 'config',
    name: 'set',
    description: 'Establece una configuración',
})
export class ConfigCommand extends BaseCommand {
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
                `Se ha establecido la configuración \`${this.key}\` = \`${this.value}\``,
            );

        await this.send({ embeds: [embed] });
    }
}
