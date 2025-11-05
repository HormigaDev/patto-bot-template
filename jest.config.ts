import type { Config } from 'jest';

const config: Config = {
    // Usar ts-jest para transformar archivos TypeScript
    preset: 'ts-jest',

    // Entorno de ejecución
    testEnvironment: 'node',

    // Directorio raíz para tests
    roots: ['<rootDir>/tests', '<rootDir>/src'],

    // Patrones de archivos de test
    testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],

    // Transformar archivos TypeScript
    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.test.json',
            },
        ],
    },

    // Mapeo de módulos (equivalente a tsconfig paths)
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@tests/(.*)$': '<rootDir>/tests/$1',
    },

    // Archivos de setup
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

    // Cobertura de código
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/index.ts',
        '!src/**/*.spec.ts',
        '!src/**/*.test.ts',
    ],

    // Directorio de reportes de cobertura
    coverageDirectory: 'coverage',

    // Reportes de cobertura
    coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

    // Umbrales de cobertura (opcional, descomenta si quieres forzar cobertura mínima)
    // coverageThreshold: {
    //     global: {
    //         branches: 70,
    //         functions: 70,
    //         lines: 70,
    //         statements: 70,
    //     },
    // },

    // Extensiones de archivo
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

    // Verbose output
    verbose: true,

    // Tiempo máximo de ejecución por test (30 segundos)
    testTimeout: 30000,

    // Ignorar node_modules y dist
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],

    // Limpiar mocks entre tests
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,

    // Detectar memoria leaks
    detectOpenHandles: true,

    // Máximo de workers en paralelo
    maxWorkers: '50%',
};

export default config;
