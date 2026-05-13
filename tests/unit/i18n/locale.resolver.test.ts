/**
 * Tests unitarios para `LocaleResolver`.
 *
 * Verifica la cadena de precedencia documentada:
 *  1. Preferencia explícita del **servidor** (store).
 *  2. Locale de Discord (`interaction.locale`, normalizado).
 *  3. DEFAULT_LOCALE.
 */

import { LocaleResolver, MemoryLocaleStore } from '@/i18n';

describe('i18n / LocaleResolver', () => {
    let store: MemoryLocaleStore;
    let resolver: LocaleResolver;

    beforeEach(() => {
        store = new MemoryLocaleStore();
        resolver = new LocaleResolver(store);
    });

    describe('precedencia: preferencia del servidor', () => {
        it('debería devolver la preferencia del servidor aunque venga locale de Discord', async () => {
            await store.setGuildLocale('guild-1', 'pt');

            const result = await resolver.resolve({
                guildId: 'guild-1',
                discordLocale: 'en-US',
            });

            expect(result).toBe('pt');
        });

        it('debería ignorar el default si el servidor tiene preferencia explícita', async () => {
            await store.setGuildLocale('guild-1', 'en');

            const result = await resolver.resolve({ guildId: 'guild-1' });

            expect(result).toBe('en');
        });
    });

    describe('precedencia: locale de Discord', () => {
        it('debería usar el locale de Discord cuando el servidor no tiene preferencia', async () => {
            const result = await resolver.resolve({
                guildId: 'guild-1',
                discordLocale: 'pt-BR',
            });
            expect(result).toBe('pt');
        });

        it('debería normalizar variantes regionales del locale de Discord', async () => {
            expect(await resolver.resolve({ guildId: 'g1', discordLocale: 'es-ES' })).toBe('es');
            expect(await resolver.resolve({ guildId: 'g2', discordLocale: 'en-GB' })).toBe('en');
            expect(await resolver.resolve({ guildId: 'g3', discordLocale: 'pt-PT' })).toBe('pt');
        });

        it('debería ignorar el locale de Discord si no está soportado', async () => {
            const result = await resolver.resolve({
                guildId: 'guild-1',
                discordLocale: 'fr-FR',
            });
            expect(result).toBe('es'); // fallback al default
        });

        it('debería resolver con locale de Discord aunque no haya guildId (DM)', async () => {
            const result = await resolver.resolve({ discordLocale: 'pt-BR' });
            expect(result).toBe('pt');
        });
    });

    describe('precedencia: default', () => {
        it('debería caer al default cuando no hay nada útil', async () => {
            const result = await resolver.resolve({});
            expect(result).toBe('es');
        });

        it('debería tratar discordLocale undefined / vacío como ausencia', async () => {
            expect(
                await resolver.resolve({ guildId: 'guild-1', discordLocale: undefined }),
            ).toBe('es');
            expect(await resolver.resolve({ guildId: 'guild-1', discordLocale: '' })).toBe('es');
        });
    });

    describe('aislamiento por servidor', () => {
        it('debería resolver independientemente para cada guildId', async () => {
            await store.setGuildLocale('guild-1', 'en');
            await store.setGuildLocale('guild-2', 'pt');

            const [a, b, c] = await Promise.all([
                resolver.resolve({ guildId: 'guild-1' }),
                resolver.resolve({ guildId: 'guild-2' }),
                resolver.resolve({ guildId: 'guild-3', discordLocale: 'es-ES' }),
            ]);

            expect(a).toBe('en');
            expect(b).toBe('pt');
            expect(c).toBe('es');
        });
    });
});
