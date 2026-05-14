/**
 * Tests unitarios para `generateId`.
 *
 * Cubre:
 * - Tamaño exacto del identificador.
 * - Tamaño por defecto de 10 caracteres.
 * - Alfabeto base62 sin caracteres fuera del rango permitido.
 * - Alta entropía sin timestamp.
 * - Validación de input.
 * - Baja probabilidad práctica de colisión en generación masiva.
 */

import { generateId } from '@/utils/Id';

const BASE62_RE = /^[0-9A-Za-z]+$/;

describe('utils / generateId', () => {
    describe('formato', () => {
        it('debería devolver 10 caracteres por defecto', () => {
            expect(generateId()).toHaveLength(10);
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

    describe('entropía', () => {
        it('dos IDs consecutivos deberían diferir normalmente', () => {
            const a = generateId();
            const b = generateId();

            expect(a).not.toBe(b);
        });

        it('no debería depender de Date.now()', () => {
            const spy = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);

            const a = generateId();
            const b = generateId();

            expect(a).toHaveLength(10);
            expect(b).toHaveLength(10);
            expect(a).not.toBe(b);

            expect(spy).not.toHaveBeenCalled();

            spy.mockRestore();
        });

        it('no debería compartir un prefijo determinista de timestamp', () => {
            const ids = Array.from({ length: 100 }, () => generateId());

            const prefixes = new Set(ids.map((id) => id.slice(0, 8)));

            expect(prefixes.size).toBeGreaterThan(1);
        });
    });

    describe('unicidad', () => {
        it('no debería colisionar generando muchos IDs con el tamaño por defecto', () => {
            // 10 chars base62 → 62¹⁰ ≈ 8.39×10¹⁷ combinaciones.
            // Para 10 000 IDs, la probabilidad esperada de colisión es
            // extremadamente baja.
            const set = new Set<string>();

            for (let i = 0; i < 10_000; i++) {
                set.add(generateId());
            }

            expect(set.size).toBe(10_000);
        });

        it('no debería colisionar con tamaños holgados', () => {
            // 15 chars base62 → 62¹⁵ combinaciones.
            const set = new Set<string>();

            for (let i = 0; i < 10_000; i++) {
                set.add(generateId(15));
            }

            expect(set.size).toBe(10_000);
        });
    });
});
