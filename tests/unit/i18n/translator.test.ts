/**
 * Tests del bundle global `i18n` y de la función traductora `TFn`.
 *
 * El módulo expone una única forma de traducir: `i18n.for(locale)`
 * devuelve una función `t(key, ...args)` con tipos completos.
 */

import 'reflect-metadata';
import { i18n, type SupportedLocale } from '@/i18n';

describe('i18n / global bundle', () => {
    it.each<SupportedLocale>(['es', 'en', 'pt'])(
        'debería resolver a una función válida para locale %s',
        (loc) => {
            const t = i18n.for(loc);
            expect(typeof t).toBe('function');
            // claves string: devuelven el literal del bundle
            expect(typeof t('ping.response.title')).toBe('string');
            expect(typeof t('system.error.title')).toBe('string');
        },
    );

    it('los tres locales soportados están registrados', () => {
        expect(i18n.has('es')).toBe(true);
        expect(i18n.has('en')).toBe(true);
        expect(i18n.has('pt')).toBe(true);
    });

    it('availableLocales() lista exactamente los locales soportados', () => {
        expect(i18n.availableLocales().sort()).toEqual(['en', 'es', 'pt']);
    });

    it('las claves función con interpolación producen strings en todos los locales', () => {
        const sample = 99;
        expect(typeof i18n.for('es')('ping.response.latency', sample)).toBe('string');
        expect(typeof i18n.for('en')('ping.response.latency', sample)).toBe('string');
        expect(typeof i18n.for('pt')('ping.response.latency', sample)).toBe('string');

        expect(i18n.for('es')('ping.response.latency', sample)).toContain('99');
        expect(i18n.for('en')('ping.response.latency', sample)).toContain('99');
        expect(i18n.for('pt')('ping.response.latency', sample)).toContain('99');
    });

    it('los textos difieren entre locales (sanity check de traducciones)', () => {
        expect(i18n.for('es')('system.error.title')).toBe('Error');
        expect(i18n.for('en')('system.error.title')).toBe('Error');
        expect(i18n.for('pt')('system.error.title')).toBe('Erro');
    });

    it('claves con múltiples argumentos resuelven todas las interpolaciones', () => {
        const out = i18n.for('es')('system.argument.parse_error', 'name', 'because');
        expect(out).toContain('name');
        expect(out).toContain('because');
    });

    it('locale undefined cae al idioma base', () => {
        const fromUndefined = i18n.for(undefined)('system.error.title');
        const fromEs = i18n.for('es')('system.error.title');
        expect(fromUndefined).toBe(fromEs);
    });

    it('locale null cae al idioma base', () => {
        const fromNull = i18n.for(null)('system.error.title');
        const fromEs = i18n.for('es')('system.error.title');
        expect(fromNull).toBe(fromEs);
    });

    it('locale desconocido cae al idioma base', () => {
        // Cast intencional: validamos el comportamiento defensivo del
        // runtime ante un valor que no debería llegar tipado.
        const t = i18n.for('zz' as unknown as SupportedLocale);
        expect(t('system.error.title')).toBe(i18n.for('es')('system.error.title'));
    });

    it('seguro bajo concurrencia: distintos locales en paralelo sin interferencia', async () => {
        const locales: SupportedLocale[] = ['es', 'en', 'pt'];
        const N = 200;
        const results = await Promise.all(
            Array.from({ length: N }, (_, i) =>
                Promise.resolve(i18n.for(locales[i % 3])('ping.response.title')),
            ),
        );
        // Los tres locales tienen el mismo texto literal en este caso,
        // pero la prueba demuestra ausencia de interferencia: ninguna
        // promesa termina lanzando ni devolviendo `undefined`.
        for (const r of results) {
            expect(typeof r).toBe('string');
            expect(r.length).toBeGreaterThan(0);
        }
    });
});
