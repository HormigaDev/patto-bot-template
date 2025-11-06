/**
 * Ejemplo de test unitario para ReplyError
 */

import { ReplyError } from '@/error/ReplyError';

describe('ReplyError', () => {
    describe('constructor', () => {
        it('debería crear un error con mensaje', () => {
            const error = new ReplyError('Permiso denegado');

            expect(error).toBeInstanceOf(ReplyError);
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Permiso denegado');
            expect(error.name).toBe('ReplyError');
        });

        it('debería preservar la traza de pila', () => {
            const error = new ReplyError('Error de prueba');

            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('ReplyError');
        });
    });

    describe('detección de tipo de error', () => {
        it('debería ser capturado como ReplyError', () => {
            try {
                throw new ReplyError('Error de respuesta de prueba');
            } catch (error) {
                expect(error instanceof ReplyError).toBe(true);
                expect(error instanceof Error).toBe(true);
            }
        });

        it('debería ser distinguible de ValidationError', () => {
            const replyError = new ReplyError('Error de respuesta');
            const regularError = new Error('Error regular');

            expect(replyError instanceof ReplyError).toBe(true);
            expect(regularError instanceof ReplyError).toBe(false);
        });
    });

    describe('casos de uso', () => {
        it('debería usarse para errores esperados', () => {
            const verificarPermiso = (tienePermiso: boolean) => {
                if (!tienePermiso) {
                    throw new ReplyError('No tienes permiso para usar este comando');
                }
            };

            expect(() => verificarPermiso(false)).toThrow(ReplyError);
            expect(() => verificarPermiso(true)).not.toThrow();
        });

        it('debería contener mensajes amigables para el usuario', () => {
            const mensajes = [
                'Necesitas estar en un canal de voz',
                'Este comando solo está disponible en servidores',
                'Cooldown activo. Por favor espera antes de usar este comando nuevamente',
            ];

            mensajes.forEach((mensaje) => {
                const error = new ReplyError(mensaje);
                expect(error.message).toBe(mensaje);
            });
        });
    });
});
