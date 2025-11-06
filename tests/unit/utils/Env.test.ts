/**
 * Test unitario para utilidad Env
 */

import { Env } from '@/utils/Env';

describe('Utilidad Env', () => {
    // Guardar env original
    const originalEnv = process.env;

    // Mocks de console
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
        // Reset del singleton antes de cada test
        (Env as any).config = null;

        // Limpiar variables de entorno
        process.env = { ...originalEnv };

        // Silenciar console logs en tests
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
        // Restaurar console
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    afterAll(() => {
        // Restaurar env original
        process.env = originalEnv;
    });

    describe('load() - validación de variables obligatorias', () => {
        it('debería cargar la configuración exitosamente con todas las variables requeridas', () => {
            process.env.BOT_TOKEN = 'test-token-123';
            process.env.CLIENT_ID = '123456789';

            const config = Env.load();

            expect(config.BOT_TOKEN).toBe('test-token-123');
            expect(config.CLIENT_ID).toBe('123456789');
            expect(config.USE_MESSAGE_CONTENT).toBe(false); // default
            expect(config.COMMAND_PREFIX).toBe('!'); // default
            expect(config.INTENTS).toBeUndefined(); // default
        });

        it('debería lanzar error si BOT_TOKEN no está presente', () => {
            process.env.CLIENT_ID = '123456789';
            delete process.env.BOT_TOKEN;

            // Mock process.exit para evitar que termine el test
            const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('process.exit called');
            });

            expect(() => Env.load()).toThrow();
            expect(exitSpy).toHaveBeenCalledWith(1);

            exitSpy.mockRestore();
        });

        it('debería lanzar error si CLIENT_ID no está presente', () => {
            process.env.BOT_TOKEN = 'test-token';
            delete process.env.CLIENT_ID;

            const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('process.exit called');
            });

            expect(() => Env.load()).toThrow();
            expect(exitSpy).toHaveBeenCalledWith(1);

            exitSpy.mockRestore();
        });

        it('debería lanzar error si BOT_TOKEN es una cadena vacía', () => {
            process.env.BOT_TOKEN = '   ';
            process.env.CLIENT_ID = '123456789';

            const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('process.exit called');
            });

            expect(() => Env.load()).toThrow();
            expect(exitSpy).toHaveBeenCalledWith(1);

            exitSpy.mockRestore();
        });
    });

    describe('load() - parsing de variables opcionales', () => {
        beforeEach(() => {
            process.env.BOT_TOKEN = 'test-token';
            process.env.CLIENT_ID = '123456789';
        });

        it('debería parsear USE_MESSAGE_CONTENT como true cuando se establece en "true"', () => {
            process.env.USE_MESSAGE_CONTENT = 'true';
            const config = Env.load();
            expect(config.USE_MESSAGE_CONTENT).toBe(true);
        });

        it('debería parsear USE_MESSAGE_CONTENT como true (sin distinguir mayúsculas)', () => {
            process.env.USE_MESSAGE_CONTENT = 'TRUE';
            const config = Env.load();
            expect(config.USE_MESSAGE_CONTENT).toBe(true);
        });

        it('debería parsear USE_MESSAGE_CONTENT como false para cualquier otro valor', () => {
            process.env.USE_MESSAGE_CONTENT = 'yes';
            const config = Env.load();
            expect(config.USE_MESSAGE_CONTENT).toBe(false);
        });

        it('debería parsear USE_MESSAGE_CONTENT como false cuando está vacío', () => {
            delete process.env.USE_MESSAGE_CONTENT;
            const config = Env.load();
            expect(config.USE_MESSAGE_CONTENT).toBe(false);
        });

        it('debería usar COMMAND_PREFIX personalizado', () => {
            process.env.COMMAND_PREFIX = '>';
            const config = Env.load();
            expect(config.COMMAND_PREFIX).toBe('>');
        });

        it('debería usar COMMAND_PREFIX por defecto cuando no está establecido', () => {
            delete process.env.COMMAND_PREFIX;
            const config = Env.load();
            expect(config.COMMAND_PREFIX).toBe('!');
        });

        it('debería lanzar error si COMMAND_PREFIX está vacío', () => {
            process.env.COMMAND_PREFIX = '   ';

            const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('process.exit called');
            });

            expect(() => Env.load()).toThrow();
            expect(exitSpy).toHaveBeenCalledWith(1);

            exitSpy.mockRestore();
        });

        it('debería parsear INTENTS como número', () => {
            process.env.INTENTS = '3276799';
            const config = Env.load();
            expect(config.INTENTS).toBe(3276799);
        });

        it('debería retornar undefined para INTENTS inválido', () => {
            process.env.INTENTS = 'invalid';
            const config = Env.load();
            expect(config.INTENTS).toBeUndefined();
        });

        it('debería eliminar espacios en blanco de todos los valores', () => {
            process.env.BOT_TOKEN = '  test-token  ';
            process.env.CLIENT_ID = '  123456789  ';
            process.env.COMMAND_PREFIX = '  >  ';

            const config = Env.load();

            expect(config.BOT_TOKEN).toBe('test-token');
            expect(config.CLIENT_ID).toBe('123456789');
            expect(config.COMMAND_PREFIX).toBe('>');
        });
    });

    describe('get() - obtener configuración', () => {
        it('debería retornar la configuración cargada', () => {
            process.env.BOT_TOKEN = 'test-token';
            process.env.CLIENT_ID = '123456789';

            Env.load();
            const config = Env.get();

            expect(config.BOT_TOKEN).toBe('test-token');
            expect(config.CLIENT_ID).toBe('123456789');
        });

        it('debería lanzar error si la configuración no está cargada', () => {
            expect(() => Env.get()).toThrow(
                '❌ Configuración no cargada. Llama a Env.load() antes de usar Env.get()',
            );
        });

        it('debería retornar la misma instancia en múltiples llamadas a get()', () => {
            process.env.BOT_TOKEN = 'test-token';
            process.env.CLIENT_ID = '123456789';

            Env.load();
            const config1 = Env.get();
            const config2 = Env.get();

            expect(config1).toBe(config2);
        });
    });

    describe('comportamiento singleton', () => {
        it('debería cargar la configuración solo una vez', () => {
            process.env.BOT_TOKEN = 'test-token';
            process.env.CLIENT_ID = '123456789';

            const config1 = Env.load();
            const config2 = Env.load();

            expect(config1).toBe(config2);
        });
    });
});
