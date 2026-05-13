/**
 * Tests unitarios para los helpers de tipo del subsistema i18n.
 */

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isSupportedLocale, normalizeLocale } from '@/i18n';

describe('i18n / types', () => {
    describe('SUPPORTED_LOCALES', () => {
        it('debería contener exactamente es, en y pt', () => {
            expect([...SUPPORTED_LOCALES].sort()).toEqual(['en', 'es', 'pt']);
        });

        it('debería tener "es" como locale por defecto', () => {
            expect(DEFAULT_LOCALE).toBe('es');
            expect(SUPPORTED_LOCALES).toContain(DEFAULT_LOCALE);
        });
    });

    describe('isSupportedLocale', () => {
        it.each(['es', 'en', 'pt'])('debería aceptar %s como locale válido', (loc) => {
            expect(isSupportedLocale(loc)).toBe(true);
        });

        it.each(['ES', 'En', 'fr', 'de', 'pt-BR', '', '   '])(
            'debería rechazar variantes o idiomas no soportados (%p)',
            (value) => {
                expect(isSupportedLocale(value)).toBe(false);
            },
        );

        it.each([null, undefined, 0, false, {}, []])(
            'debería rechazar valores no string (%p)',
            (value) => {
                expect(isSupportedLocale(value)).toBe(false);
            },
        );
    });

    describe('normalizeLocale', () => {
        it.each([
            ['es', 'es'],
            ['en', 'en'],
            ['pt', 'pt'],
        ])('debería devolver %s para %s', (input, expected) => {
            expect(normalizeLocale(input)).toBe(expected);
        });

        it.each([
            ['es-ES', 'es'],
            ['en-US', 'en'],
            ['en-GB', 'en'],
            ['pt-BR', 'pt'],
            ['pt-PT', 'pt'],
            ['ES-ES', 'es'],
        ])('debería normalizar variantes regionales: %s → %s', (input, expected) => {
            expect(normalizeLocale(input)).toBe(expected);
        });

        it.each(['fr', 'fr-FR', 'de', 'zh-CN'])(
            'debería devolver null para idiomas no soportados (%s)',
            (input) => {
                expect(normalizeLocale(input)).toBeNull();
            },
        );

        it.each([null, undefined, ''])('debería devolver null para %p', (input) => {
            expect(normalizeLocale(input)).toBeNull();
        });
    });
});
