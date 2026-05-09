/**
 * Test unitario para utilidad Env
 */

import { Env } from '@/utils/Env';
import { Logger, LogLevel } from '@/utils/Logger';

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

    describe('load() - SHARDING_ENABLED y REDIS_URL', () => {
        let stdoutSpy: jest.SpyInstance;
        let stderrSpy: jest.SpyInstance;
        let exitSpy: jest.SpyInstance;
        let savedLogLevel: LogLevel;

        beforeEach(() => {
            process.env.BOT_TOKEN = 'test-token';
            process.env.CLIENT_ID = '123456789';
            stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
            stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
            exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('process.exit called');
            });
            savedLogLevel = Logger.getLevel();
        });

        afterEach(() => {
            stdoutSpy.mockRestore();
            stderrSpy.mockRestore();
            exitSpy.mockRestore();
            Logger.setLevel(savedLogLevel);
        });

        it('debería cargar correctamente cuando SHARDING_ENABLED es false sin REDIS_URL', () => {
            process.env.SHARDING_ENABLED = 'false';
            delete process.env.REDIS_URL;

            const config = Env.load();

            expect(config.SHARDING_ENABLED).toBe(false);
            expect(config.REDIS_URL).toBeUndefined();
        });

        it('debería cargar correctamente cuando SHARDING_ENABLED no está definido', () => {
            delete process.env.SHARDING_ENABLED;
            delete process.env.REDIS_URL;

            const config = Env.load();

            expect(config.SHARDING_ENABLED).toBe(false);
        });

        it('debería lanzar error cuando SHARDING_ENABLED=true y REDIS_URL está ausente', () => {
            process.env.SHARDING_ENABLED = 'true';
            delete process.env.REDIS_URL;

            expect(() => Env.load()).toThrow();
            expect(exitSpy).toHaveBeenCalledWith(1);
        });

        it('debería lanzar error cuando SHARDING_ENABLED=true y REDIS_URL está vacía', () => {
            process.env.SHARDING_ENABLED = 'true';
            process.env.REDIS_URL = '   ';

            expect(() => Env.load()).toThrow();
            expect(exitSpy).toHaveBeenCalledWith(1);
        });

        it('debería cargar correctamente con REDIS_URL de esquema redis://', () => {
            process.env.SHARDING_ENABLED = 'true';
            process.env.REDIS_URL = 'redis://localhost:6379';

            const config = Env.load();

            expect(config.SHARDING_ENABLED).toBe(true);
            expect(config.REDIS_URL).toBe('redis://localhost:6379');
        });

        it('debería cargar correctamente con REDIS_URL de esquema rediss://', () => {
            process.env.SHARDING_ENABLED = 'true';
            process.env.REDIS_URL = 'rediss://localhost:6380';

            const config = Env.load();

            expect(config.SHARDING_ENABLED).toBe(true);
            expect(config.REDIS_URL).toBe('rediss://localhost:6380');
        });

        it('debería lanzar error cuando REDIS_URL tiene esquema inválido (http://)', () => {
            process.env.SHARDING_ENABLED = 'true';
            process.env.REDIS_URL = 'http://localhost:6379';

            expect(() => Env.load()).toThrow();
            expect(exitSpy).toHaveBeenCalledWith(1);
        });

        it('debería lanzar error cuando REDIS_URL tiene esquema inválido (postgres://)', () => {
            process.env.SHARDING_ENABLED = 'true';
            process.env.REDIS_URL = 'postgres://localhost:5432/db';

            expect(() => Env.load()).toThrow();
            expect(exitSpy).toHaveBeenCalledWith(1);
        });

        it('no debería validar REDIS_URL cuando SHARDING_ENABLED=false aunque la URL sea inválida', () => {
            process.env.SHARDING_ENABLED = 'false';
            process.env.REDIS_URL = 'not-a-valid-url';

            const config = Env.load();

            expect(config.SHARDING_ENABLED).toBe(false);
            expect(exitSpy).not.toHaveBeenCalled();
        });
    });

    describe('load() - parseo de TOTAL_SHARDS', () => {
        let stdoutSpy: jest.SpyInstance;
        let stderrSpy: jest.SpyInstance;
        let savedLogLevel: LogLevel;

        beforeEach(() => {
            process.env.BOT_TOKEN = 'test-token';
            process.env.CLIENT_ID = '123456789';
            stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
            stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
            savedLogLevel = Logger.getLevel();
        });

        afterEach(() => {
            stdoutSpy.mockRestore();
            stderrSpy.mockRestore();
            Logger.setLevel(savedLogLevel);
        });

        it('debería devolver "auto" cuando TOTAL_SHARDS no está definido', () => {
            delete process.env.TOTAL_SHARDS;

            const config = Env.load();

            expect(config.TOTAL_SHARDS).toBe('auto');
        });

        it('debería devolver "auto" cuando TOTAL_SHARDS es "auto"', () => {
            process.env.TOTAL_SHARDS = 'auto';

            const config = Env.load();

            expect(config.TOTAL_SHARDS).toBe('auto');
        });

        it('debería devolver "auto" cuando TOTAL_SHARDS es "AUTO" (case insensitive)', () => {
            process.env.TOTAL_SHARDS = 'AUTO';

            const config = Env.load();

            expect(config.TOTAL_SHARDS).toBe('auto');
        });

        it('debería parsear correctamente un número entero positivo', () => {
            process.env.TOTAL_SHARDS = '4';

            const config = Env.load();

            expect(config.TOTAL_SHARDS).toBe(4);
        });

        it('debería parsear correctamente TOTAL_SHARDS=1', () => {
            process.env.TOTAL_SHARDS = '1';

            const config = Env.load();

            expect(config.TOTAL_SHARDS).toBe(1);
        });

        it('debería devolver "auto" cuando TOTAL_SHARDS es 0 (no válido)', () => {
            process.env.TOTAL_SHARDS = '0';

            const config = Env.load();

            expect(config.TOTAL_SHARDS).toBe('auto');
        });

        it('debería devolver "auto" cuando TOTAL_SHARDS es negativo', () => {
            process.env.TOTAL_SHARDS = '-2';

            const config = Env.load();

            expect(config.TOTAL_SHARDS).toBe('auto');
        });

        it('debería devolver "auto" cuando TOTAL_SHARDS es un string no numérico', () => {
            process.env.TOTAL_SHARDS = 'many';

            const config = Env.load();

            expect(config.TOTAL_SHARDS).toBe('auto');
        });

        it('debería devolver "auto" cuando TOTAL_SHARDS es un decimal', () => {
            process.env.TOTAL_SHARDS = '2.5';

            const config = Env.load();

            expect(config.TOTAL_SHARDS).toBe('auto');
        });
    });

    describe('load() - parseo de LOG_LEVEL', () => {
        let stdoutSpy: jest.SpyInstance;
        let stderrSpy: jest.SpyInstance;
        let savedLogLevel: LogLevel;

        beforeEach(() => {
            process.env.BOT_TOKEN = 'test-token';
            process.env.CLIENT_ID = '123456789';
            stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
            stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
            savedLogLevel = Logger.getLevel();
        });

        afterEach(() => {
            stdoutSpy.mockRestore();
            stderrSpy.mockRestore();
            Logger.setLevel(savedLogLevel);
        });

        it('debería parsear LOG_LEVEL=INFO correctamente', () => {
            process.env.LOG_LEVEL = 'INFO';

            const config = Env.load();

            expect(config.LOG_LEVEL).toBe(LogLevel.INFO);
        });

        it('debería parsear LOG_LEVEL=DEBUG correctamente', () => {
            process.env.LOG_LEVEL = 'DEBUG';

            const config = Env.load();

            expect(config.LOG_LEVEL).toBe(LogLevel.DEBUG);
        });

        it('debería parsear LOG_LEVEL=WARN correctamente', () => {
            process.env.LOG_LEVEL = 'WARN';

            const config = Env.load();

            expect(config.LOG_LEVEL).toBe(LogLevel.WARN);
        });

        it('debería parsear LOG_LEVEL=ERROR correctamente', () => {
            process.env.LOG_LEVEL = 'ERROR';

            const config = Env.load();

            expect(config.LOG_LEVEL).toBe(LogLevel.ERROR);
        });

        it('debería parsear LOG_LEVEL=FATAL correctamente', () => {
            process.env.LOG_LEVEL = 'FATAL';

            const config = Env.load();

            expect(config.LOG_LEVEL).toBe(LogLevel.FATAL);
        });

        it('debería parsear LOG_LEVEL=SILENT correctamente', () => {
            process.env.LOG_LEVEL = 'SILENT';

            const config = Env.load();

            expect(config.LOG_LEVEL).toBe(LogLevel.SILENT);
        });

        it('debería parsear LOG_LEVEL en minúsculas (case insensitive)', () => {
            process.env.LOG_LEVEL = 'warn';

            const config = Env.load();

            expect(config.LOG_LEVEL).toBe(LogLevel.WARN);
        });

        it('debería usar el nivel por defecto del Logger cuando LOG_LEVEL no está definido', () => {
            delete process.env.LOG_LEVEL;
            const expectedLevel = Logger.getLevel();

            const config = Env.load();

            expect(config.LOG_LEVEL).toBe(expectedLevel);
        });

        it('debería usar el nivel por defecto cuando LOG_LEVEL es inválido', () => {
            process.env.LOG_LEVEL = 'VERBOSE';
            const expectedLevel = Logger.getLevel();

            const config = Env.load();

            expect(config.LOG_LEVEL).toBe(expectedLevel);
        });

        it('debería aplicar el nivel al singleton Logger tras cargar', () => {
            process.env.LOG_LEVEL = 'SILENT';

            Env.load();

            expect(Logger.getLevel()).toBe(LogLevel.SILENT);
        });
    });
});
