/**
 * Helpers y utilidades para tests
 */

/**
 * Espera un tiempo determinado (útil para tests async)
 */
export const wait = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Ejecuta una función y captura el error lanzado
 */
export const catchError = async <T extends Error>(
    fn: () => void | Promise<void>,
): Promise<T | null> => {
    try {
        await fn();
        return null;
    } catch (error) {
        return error as T;
    }
};

/**
 * Crea un spy de console.log para verificar outputs
 */
export const spyConsoleLog = (): jest.SpyInstance => {
    return jest.spyOn(console, 'log').mockImplementation();
};

/**
 * Crea un spy de console.error para verificar errores
 */
export const spyConsoleError = (): jest.SpyInstance => {
    return jest.spyOn(console, 'error').mockImplementation();
};

/**
 * Restaura todos los spies de console
 */
export const restoreConsoleSpy = (): void => {
    jest.restoreAllMocks();
};

/**
 * Verifica que una función sea llamada N veces con timeout
 */
export const waitForCalls = async (
    mockFn: jest.Mock,
    expectedCalls: number,
    timeout: number = 5000,
): Promise<boolean> => {
    const startTime = Date.now();

    while (mockFn.mock.calls.length < expectedCalls) {
        if (Date.now() - startTime > timeout) {
            return false;
        }
        await wait(100);
    }

    return true;
};

/**
 * Crea un mock de función que se resuelve después de un delay
 */
export const createDelayedMock = <T>(value: T, delay: number = 100): jest.Mock<Promise<T>> => {
    return jest.fn().mockImplementation(async () => {
        await wait(delay);
        return value;
    });
};

/**
 * Verifica que un objeto tenga todas las propiedades requeridas
 */
export const expectObjectToHaveProperties = (obj: any, properties: string[]): void => {
    properties.forEach((prop) => {
        expect(obj).toHaveProperty(prop);
    });
};

/**
 * Genera un ID único para tests
 */
export const generateTestId = (prefix: string = 'test'): string => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Convierte un objeto en un Mock tipado de Jest
 */
export const mockify = <T>(obj: T): jest.Mocked<T> => {
    return obj as jest.Mocked<T>;
};

/**
 * Limpia y resetea todos los mocks
 */
export const resetAllMocks = (): void => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
};
