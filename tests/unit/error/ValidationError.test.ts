/**
 * Ejemplo de test unitario para ValidationError
 */

import { ValidationError } from '@/error/ValidationError';

describe('ValidationError', () => {
    describe('constructor', () => {
        it('debería crear un error con mensaje', () => {
            const error = new ValidationError('Entrada inválida');

            expect(error).toBeInstanceOf(ValidationError);
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Entrada inválida');
            expect(error.name).toBe('ValidationError');
        });

        it('debería preservar la traza de pila', () => {
            const error = new ValidationError('Error de prueba');

            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('ValidationError');
        });
    });

    describe('detección de tipo de error', () => {
        it('debería ser capturado como ValidationError', () => {
            try {
                throw new ValidationError('Error de validación de prueba');
            } catch (error) {
                expect(error instanceof ValidationError).toBe(true);
                expect(error instanceof Error).toBe(true);
            }
        });

        it('debería ser distinguible de Error regular', () => {
            const validationError = new ValidationError('Validación fallida');
            const regularError = new Error('Error regular');

            expect(validationError instanceof ValidationError).toBe(true);
            expect(regularError instanceof ValidationError).toBe(false);
        });
    });

    describe('casos de uso', () => {
        it('debería usarse para validación de argumentos', () => {
            const validarEdad = (edad: number) => {
                if (edad < 0) {
                    throw new ValidationError('La edad no puede ser negativa');
                }
                if (edad > 150) {
                    throw new ValidationError('La edad es demasiado alta');
                }
            };

            expect(() => validarEdad(-1)).toThrow(ValidationError);
            expect(() => validarEdad(200)).toThrow(ValidationError);
            expect(() => validarEdad(25)).not.toThrow();
        });

        it('debería contener mensajes de error significativos', () => {
            const mensajes = [
                'El nombre de usuario es requerido',
                'Formato de correo inválido',
                'La contraseña debe tener al menos 8 caracteres',
            ];

            mensajes.forEach((mensaje) => {
                const error = new ValidationError(mensaje);
                expect(error.message).toBe(mensaje);
            });
        });
    });
});
