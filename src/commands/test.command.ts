import { TestDefinition } from '@/definition/test.definition';
import { ReplyError } from '@/error/ReplyError';

export class TestCommand extends TestDefinition {
    subcommandAlphaFirst(): Promise<void> {
        throw new ReplyError('Method not implemented. 1 ' + this.option);
    }

    subcommandAlphaSecond(): Promise<void> {
        throw new ReplyError('Method not implemented. 2 ' + this.option);
    }

    subcommandBetaFirst(): Promise<void> {
        throw new ReplyError('Method not implemented. 3 ' + this.option);
    }

    subcommandBetaSecond(): Promise<void> {
        throw new ReplyError('Method not implemented. 4 ' + this.option);
    }
}
