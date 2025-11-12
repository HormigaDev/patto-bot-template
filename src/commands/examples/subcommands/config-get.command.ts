import { Arg } from '@/core/decorators/argument.decorator';
import { Subcommand } from '@/core/decorators/subcommand.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@Subcommand({
    parent: 'config',
    name: 'get',
    description: 'Obtiene un valor de configuración',
})
export class ConfigGetCommand extends BaseCommand {
    @Arg({
        name: 'clave',
        description: 'La clave del valor a buscar',
    })
    key!: string;

    async run() {
        const embed = this.getEmbed('info')
            .setTitle('Configuración')
            .setDescription(`El valor de la configuración \`${this.key}\` es \`Dato genérico\``);

        await this.send({ embeds: [embed] });
    }
}
