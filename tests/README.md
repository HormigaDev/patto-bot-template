# 🧪 Testing

## 📖 Descripción

Sistema de testing completo para el bot de Discord. Incluye tests unitarios, de integración y end-to-end (e2e).

## 🏗️ Estructura

```
tests/
├── unit/                  # Tests unitarios (funciones individuales)
│   ├── utils/            # Tests de utilidades
│   ├── error/            # Tests de errores personalizados
│   ├── core/             # Tests de componentes core
│   └── plugins/          # Tests de plugins (ej: permissions.plugin.test.ts)
├── integration/           # Tests de integración (múltiples componentes)
│   ├── core/             # Tests de integración del core
│   └── plugins/          # Tests de flujo completo de plugins
├── e2e/                  # Tests end-to-end (flujo completo del bot)
├── mocks/                # Mocks reutilizables (Discord.js, etc)
├── fixtures/             # Datos de prueba predefinidos
├── setup.ts              # Configuración global de tests
└── README.md             # Este archivo
```

## 🎯 Tests Incluidos

El template incluye tests completos para componentes críticos:

### ✅ PermissionsPlugin (20 tests)

-   **Ubicación**:

    -   `tests/unit/plugins/permissions.plugin.test.ts` (13 tests)
    -   `tests/integration/plugins/permissions.plugin.test.ts` (7 tests)

-   **Cobertura**:

    -   ✅ Fase de registro (onBeforeRegisterCommand)
    -   ✅ Fase de ejecución (onBeforeExecute)
    -   ✅ Inmutabilidad del commandJson
    -   ✅ Combinación de permisos múltiples (bitwise OR)
    -   ✅ Validación con/sin permisos
    -   ✅ Integración con decorador @RequirePermissions
    -   ✅ Flujos completos de registro → ejecución
    -   ✅ Escenarios del mundo real (moderación)

-   **Ejecutar**:
    ```bash
    npm test -- permissions.plugin.test.ts
    ```

## 🚀 Comandos Disponibles

### Ejecutar Todos los Tests

```bash
npm test
```

### Ejecutar Tests en Modo Watch

```bash
npm run test:watch
```

Ejecuta tests automáticamente cuando detecta cambios en archivos.

### Ejecutar Tests con Cobertura

```bash
npm run test:coverage
```

Genera reporte de cobertura en `/coverage`.

### Ejecutar Tests por Categoría

```bash
# Solo tests unitarios
npm run test:unit

# Solo tests de integración
npm run test:integration

# Solo tests e2e
npm run test:e2e
```

### Ejecutar Tests Específicos

```bash
# Por nombre de archivo
npm test Times.test

# Por patrón
npm test -- --testNamePattern="should convert"

# Por path
npm test tests/unit/utils/
```

## 📚 Tipos de Tests

### 🔵 Unit Tests (`/tests/unit/`)

**Objetivo:** Probar funciones/clases individuales en aislamiento.

**Características:**

-   ✅ Rápidos (< 100ms por test)
-   ✅ Sin dependencias externas
-   ✅ Sin llamadas a APIs o base de datos
-   ✅ Usan mocks para dependencias

**Ejemplos:**

-   Utilidades (`Times`, `CommandCategories`)
-   Errores personalizados (`ValidationError`, `ReplyError`)
-   Funciones puras y helpers

**Estructura de ejemplo:**

```typescript
// tests/unit/utils/Times.test.ts
describe('Times Utility', () => {
    describe('seconds', () => {
        it('should convert seconds to milliseconds', () => {
            expect(Times.seconds(5)).toBe(5000);
        });
    });
});
```

### 🟢 Integration Tests (`/tests/integration/`)

**Objetivo:** Probar interacción entre múltiples componentes.

**Características:**

-   ⏱️ Moderadamente rápidos (< 1s por test)
-   🔗 Múltiples componentes trabajando juntos
-   🎭 Usan mocks solo para servicios externos
-   ✅ Verifican flujo de datos entre componentes

**Ejemplos:**

