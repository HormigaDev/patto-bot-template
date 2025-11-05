export class ReplyError extends Error {
    constructor(message: any) {
        super(message);
        this.name = 'ReplyError';
    }
}
