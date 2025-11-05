/**
 * Ejemplo de test unitario para ValidationError
 */

import { ValidationError } from '@/error/ValidationError';

describe('ValidationError', () => {
    describe('constructor', () => {
        it('should create error with message', () => {
            const error = new ValidationError('Invalid input');

            expect(error).toBeInstanceOf(ValidationError);
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Invalid input');
            expect(error.name).toBe('ValidationError');
        });

        it('should preserve stack trace', () => {
            const error = new ValidationError('Test error');

            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('ValidationError');
        });
    });

    describe('error type detection', () => {
        it('should be caught as ValidationError', () => {
            try {
                throw new ValidationError('Test validation error');
            } catch (error) {
                expect(error instanceof ValidationError).toBe(true);
                expect(error instanceof Error).toBe(true);
            }
        });

        it('should be distinguishable from regular Error', () => {
            const validationError = new ValidationError('Validation failed');
            const regularError = new Error('Regular error');

            expect(validationError instanceof ValidationError).toBe(true);
            expect(regularError instanceof ValidationError).toBe(false);
        });
    });

    describe('use cases', () => {
        it('should be used for argument validation', () => {
            const validateAge = (age: number) => {
                if (age < 0) {
                    throw new ValidationError('Age cannot be negative');
                }
                if (age > 150) {
                    throw new ValidationError('Age is too high');
                }
            };

            expect(() => validateAge(-1)).toThrow(ValidationError);
            expect(() => validateAge(200)).toThrow(ValidationError);
            expect(() => validateAge(25)).not.toThrow();
        });

        it('should contain meaningful error messages', () => {
            const messages = [
                'Username is required',
                'Invalid email format',
                'Password must be at least 8 characters',
            ];

            messages.forEach((message) => {
                const error = new ValidationError(message);
                expect(error.message).toBe(message);
            });
        });
    });
});
