# 🧪 Testing

## 📖 Descripción

Sistema de testing completo para el bot de Discord. Incluye tests unitarios, de integración y end-to-end (e2e).

## 🏗️ Estructura

```
tests/
├── unit/                        # Tests unitarios — 106 tests
│   ├── utils/
│   │   ├── Times.test.ts              # 11 tests
│   │   ├── CommandCategories.test.ts  # 9 tests
│   │   └── Env.test.ts                # 46 tests
│   ├── error/
│   │   ├── ValidationError.test.ts    # 6 tests
│   │   └── ReplyError.test.ts         # 6 tests
│   └── plugins/
│       ├── permissions.plugin.test.ts # 13 tests
│       └── cooldown.plugin.test.ts    # 15 tests
├── integration/                 # Tests de integración — 14 tests
│   ├── core/
│   │   └── CommandContext.test.ts     # 7 tests
│   └── plugins/
│       └── permissions.plugin.test.ts # 7 tests
├── e2e/                         # Tests end-to-end con mocks — 5 tests
│   └── bot.e2e.test.ts
├── mocks/                       # Mocks reutilizables (Discord.js, etc)
│   └── discord.mock.ts
├── fixtures/                    # Datos de prueba predefinidos
├── helpers/                     # Utilidades para tests
├── setup.ts                     # Configuración global de tests
└── README.md                    # Este archivo
```

## 🎯 Tests Incluidos

El template incluye **125 tests** cubriendo componentes críticos:

### ✅ PermissionsPlugin (20 tests)

- **Ubicación**:
    - `tests/unit/plugins/permissions.plugin.test.ts` (13 tests)
    - `tests/integration/plugins/permissions.plugin.test.ts` (7 tests)

- **Cobertura**:
    - ✅ Fase de registro (onBeforeRegisterCommand)
    - ✅ Fase de ejecución (onBeforeExecute)
    - ✅ Inmutabilidad del commandJson
    - ✅ Combinación de permisos múltiples (bitwise OR)
    - ✅ Validación con/sin permisos
    - ✅ Integración con decorador @RequirePermissions
    - ✅ Flujos completos de registro → ejecución
    - ✅ Escenarios del mundo real (moderación)

- **Ejecutar**:
    ```bash
    npm test -- permissions.plugin.test.ts
    ```

### ✅ CooldownPlugin (15 tests)

- **Ubicación**:
    - `tests/unit/plugins/cooldown.plugin.test.ts` (15 tests)

- **Cobertura**:
    - ✅ Cooldown con decorador @Cooldown
    - ✅ Cooldown con opción en PluginRegistry
    - ✅ Expiración y reinicio de cooldown
    - ✅ Aislamiento por usuario + comando
    - ✅ Integración con CooldownStore (in-memory)

- **Ejecutar**:
    ```bash
    npm test -- cooldown.plugin.test.ts
    ```

### ✅ Bot E2E (5 tests)

- **Ubicación**:
    - `tests/e2e/bot.e2e.test.ts` (5 tests)

- **Cobertura**:
    - ✅ Inicio del bot (loadCommands + login)
    - ✅ Respuesta a slash commands
    - ✅ Manejo de comandos de texto
    - ✅ Ciclo de vida completo de un comando
    - ✅ Manejo de errores de forma elegante

