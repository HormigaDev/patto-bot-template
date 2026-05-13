/**
 * Tests unitarios para `MemoryLocaleStore`.
 *
 * El store persiste **por servidor (guild)**, no por usuario: el idioma
 * es una configuración global del servidor que afecta a todos sus
 * miembros.
 */

import { MemoryLocaleStore } from '@/i18n';

describe('i18n / MemoryLocaleStore', () => {
    let store: MemoryLocaleStore;

    beforeEach(() => {
        store = new MemoryLocaleStore();
    });

    describe('getGuildLocale', () => {
        it('debería devolver undefined cuando no hay preferencia guardada', async () => {
            await expect(store.getGuildLocale('guild-1')).resolves.toBeUndefined();
        });

        it('debería devolver el locale guardado', async () => {
            await store.setGuildLocale('guild-1', 'en');
            await expect(store.getGuildLocale('guild-1')).resolves.toBe('en');
        });

        it('debería aislar preferencias entre servidores', async () => {
            await store.setGuildLocale('guild-1', 'en');
            await store.setGuildLocale('guild-2', 'pt');

            await expect(store.getGuildLocale('guild-1')).resolves.toBe('en');
            await expect(store.getGuildLocale('guild-2')).resolves.toBe('pt');
            await expect(store.getGuildLocale('guild-3')).resolves.toBeUndefined();
        });
    });

    describe('setGuildLocale', () => {
        it('debería sobreescribir un valor previo', async () => {
            await store.setGuildLocale('guild-1', 'en');
            await store.setGuildLocale('guild-1', 'pt');
            await expect(store.getGuildLocale('guild-1')).resolves.toBe('pt');
        });
    });

    describe('deleteGuildLocale', () => {
        it('debería eliminar la preferencia guardada', async () => {
            await store.setGuildLocale('guild-1', 'en');
            await store.deleteGuildLocale('guild-1');
            await expect(store.getGuildLocale('guild-1')).resolves.toBeUndefined();
        });

        it('no debería lanzar al eliminar una clave inexistente', async () => {
            await expect(store.deleteGuildLocale('ghost')).resolves.toBeUndefined();
        });
    });

    describe('clear', () => {
        it('debería borrar todas las preferencias', async () => {
            await store.setGuildLocale('guild-1', 'en');
            await store.setGuildLocale('guild-2', 'pt');

            store.clear();

            await expect(store.getGuildLocale('guild-1')).resolves.toBeUndefined();
            await expect(store.getGuildLocale('guild-2')).resolves.toBeUndefined();
        });
    });

    describe('concurrencia', () => {
        it('debería soportar escrituras paralelas en servidores distintos sin interferencia', async () => {
            const guilds = Array.from({ length: 50 }, (_, i) => `guild-${i}`);
            const locales = ['es', 'en', 'pt'] as const;

            await Promise.all(
                guilds.map((g, i) => store.setGuildLocale(g, locales[i % locales.length])),
            );

            for (let i = 0; i < guilds.length; i++) {
                await expect(store.getGuildLocale(guilds[i])).resolves.toBe(
                    locales[i % locales.length],
                );
            }
        });
    });
});