-   `CommandContext` con diferentes fuentes
-   `CommandHandler` con plugins
-   `RichMessage` con componentes

**Estructura de ejemplo:**

```typescript
// tests/integration/core/CommandContext.test.ts
describe('CommandContext Integration', () => {
    it('should handle both message and interaction sources', () => {
        const message = createMockMessage();
        const interaction = createMockInteraction();

        const ctxMessage = new CommandContext(message);
        const ctxInteraction = new CommandContext(interaction);

        // Verificar que ambos funcionen igual
    });
});
```

### 🔴 End-to-End Tests (`/tests/e2e/`)

**Objetivo:** Probar flujo completo del bot como lo haría un usuario.

**Características:**

-   🐌 Lentos (varios segundos por test)
-   🌐 Bot real conectado a Discord
-   📊 Verifican comportamiento completo
-   ⚠️ Requieren configuración especial

**Ejemplos:**

-   Bot inicia y se conecta a Discord
-   Usuario envía comando y recibe respuesta
-   Flujo completo de plugins + comando + respuesta

**Estructura de ejemplo:**

```typescript
// tests/e2e/bot.e2e.test.ts
describe('E2E: Command Execution', () => {
    it.skip('should execute command end-to-end', async () => {
        // 1. Usuario envía !ping
        // 2. Bot procesa comando
        // 3. Plugins se ejecutan
        // 4. Bot responde "Pong!"
    });
});
```

**⚠️ Nota:** Los tests e2e están como `.skip` por defecto porque requieren:

-   Token de Discord de testing
-   Servidor de Discord de pruebas
-   Configuración adicional

## 🎭 Mocks

### Discord.js Mocks (`/tests/mocks/discord.mock.ts`)

Mocks de objetos de Discord.js para testing sin conexión real.

**Funciones disponibles:**

```typescript
import {
    createMockClient,
    createMockUser,
    createMockGuild,
    createMockMember,
    createMockTextChannel,
    createMockMessage,
    createMockInteraction,
} from '@tests/mocks/discord.mock';

// Crear usuario mock
const user = createMockUser('123456789', 'TestUser');

// Crear mensaje mock
const message = createMockMessage('!test command', user);

// Crear interacción mock
const interaction = createMockInteraction('test', user);
```

**Características:**

-   ✅ Totalmente tipados con TypeScript
-   ✅ Métodos como `jest.fn()` para espiar llamadas
-   ✅ IDs y nombres personalizables
-   ✅ Relaciones correctas (Guild → Channel → Member)

### Fixtures (`/tests/fixtures/`)

Datos de prueba reutilizables en múltiples tests.

```typescript
import {
    standardUser,
    adminUser,
    standardGuild,
    textCommands,
    argumentFixtures,
} from '@tests/fixtures/common.fixtures';

// Usar en tests
const ctx = new CommandContext(createMockMessage(textCommands.help, standardUser));
```

## 📋 Escribir Tests

### Anatomía de un Test

```typescript
// 1. Imports
import { Times } from '@/utils/Times';

// 2. Describe block (suite)
describe('Times Utility', () => {
    // 3. Nested describe (opcional, para organizar)
    describe('seconds', () => {
        // 4. Individual test
        it('should convert seconds to milliseconds', () => {
            // 5. Arrange (preparar)
            const input = 5;

            // 6. Act (ejecutar)
            const result = Times.seconds(input);

            // 7. Assert (verificar)
            expect(result).toBe(5000);
        });
    });
});
```

### Mejores Prácticas

#### ✅ DO (Hacer)

```typescript
// ✅ Nombres descriptivos
it('should throw ValidationError when age is negative', () => {
    expect(() => validateAge(-1)).toThrow(ValidationError);
});

// ✅ Un concepto por test
it('should convert minutes to milliseconds', () => {
    expect(Times.minutes(1)).toBe(60000);
});

// ✅ Arrange-Act-Assert pattern
it('should calculate total correctly', () => {
    // Arrange
    const a = 5;
    const b = 10;

    // Act
    const result = sum(a, b);

    // Assert
    expect(result).toBe(15);
});

// ✅ Usar mocks para dependencias externas
it('should send message to channel', async () => {
    const message = createMockMessage();
    await sendToChannel(message.channel, 'test');

    expect(message.channel.send).toHaveBeenCalledWith('test');
});
```

