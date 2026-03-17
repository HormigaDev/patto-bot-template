import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { Category } from '@/utils/CommandCategories';

@Command({
    name: 'help',
    description: 'Muestra la ayuda de los comandos disponibles',
    aliases: ['ayuda'],
    category: Category.Info,
})
export abstract class HelpDefinition extends BaseCommand {
    @Arg({
        name: 'comando',
        description: 'El nombre del comando para obtener ayuda',
        rawText: true,
    })
    commandName!: string;
}
