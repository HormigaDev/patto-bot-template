import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';

@Command({
    name: 'test',
    description: 'Prueba',
    subcommands: ['alpha first', 'alpha second', 'beta first', 'beta second'],
})
export abstract class TestDefinition extends BaseCommand {
    @Arg({
        name: 'option',
        description: 'Opción de prueba',
        index: 0,
        required: true,
        subcommands: ['alpha first', 'alpha second', 'beta first', 'beta second'],
    })
    option!: string;

    async run(): Promise<void> {}

    abstract subcommandAlphaFirst(): Promise<void>;
    abstract subcommandAlphaSecond(): Promise<void>;
    abstract subcommandBetaFirst(): Promise<void>;
    abstract subcommandBetaSecond(): Promise<void>;
}
