/**
 * Tests unitarios para `LocaleRegistry`.
 *
 * El registro es estático y vive durante todo el proceso. Cada test
 * debe llamar a `LocaleRegistry.reset()` para no filtrar estado.
 */

import {
    LocaleRegistry,
    LocaleResolver,
    MemoryLocaleStore,
    type LocaleStore,
    type SupportedLocale,
} from '@/i18n';

describe('i18n / LocaleRegistry', () => {
    afterEach(() => {
        LocaleRegistry.reset();
    });

    it('debería arrancar con un MemoryLocaleStore por defecto', () => {
        expect(LocaleRegistry.getStore()).toBeInstanceOf(MemoryLocaleStore);
    });

    it('debería exponer un LocaleResolver listo para usar', () => {
        expect(LocaleRegistry.getResolver()).toBeInstanceOf(LocaleResolver);
    });

    it('debería reemplazar el store al invocar useStore()', () => {
        class StubStore implements LocaleStore {
            async getGuildLocale(): Promise<SupportedLocale | undefined> {
                return 'pt';
            }
            async setGuildLocale(): Promise<void> {}
            async deleteGuildLocale(): Promise<void> {}
        }

        const stub = new StubStore();
        LocaleRegistry.useStore(stub);

        expect(LocaleRegistry.getStore()).toBe(stub);
    });

    it('useStore() debería reconstruir el resolver para usar el nuevo store', async () => {
        class StubStore implements LocaleStore {
            async getGuildLocale(): Promise<SupportedLocale | undefined> {
                return 'pt';
            }
            async setGuildLocale(): Promise<void> {}
            async deleteGuildLocale(): Promise<void> {}
        }

        LocaleRegistry.useStore(new StubStore());
        const result = await LocaleRegistry.getResolver().resolve({
            guildId: 'any-guild',
        });

        expect(result).toBe('pt');
    });

    it('reset() debería restaurar el estado por defecto', async () => {
        class StubStore implements LocaleStore {
            async getGuildLocale(): Promise<SupportedLocale | undefined> {
                return 'en';
            }
            async setGuildLocale(): Promise<void> {}
            async deleteGuildLocale(): Promise<void> {}
        }

        LocaleRegistry.useStore(new StubStore());
        LocaleRegistry.reset();

        expect(LocaleRegistry.getStore()).toBeInstanceOf(MemoryLocaleStore);

        const result = await LocaleRegistry.getResolver().resolve({ guildId: 'g' });
        expect(result).toBe('es'); // default tras reset
    });
});