#### ❌ DON'T (No hacer)

```typescript
// ❌ Nombres vagos
it('test 1', () => {
    expect(Times.seconds(1)).toBe(1000);
});

// ❌ Múltiples conceptos en un test
it('should work correctly', () => {
    expect(Times.seconds(1)).toBe(1000);
    expect(Times.minutes(1)).toBe(60000);
    expect(Times.hours(1)).toBe(3600000);
});

// ❌ Sin Arrange-Act-Assert
it('converts time', () => {
    expect(Times.seconds(5)).toBe(5000);
    const minutes = Times.minutes(2);
    expect(minutes).toBe(120000);
});

// ❌ Tests que dependen de otros tests
let sharedState: any;

it('sets state', () => {
    sharedState = { value: 10 };
});

it('uses state from previous test', () => {
    expect(sharedState.value).toBe(10); // ❌ Depende del orden
});
```

### Matchers Comunes

```typescript
// Igualdad
expect(value).toBe(5); // ===
expect(object).toEqual({ a: 1 }); // Deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Números
expect(value).toBeGreaterThan(3);
expect(value).toBeGreaterThanOrEqual(3);
expect(value).toBeLessThan(5);
expect(value).toBeCloseTo(0.3); // Floating point

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Objetos
expect(object).toHaveProperty('key');
expect(object).toMatchObject({ key: 'value' });

// Excepciones
expect(() => fn()).toThrow();
expect(() => fn()).toThrow(Error);
expect(() => fn()).toThrow('error message');

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();

// Funciones mock
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledTimes(3);
```

## 🎯 Hooks de Lifecycle

```typescript
describe('Test Suite', () => {
    // Se ejecuta UNA VEZ antes de todos los tests
    beforeAll(() => {
        // Setup global: conectar DB, iniciar servidor, etc.
    });

    // Se ejecuta UNA VEZ después de todos los tests
    afterAll(() => {
        // Cleanup global: cerrar conexiones, limpiar recursos
    });

    // Se ejecuta ANTES de cada test
    beforeEach(() => {
        // Setup por test: reset estado, crear mocks, etc.
    });

    // Se ejecuta DESPUÉS de cada test
    afterEach(() => {
        // Cleanup por test: limpiar mocks, reset estado
    });

    it('test 1', () => {
        // beforeEach → test 1 → afterEach
    });

    it('test 2', () => {
        // beforeEach → test 2 → afterEach
    });
});
```

## 📊 Cobertura de Código

### Ver Reporte de Cobertura

```bash
npm run test:coverage
```

El reporte se genera en `/coverage/`:

-   `coverage/lcov-report/index.html` - Reporte HTML interactivo
-   `coverage/coverage-summary.json` - Resumen en JSON

### Interpretar Resultados

```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   85.71 |    66.67 |      80 |   85.71 |
 utils/             |     100 |      100 |     100 |     100 |
  Times.ts          |     100 |      100 |     100 |     100 |
 error/             |   71.43 |       50 |      60 |   71.43 |
  ReplyError.ts     |   71.43 |       50 |      60 |   71.43 | 15-18
--------------------|---------|----------|---------|---------|-------------------
```

**Métricas:**

-   **% Stmts** (Statements): Porcentaje de líneas de código ejecutadas
-   **% Branch**: Porcentaje de ramas de código (`if/else`) probadas
-   **% Funcs**: Porcentaje de funciones ejecutadas
-   **% Lines**: Porcentaje de líneas de código ejecutadas

**Umbrales recomendados:**

-   ✅ > 80% - Excelente cobertura
-   ⚠️ 60-80% - Cobertura aceptable
-   ❌ < 60% - Cobertura insuficiente

## 🔧 Configuración

### jest.config.ts

Configuración principal de Jest:

