import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { CommandCategoryTag } from '@/utils/CommandCategories';

@Command({
    name: 'help',
    description: 'Muestra la ayuda de los comandos disponibles',
    aliases: ['ayuda'],
    category: CommandCategoryTag.Info,
})
export abstract class HelpDefinition extends BaseCommand {
    @Arg({
        name: 'comando',
        description: 'El nombre del comando para obtener ayuda (puede incluir subcomandos)',
        index: 0,
        rawText: true, // Captura todo el texto, permitiendo espacios
    })
    commandName?: string;
}
