import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { CommandCategoryTag } from '@/utils/CommandCategories';

/**
 * Comando de ejemplo con subcomandos
 * Implementación unificada en un solo archivo
 */
@Command({
    name: 'config',
    description: 'Gestiona la configuración del bot',
    category: CommandCategoryTag.Other,
    subcommands: ['get', 'set', 'list'],
})
export abstract class ConfigDefinition extends BaseCommand {
    @Arg({
        name: 'clave',
        description: 'La clave de configuración',
        index: 0,
        required: true,
        subcommands: ['get', 'set'], // Solo se usa en 'get' y 'set', no en 'list'
    })
    key!: string;

    @Arg({
        name: 'valor',
        description: 'El valor a establecer',
        index: 1,
        required: true, // En set es obligatorio tener un valor
        subcommands: ['set'], // Solo se usa en 'set'
    })
    value?: string;

    // run() no se ejecuta cuando hay subcomandos, pero debe existir
    async run(): Promise<void> {
        // Este método no se ejecuta cuando el comando tiene subcomandos
        // Los subcomandos manejan toda la lógica
    }

    // Métodos abstractos para cada subcomando
    abstract subcommandGet(): Promise<void>;
    abstract subcommandSet(): Promise<void>;
    abstract subcommandList(): Promise<void>;
}
