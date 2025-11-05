export function getPrefix(): string {
    return process.env.COMMAND_PREFIX || '!';
}
