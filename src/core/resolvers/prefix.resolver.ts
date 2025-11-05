import { Env } from '@/utils/Env';

export function getPrefix(): string {
    return Env.get().COMMAND_PREFIX;
}
