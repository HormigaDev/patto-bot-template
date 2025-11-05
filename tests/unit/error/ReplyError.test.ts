/**
 * Ejemplo de test unitario para ReplyError
 */

import { ReplyError } from '@/error/ReplyError';

describe('ReplyError', () => {
    describe('constructor', () => {
        it('should create error with message', () => {
            const error = new ReplyError('Permission denied');

            expect(error).toBeInstanceOf(ReplyError);
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Permission denied');
            expect(error.name).toBe('ReplyError');
        });

        it('should preserve stack trace', () => {
            const error = new ReplyError('Test error');

            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('ReplyError');
        });
    });

    describe('error type detection', () => {
        it('should be caught as ReplyError', () => {
            try {
                throw new ReplyError('Test reply error');
            } catch (error) {
                expect(error instanceof ReplyError).toBe(true);
                expect(error instanceof Error).toBe(true);
            }
        });

        it('should be distinguishable from ValidationError', () => {
            const replyError = new ReplyError('Reply error');
            const regularError = new Error('Regular error');

            expect(replyError instanceof ReplyError).toBe(true);
            expect(regularError instanceof ReplyError).toBe(false);
        });
    });

    describe('use cases', () => {
        it('should be used for expected errors', () => {
            const checkPermission = (hasPermission: boolean) => {
                if (!hasPermission) {
                    throw new ReplyError('You do not have permission to use this command');
                }
            };

            expect(() => checkPermission(false)).toThrow(ReplyError);
            expect(() => checkPermission(true)).not.toThrow();
        });

        it('should contain user-friendly messages', () => {
            const messages = [
                'You need to be in a voice channel',
                'This command is only available in servers',
                'Cooldown active. Please wait before using this command again',
            ];

            messages.forEach((message) => {
                const error = new ReplyError(message);
                expect(error.message).toBe(message);
            });
        });
    });
});
