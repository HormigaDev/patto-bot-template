/**
 * Ejemplo de test de integración para CommandContext
 */

import { CommandContext } from '@/core/structures/CommandContext';
import { createMockMessage, createMockInteraction } from '@tests/mocks/discord.mock';

describe('CommandContext Integration', () => {
    describe('with Message source', () => {
        it('should create context from message', () => {
            const message = createMockMessage();
            const ctx = new CommandContext(message);

            expect(ctx.isInteraction).toBe(false);
            expect(ctx.user).toBe(message.author);
            expect(ctx.guild).toBe(message.guild);
            expect(ctx.channel).toBe(message.channel);
        });

        it('should reply to message', async () => {
            const message = createMockMessage();
            const ctx = new CommandContext(message);

            await ctx.reply('Test reply');

            expect(message.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: 'Test reply',
                }),
            );
        });

        it('should send message to channel', async () => {
            const message = createMockMessage();
            const ctx = new CommandContext(message);

            await ctx.send('Test message');

            // El channel es TextChannel mock, hacemos cast para acceder al método
            const textChannel = message.channel as any;
            expect(textChannel.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: 'Test message',
                }),
            );
        });
    });

    describe('with Interaction source', () => {
        it('should create context from interaction', () => {
            const interaction = createMockInteraction();
            const ctx = new CommandContext(interaction);

            expect(ctx.isInteraction).toBe(true);
            expect(ctx.user).toBe(interaction.user);
            expect(ctx.guild).toBe(interaction.guild);
            expect(ctx.channel).toBe(interaction.channel);
        });

        it('should reply to interaction', async () => {
            const interaction = createMockInteraction();
            const ctx = new CommandContext(interaction);

            await ctx.reply('Test reply');

            expect(interaction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: 'Test reply',
                }),
            );
        });

        it('should send message for interaction', async () => {
            const interaction = createMockInteraction();
            const ctx = new CommandContext(interaction);

            await ctx.send('Test message');

            // send() en interaction llama a reply() internamente
            expect(interaction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: 'Test message',
                }),
            );
        });
    });

    describe('cross-source compatibility', () => {
        it('should have same interface for both message and interaction', () => {
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