- **Ejecutar**:
    ```bash
    npm run test:e2e
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

- ✅ Rápidos (< 100ms por test)
- ✅ Sin dependencias externas
- ✅ Sin llamadas a APIs o base de datos
- ✅ Usan mocks para dependencias

**Ejemplos:**

- Utilidades (`Times`, `CommandCategories`)
- Errores personalizados (`ValidationError`, `ReplyError`)
- Funciones puras y helpers

**Estructura de ejemplo:**

```typescript
// tests/unit/utils/Times.test.ts
describe('Utilidad Times', () => {
    describe('segundos', () => {
        it('debería convertir segundos a milisegundos', () => {
            expect(Times.seconds(5)).toBe(5000);
        });
    });
});
```

### 🟢 Integration Tests (`/tests/integration/`)

**Objetivo:** Probar interacción entre múltiples componentes.

**Características:**

- ⏱️ Moderadamente rápidos (< 1s por test)
- 🔗 Múltiples componentes trabajando juntos
- 🎭 Usan mocks solo para servicios externos
- ✅ Verifican flujo de datos entre componentes

**Ejemplos:**

- `CommandContext` con diferentes fuentes
- `CommandHandler` con plugins
- `RichMessage` con componentes

**Estructura de ejemplo:**

```typescript
// tests/integration/core/CommandContext.test.ts
describe('Integración CommandContext', () => {
    it('debería manejar fuentes de message e interaction', () => {
        const message = createMockMessage();
        const interaction = createMockInteraction();

        const ctxMessage = new CommandContext(message);
        const ctxInteraction = new CommandContext(interaction);

        // Verificar que ambos funcionen igual
    });
});
```

### 🔴 End-to-End Tests (`/tests/e2e/`)

**Objetivo:** Probar flujos completos del bot a nivel de proceso, usando spies y mocks de Discord.js (sin conexión real a Discord).

**Características:**

- ⏱️ Moderadamente lentos (mocks de red)
- 🎭 Usan `jest.spyOn` sobre `CommandLoader`, `client.login`, `client.on`, etc.
- 📊 Verifican el comportamiento completo del arranque y ciclo de vida
- ✅ No requieren token ni servidor de Discord

**Ejemplos:**

- Bot inicia correctamente (login + registro de eventos)
- Respuesta a slash commands
- Manejo de comandos de texto
- Ciclo completo plugins → comando → respuesta
- Manejo elegante de errores

**Estructura de ejemplo:**

```typescript
// tests/e2e/bot.e2e.test.ts
describe('E2E: Ciclo de vida del Bot', () => {
    it('debería iniciar el bot exitosamente', async () => {
        jest.spyOn(CommandLoader.prototype, 'loadCommands').mockResolvedValue();
        const bot = new Bot();
        jest.spyOn(bot.getClient(), 'login').mockResolvedValue('token');

        await bot.start();

        expect(CommandLoader.prototype.loadCommands).toHaveBeenCalled();
    });
});
```

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

- ✅ Totalmente tipados con TypeScript
- ✅ Métodos como `jest.fn()` para espiar llamadas
- ✅ IDs y nombres personalizables
- ✅ Relaciones correctas (Guild → Channel → Member)

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
describe('Utilidad Times', () => {
    // 3. Nested describe (opcional, para organizar)
    describe('segundos', () => {
        // 4. Individual test
        it('debería convertir segundos a milisegundos', () => {
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
it('debería lanzar ValidationError cuando la edad es negativa', () => {
    expect(() => validateAge(-1)).toThrow(ValidationError);
});

// ✅ Un concepto por test
it('debería convertir minutos a milisegundos', () => {
    expect(Times.minutes(1)).toBe(60000);
});

// ✅ Arrange-Act-Assert pattern
it('debería calcular el total correctamente', () => {
    // Arrange
    const a = 5;
    const b = 10;

    // Act
    const result = sum(a, b);

    // Assert
    expect(result).toBe(15);
});

// ✅ Usar mocks para dependencias externas
it('debería enviar mensaje al canal', async () => {
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
it('debería funcionar correctamente', () => {
    expect(Times.seconds(1)).toBe(1000);
    expect(Times.minutes(1)).toBe(60000);
    expect(Times.hours(1)).toBe(3600000);
});

// ❌ Sin Arrange-Act-Assert
it('convierte tiempo', () => {
    expect(Times.seconds(5)).toBe(5000);
    const minutes = Times.minutes(2);
    expect(minutes).toBe(120000);
});

// ❌ Tests que dependen de otros tests
let sharedState: any;

it('establece estado', () => {
    sharedState = { value: 10 };
});

it('usa estado del test anterior', () => {
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

- `coverage/lcov-report/index.html` - Reporte HTML interactivo
- `coverage/coverage-summary.json` - Resumen en JSON

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

- **% Stmts** (Statements): Porcentaje de líneas de código ejecutadas
- **% Branch**: Porcentaje de ramas de código (`if/else`) probadas
- **% Funcs**: Porcentaje de funciones ejecutadas
- **% Lines**: Porcentaje de líneas de código ejecutadas

**Umbrales recomendados:**

- ✅ > 80% - Excelente cobertura
- ⚠️ 60-80% - Cobertura aceptable
- ❌ < 60% - Cobertura insuficiente

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
    it('debería convertir minutos a milisegundos', () => {
        expect(Times.minutes(5)).toBe(300000);
    });
});
```

### Test con Mocks

```typescript
import { createMockMessage } from '@tests/mocks/discord.mock';

describe('CommandHandler', () => {
    it('debería responder al mensaje', async () => {
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
describe('FunciónAsync', () => {
    it('debería resolver con valor', async () => {
        const result = await fetchData();
        expect(result).toBe('data');
    });

    it('debería rechazar con error', async () => {
        await expect(fetchInvalidData()).rejects.toThrow('Not found');
    });
});
```

### Test con Fixtures

```typescript
import { standardUser, textCommands } from '@tests/fixtures/common.fixtures';

describe('Analizador de Comandos', () => {
    it('debería analizar comando de ayuda', () => {
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

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Discord.js Guide - Testing](https://discordjs.guide/additional-info/testing.html)

## 🎯 Próximos Pasos

1. ✅ Instalar dependencias: `npm install`
2. ✅ Ejecutar tests de ejemplo: `npm test`
3. ✅ Ver cobertura: `npm run test:coverage`
4. 📝 Escribir tests para tus comandos
5. 📝 Escribir tests para tus plugins
6. 📝 Configurar CI/CD para ejecutar tests automáticamente

---

¡Happy Testing! 🧪✨
