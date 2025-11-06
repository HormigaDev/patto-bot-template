/**
 * Ejemplo de test de integración para CommandContext
 */

import { CommandContext } from '@/core/structures/CommandContext';
import { createMockMessage, createMockInteraction } from '@tests/mocks/discord.mock';

describe('Integración CommandContext', () => {
    describe('con fuente Message', () => {
        it('debería crear contexto desde message', () => {
            const message = createMockMessage();
            const ctx = new CommandContext(message);

            expect(ctx.isInteraction).toBe(false);
            expect(ctx.user).toBe(message.author);
            expect(ctx.guild).toBe(message.guild);
            expect(ctx.channel).toBe(message.channel);
        });

        it('debería responder al message', async () => {
            const message = createMockMessage();
            const ctx = new CommandContext(message);

            await ctx.reply('Respuesta de prueba');

            expect(message.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: 'Respuesta de prueba',
                }),
            );
        });

        it('debería enviar message al canal', async () => {
            const message = createMockMessage();
            const ctx = new CommandContext(message);

            await ctx.send('Mensaje de prueba');

            // El channel es TextChannel mock, hacemos cast para acceder al método
            const textChannel = message.channel as any;
            expect(textChannel.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: 'Mensaje de prueba',
                }),
            );
        });
    });

    describe('con fuente Interaction', () => {
        it('debería crear contexto desde interaction', () => {
            const interaction = createMockInteraction();
            const ctx = new CommandContext(interaction);

            expect(ctx.isInteraction).toBe(true);
            expect(ctx.user).toBe(interaction.user);
            expect(ctx.guild).toBe(interaction.guild);
            expect(ctx.channel).toBe(interaction.channel);
        });

        it('debería responder a la interaction', async () => {
            const interaction = createMockInteraction();
            const ctx = new CommandContext(interaction);

            await ctx.reply('Respuesta de prueba');

            expect(interaction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: 'Respuesta de prueba',
                }),
            );
        });

        it('debería enviar mensaje para la interaction', async () => {
            const interaction = createMockInteraction();
            const ctx = new CommandContext(interaction);

            await ctx.send('Mensaje de prueba');

            // send() en interaction llama a reply() internamente
            expect(interaction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: 'Mensaje de prueba',
                }),
            );
        });
    });

    describe('compatibilidad entre fuentes', () => {
        it('debería tener la misma interfaz para message e interaction', () => {
            const message = createMockMessage();
            const interaction = createMockInteraction();

            const ctxMessage = new CommandContext(message);
            const ctxInteraction = new CommandContext(interaction);

            // Ambos deben tener las mismas propiedades
            expect(ctxMessage).toHaveProperty('user');
            expect(ctxMessage).toHaveProperty('guild');
            expect(ctxMessage).toHaveProperty('channel');
            expect(ctxMessage).toHaveProperty('isInteraction');

            expect(ctxInteraction).toHaveProperty('user');
            expect(ctxInteraction).toHaveProperty('guild');
            expect(ctxInteraction).toHaveProperty('channel');
            expect(ctxInteraction).toHaveProperty('isInteraction');
        });
    });
});
