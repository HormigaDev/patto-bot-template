/**
 * Test unitario para Env utility
 */

import { Env } from '@/utils/Env';

describe('Env Utility', () => {
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
        it('should load config successfully with all required vars', () => {
            process.env.BOT_TOKEN = 'test-token-123';
            process.env.CLIENT_ID = '123456789';

            const config = Env.load();

            expect(config.BOT_TOKEN).toBe('test-token-123');
            expect(config.CLIENT_ID).toBe('123456789');
            expect(config.USE_MESSAGE_CONTENT).toBe(false); // default
            expect(config.COMMAND_PREFIX).toBe('!'); // default
            expect(config.INTENTS).toBeUndefined(); // default
        });

        it('should throw error if BOT_TOKEN is missing', () => {
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

        it('should throw error if CLIENT_ID is missing', () => {
            process.env.BOT_TOKEN = 'test-token';
            delete process.env.CLIENT_ID;

            const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('process.exit called');
            });

            expect(() => Env.load()).toThrow();
            expect(exitSpy).toHaveBeenCalledWith(1);

            exitSpy.mockRestore();
        });

        it('should throw error if BOT_TOKEN is empty string', () => {
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

        it('should parse USE_MESSAGE_CONTENT as true when set to "true"', () => {
            process.env.USE_MESSAGE_CONTENT = 'true';
            const config = Env.load();
            expect(config.USE_MESSAGE_CONTENT).toBe(true);
        });

        it('should parse USE_MESSAGE_CONTENT as true (case insensitive)', () => {
            process.env.USE_MESSAGE_CONTENT = 'TRUE';
            const config = Env.load();
            expect(config.USE_MESSAGE_CONTENT).toBe(true);
        });

        it('should parse USE_MESSAGE_CONTENT as false for any other value', () => {
            process.env.USE_MESSAGE_CONTENT = 'yes';
            const config = Env.load();
            expect(config.USE_MESSAGE_CONTENT).toBe(false);
        });

        it('should parse USE_MESSAGE_CONTENT as false when empty', () => {
            delete process.env.USE_MESSAGE_CONTENT;
            const config = Env.load();
            expect(config.USE_MESSAGE_CONTENT).toBe(false);
        });

        it('should use custom COMMAND_PREFIX', () => {
            process.env.COMMAND_PREFIX = '>';
            const config = Env.load();
            expect(config.COMMAND_PREFIX).toBe('>');
        });

        it('should use default COMMAND_PREFIX when not set', () => {
            delete process.env.COMMAND_PREFIX;
            const config = Env.load();
            expect(config.COMMAND_PREFIX).toBe('!');
        });

        it('should throw error if COMMAND_PREFIX is empty', () => {
            process.env.COMMAND_PREFIX = '   ';

            const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('process.exit called');
            });

            expect(() => Env.load()).toThrow();
            expect(exitSpy).toHaveBeenCalledWith(1);

            exitSpy.mockRestore();
        });

        it('should parse INTENTS as number', () => {
            process.env.INTENTS = '3276799';
            const config = Env.load();
            expect(config.INTENTS).toBe(3276799);
        });

        it('should return undefined for invalid INTENTS', () => {
            process.env.INTENTS = 'invalid';
            const config = Env.load();
            expect(config.INTENTS).toBeUndefined();
        });

        it('should trim whitespace from all values', () => {
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
        it('should return loaded config', () => {
            process.env.BOT_TOKEN = 'test-token';
            process.env.CLIENT_ID = '123456789';

            Env.load();
            const config = Env.get();

            expect(config.BOT_TOKEN).toBe('test-token');
            expect(config.CLIENT_ID).toBe('123456789');
        });

        it('should throw error if config not loaded', () => {
            expect(() => Env.get()).toThrow(
                '❌ Configuración no cargada. Llama a Env.load() antes de usar Env.get()',
            );
        });

        it('should return same instance on multiple get() calls', () => {
            process.env.BOT_TOKEN = 'test-token';
            process.env.CLIENT_ID = '123456789';

            Env.load();
            const config1 = Env.get();
            const config2 = Env.get();

            expect(config1).toBe(config2);
        });
    });

    describe('singleton behavior', () => {
        it('should load config only once', () => {
            process.env.BOT_TOKEN = 'test-token';
            process.env.CLIENT_ID = '123456789';

            const config1 = Env.load();
            const config2 = Env.load();

            expect(config1).toBe(config2);
        });
    });
});
