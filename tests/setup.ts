/**
 * Setup global para todos los tests
 * Este archivo se ejecuta una vez antes de todos los tests
 */

// Importar reflect-metadata para decoradores
import 'reflect-metadata';

// Configurar variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.DISCORD_TOKEN = 'test-token';
process.env.CLIENT_ID = 'test-client-id';

// Configurar timeouts globales
jest.setTimeout(30000);

// Mock global de console para evitar spam en tests (opcional)
// Descomenta si quieres silenciar logs durante tests
// global.console = {
//     ...console,
//     log: jest.fn(),
//     debug: jest.fn(),
//     info: jest.fn(),
//     warn: jest.fn(),
//     error: jest.fn(),
// };

// Setup global antes de todos los tests
beforeAll(() => {
    // Código que se ejecuta una vez antes de todos los tests
});

// Cleanup global después de todos los tests
afterAll(() => {
    // Código que se ejecuta una vez después de todos los tests
});

// Setup antes de cada test
beforeEach(() => {
    // Código que se ejecuta antes de cada test
});

// Cleanup después de cada test
afterEach(() => {
    // Limpiar todos los mocks
    jest.clearAllMocks();
});
