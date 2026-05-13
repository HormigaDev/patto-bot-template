/**
 * Tests unitarios para `generateId`.
 *
 * Cubre:
 * - Tamaño exacto del identificador.
 * - Alfabeto base62 (sin caracteres fuera del rango permitido).
 * - Prefijo de timestamp: dos IDs generados con `Date.now()` distintos
 *   ordenan lexicográficamente igual que sus timestamps.
 * - Entropía aleatoria: dos IDs en el mismo milisegundo difieren en la
 *   cola random.
 * - Validación de input (tamaño no entero / negativo / cero).
 */

import { generateId } from '@/utils/Id';

const BASE62_RE = /^[0-9A-Za-z]+$/;

describe('utils / generateId', () => {
    describe('formato', () => {
        it('debería devolver 11 caracteres por defecto', () => {
            expect(generateId()).toHaveLength(11);
        });

        it.each([1, 5, 10, 11, 16, 24, 32])(
            'debería devolver exactamente %i caracteres cuando se pide ese tamaño',
            (size) => {
                expect(generateId(size)).toHaveLength(size);
            },
        );

        it('debería usar únicamente caracteres del alfabeto base62 (0-9A-Za-z)', () => {
            for (let i = 0; i < 100; i++) {
                expect(generateId(20)).toMatch(BASE62_RE);
            }
        });
    });

    describe('validación de input', () => {
        it.each([0, -1, -10])('debería rechazar tamaño no positivo (%i)', (size) => {
            expect(() => generateId(size)).toThrow(RangeError);
        });

        it.each([1.5, NaN, Infinity])('debería rechazar tamaño no entero (%p)', (size) => {
            expect(() => generateId(size)).toThrow(RangeError);
        });
    });

    describe('orden temporal', () => {
        it('debería preservar el orden cronológico al ordenar lexicográficamente', () => {
            const t1 = 1_700_000_000_000;
            const t2 = 1_700_000_000_500;
            const spy = jest.spyOn(Date, 'now').mockReturnValueOnce(t1).mockReturnValueOnce(t2);

            const a = generateId(11);
            const b = generateId(11);

            expect(a < b).toBe(true);
            spy.mockRestore();
        });

        it('dos IDs generados en el mismo ms deberían compartir prefijo de timestamp', () => {
            const fixed = 1_700_000_000_000;
            const spy = jest.spyOn(Date, 'now').mockReturnValue(fixed);

            const a = generateId(11);
            const b = generateId(11);

            // 8 caracteres de timestamp con el tamaño por defecto de 11
            expect(a.slice(0, 8)).toBe(b.slice(0, 8));
            spy.mockRestore();
        });

        it('debería preservar el orden cronológico para timestamps del año 3000', () => {
            const t1 = Date.UTC(2999, 11, 31, 23, 59, 59, 999);
            const t2 = Date.UTC(3000, 0, 1, 0, 0, 0, 0);
            const spy = jest.spyOn(Date, 'now').mockReturnValueOnce(t1).mockReturnValueOnce(t2);

            const a = generateId(11);
            const b = generateId(11);

            expect(a < b).toBe(true);
            spy.mockRestore();
        });

        it('dos IDs generados en el mismo ms deberían diferir en la cola aleatoria', () => {
            const fixed = 1_700_000_000_000;
            const spy = jest.spyOn(Date, 'now').mockReturnValue(fixed);

            // Generamos varios para no depender de la suerte
            const set = new Set<string>();
            for (let i = 0; i < 50; i++) set.add(generateId(11));
            expect(set.size).toBeGreaterThan(1);

            spy.mockRestore();
        });
    });

    describe('unicidad', () => {
        it('no debería colisionar con tamaños holgados aun generando muchos IDs en el mismo ms', () => {
            // Con tamaño 15 → 8 chars de timestamp + 7 random (62⁷ ≈ 3.5×10¹²
            // combinaciones por ms). El paradox de cumpleaños empieza a
            // morder cerca de los ~1.9 M de IDs por ms, así que 10 000 está
            // muy por debajo del umbral de colisión esperable.
            const set = new Set<string>();
            for (let i = 0; i < 10_000; i++) set.add(generateId(15));
            expect(set.size).toBe(10_000);
        });

        it('a tamaño 11 hay riesgo de colisión bajo carga extrema en el mismo ms (documentado)', () => {
            // Tamaño 11 → 3 chars random → 62³ ≈ 238 000 combinaciones.
            // Generando 100 en el mismo ms el conjunto debería seguir siendo
            // unitario o casi: el test garantiza un piso razonable, no la
            // ausencia total de colisiones a este tamaño bajo carga.
            const set = new Set<string>();
            for (let i = 0; i < 100; i++) set.add(generateId(11));
            expect(set.size).toBeGreaterThanOrEqual(95);
        });
    });
});