```typescript
export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests', '<rootDir>/src'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@tests/(.*)$': '<rootDir>/tests/$1',
    },
    // ... más configuración
};
```

### tests/setup.ts

Setup global ejecutado antes de todos los tests:

```typescript
import 'reflect-metadata';

process.env.NODE_ENV = 'test';
jest.setTimeout(30000);

beforeEach(() => {
    jest.clearAllMocks();
});
```

## 🐛 Debugging Tests

### Ejecutar Test Específico

```bash
# Por nombre de archivo
npm test Times.test

# Por describe/it text
npm test -- --testNamePattern="should convert seconds"
```

### Debug en VS Code

Agregar configuración en `.vscode/launch.json`:

```json
{
    "type": "node",
    "request": "launch",
    "name": "Jest: Debug Current Test",
    "program": "${workspaceFolder}/node_modules/.bin/jest",
    "args": ["${fileBasename}", "--runInBand", "--no-coverage"],
    "console": "integratedTerminal",
    "internalConsoleOptions": "neverOpen"
}
```

### Ver Output Completo

```bash
# Verbose output
npm test -- --verbose

# Ver console.log
npm test -- --silent=false
```

## 📝 Ejemplos de Tests

### Test de Utilidad Simple

```typescript
import { Times } from '@/utils/Times';

describe('Times', () => {
    it('should convert minutes to milliseconds', () => {
        expect(Times.minutes(5)).toBe(300000);
    });
});
```

### Test con Mocks

```typescript
import { createMockMessage } from '@tests/mocks/discord.mock';

describe('CommandHandler', () => {
    it('should reply to message', async () => {
        const message = createMockMessage('!ping');

        await handleCommand(message);

        expect(message.reply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining('Pong'),
            }),
        );
    });
});
```

### Test Async/Await

```typescript
describe('AsyncFunction', () => {
    it('should resolve with value', async () => {
        const result = await fetchData();
        expect(result).toBe('data');
    });

    it('should reject with error', async () => {
        await expect(fetchInvalidData()).rejects.toThrow('Not found');
    });
});
```

### Test con Fixtures

```typescript
import { standardUser, textCommands } from '@tests/fixtures/common.fixtures';

describe('Command Parser', () => {
    it('should parse help command', () => {
        const parsed = parseCommand(textCommands.help, standardUser);

        expect(parsed.command).toBe('help');
        expect(parsed.user).toBe(standardUser);
    });
});
```

## 🚨 Troubleshooting

### "Cannot find module '@/...'"

**Problema:** TypeScript no encuentra imports con alias `@/`.

**Solución:** Verificar que `jest.config.ts` tenga `moduleNameMapper`:

```typescript
moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
}
```

### "Cannot find namespace 'jest'"

**Problema:** TypeScript no reconoce tipos de Jest.

**Solución:** Instalar tipos:

```bash
npm install --save-dev @types/jest
```

### Tests muy lentos

**Problema:** Tests tardan mucho en ejecutarse.

**Solución:**

1. Usar `--maxWorkers=50%` para paralelizar
2. Separar tests lentos (e2e) de rápidos (unit)
3. Usar `test.skip()` para tests e2e en desarrollo

### "Exceeded timeout"

**Problema:** Test supera el timeout de 5 segundos.

**Solución:** Aumentar timeout:

```typescript
it('slow test', async () => {
    // Código...
}, 30000); // 30 segundos

// O globalmente en jest.config.ts
testTimeout: 30000;
```

## 📚 Recursos

-   [Jest Documentation](https://jestjs.io/docs/getting-started)
-   [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
-   [Discord.js Guide - Testing](https://discordjs.guide/additional-info/testing.html)

## 🎯 Próximos Pasos

1. ✅ Instalar dependencias: `npm install`
2. ✅ Ejecutar tests de ejemplo: `npm test`
3. ✅ Ver cobertura: `npm run test:coverage`
4. 📝 Escribir tests para tus comandos
5. 📝 Escribir tests para tus plugins
6. 📝 Configurar CI/CD para ejecutar tests automáticamente

---

¡Happy Testing! 🧪✨
