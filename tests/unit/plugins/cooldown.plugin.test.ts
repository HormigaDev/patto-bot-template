/**
 * Tests unitarios para CooldownPlugin
 */

import { CooldownPlugin } from '@/plugins/cooldown.plugin';
import { type CooldownStore } from '@/core/store/cooldown.store';
import { COOLDOWN_METADATA_KEY } from '@/core/decorators/cooldown.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { MetadataStore } from '@/core/metadata/metadata.store';
import 'reflect-metadata';

function setCooldown(target: new (...args: any[]) => any, time: number): void {
    Reflect.defineMetadata(COOLDOWN_METADATA_KEY, { time }, target);
}

describe('CooldownPlugin', () => {
    let plugin: CooldownPlugin;
    let mockStore: jest.Mocked<CooldownStore>;

    beforeEach(() => {
        MetadataStore.clear();
        mockStore = {
            get: jest.fn(),
            set: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined),
        };
        plugin = new CooldownPlugin(mockStore);
    });

    function makeMockCommand(
        commandClass: new (...args: any[]) => any,
        userId = 'user-1',
        commandId = 'ping',
    ) {
        const mockEmbed = {
            setDescription: jest.fn().mockReturnThis(),
        };
        // `t` se invoca como función: ignora la clave y devuelve un
        // marcador determinístico para verificar que el plugin la usó.
        const tMock = jest.fn((key: string, ...args: unknown[]) =>
            args.length > 0 ? `${key}(${args.join(',')})` : key,
        );
        return {
            constructor: commandClass,
            user: { id: userId },
            id: commandId,
            locale: 'es',
            t: tMock,
            getEmbed: jest.fn().mockReturnValue(mockEmbed),
            reply: jest.fn().mockResolvedValue(undefined),
        } as any;
    }

    describe('onBeforeExecute', () => {
        it('debería permitir la ejecución cuando no hay cooldown registrado para el usuario', async () => {
            class PingCommand extends BaseCommand {
                async run() {}
            }
            mockStore.get.mockResolvedValue(undefined);

            const command = makeMockCommand(PingCommand);
            const result = await plugin.onBeforeExecute(command);

            expect(result).toBe(true);
            expect(mockStore.get).toHaveBeenCalledWith('user-1-ping');
            expect(command.reply).not.toHaveBeenCalled();
            expect(mockStore.delete).not.toHaveBeenCalled();
        });

        it('debería permitir la ejecución y borrar la key cuando el cooldown ya expiró', async () => {
            class PingCommand extends BaseCommand {
                async run() {}
            }
            mockStore.get.mockResolvedValue(Date.now() - 1000);

            const command = makeMockCommand(PingCommand);
            const result = await plugin.onBeforeExecute(command);

            expect(result).toBe(true);
            expect(mockStore.delete).toHaveBeenCalledWith('user-1-ping');
            expect(command.reply).not.toHaveBeenCalled();
        });

        it('debería denegar la ejecución y responder cuando el cooldown está activo', async () => {
            class PingCommand extends BaseCommand {
                async run() {}
            }
            mockStore.get.mockResolvedValue(Date.now() + 5000);

            const command = makeMockCommand(PingCommand);
            const result = await plugin.onBeforeExecute(command);

            expect(result).toBe(false);
            expect(command.getEmbed).toHaveBeenCalledWith('error');
            expect(command.reply).toHaveBeenCalledWith({ embeds: [expect.any(Object)] });
            expect(mockStore.delete).not.toHaveBeenCalled();
        });

        it('la respuesta de denegación debe incluir el timestamp de Discord en la descripción', async () => {
            class PingCommand extends BaseCommand {
                async run() {}
            }
            const futureExpiry = Date.now() + 10_000;
            mockStore.get.mockResolvedValue(futureExpiry);

            const command = makeMockCommand(PingCommand);
            await plugin.onBeforeExecute(command);

            const mockEmbed = command.getEmbed.mock.results[0].value;
            const descCall = mockEmbed.setDescription.mock.calls[0][0] as string;
            // El timestamp de Discord tiene el formato <t:SECONDS:FORMAT>
            expect(descCall).toMatch(/<t:\d+:T>/);
            expect(command.t).toHaveBeenCalledWith(
                'cooldown.wait_until',
                expect.stringMatching(/<t:\d+:T>/),
            );
        });

        it('debería usar la key correcta combinando userId y commandId', async () => {
            class BanCommand extends BaseCommand {
                async run() {}
            }
            mockStore.get.mockResolvedValue(undefined);

            const command = makeMockCommand(BanCommand, 'abc123', 'ban');
            await plugin.onBeforeExecute(command);

            expect(mockStore.get).toHaveBeenCalledWith('abc123-ban');
        });

        it('debería tratar expiry exactamente igual a Date.now() como activo', async () => {
            class PingCommand extends BaseCommand {
                async run() {}
            }
            // Si expiry === Date.now() la condición `expiry < Date.now()` es false → deniega
            const now = Date.now();
            jest.spyOn(Date, 'now').mockReturnValue(now);
            mockStore.get.mockResolvedValue(now);

            const command = makeMockCommand(PingCommand);
            const result = await plugin.onBeforeExecute(command);

            expect(result).toBe(false);
            jest.restoreAllMocks();
        });
    });

    describe('onAfterExecute', () => {
        it('debería guardar el expiry en el store cuando el comando tiene @Cooldown', async () => {
            class SlowCommand extends BaseCommand {
                async run() {}
            }
            setCooldown(SlowCommand, 5000);

            const before = Date.now();
            const command = makeMockCommand(SlowCommand);
            await plugin.onAfterExecute(command);
            const after = Date.now();

            expect(mockStore.set).toHaveBeenCalledTimes(1);
            const [key, expiry] = mockStore.set.mock.calls[0];
            expect(key).toBe('user-1-ping');
            expect(expiry).toBeGreaterThanOrEqual(before + 5000);
            expect(expiry).toBeLessThanOrEqual(after + 5000);
        });

        it('el expiry guardado debe ser Date.now() + cooldown.time', async () => {
            class SlowCommand extends BaseCommand {
                async run() {}
            }
            const COOLDOWN_MS = 3000;
            const FIXED_NOW = 1_000_000;
            setCooldown(SlowCommand, COOLDOWN_MS);
            jest.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);

            const command = makeMockCommand(SlowCommand);
            await plugin.onAfterExecute(command);

            expect(mockStore.set).toHaveBeenCalledWith('user-1-ping', FIXED_NOW + COOLDOWN_MS);
            jest.restoreAllMocks();
        });

        it('no debería guardar nada cuando el comando no tiene @Cooldown', async () => {
            class FastCommand extends BaseCommand {
                async run() {}
            }

            const command = makeMockCommand(FastCommand);
            await plugin.onAfterExecute(command);

            expect(mockStore.set).not.toHaveBeenCalled();
        });

        it('no debería guardar nada cuando cooldown.time es 0', async () => {
            class ZeroCooldownCommand extends BaseCommand {
                async run() {}
            }
            setCooldown(ZeroCooldownCommand, 0);

            const command = makeMockCommand(ZeroCooldownCommand);
            await plugin.onAfterExecute(command);

            expect(mockStore.set).not.toHaveBeenCalled();
        });

        it('no debería guardar nada cuando cooldown.time es negativo', async () => {
            class NegativeCooldownCommand extends BaseCommand {
                async run() {}
            }
            setCooldown(NegativeCooldownCommand, -1000);

            const command = makeMockCommand(NegativeCooldownCommand);
            await plugin.onAfterExecute(command);

            expect(mockStore.set).not.toHaveBeenCalled();
        });

        it('debería usar la misma key en onBeforeExecute y onAfterExecute', async () => {
            class PingCommand extends BaseCommand {
                async run() {}
            }
            setCooldown(PingCommand, 2000);
            mockStore.get.mockResolvedValue(undefined);

            const command = makeMockCommand(PingCommand, 'user-42', 'ping');

            await plugin.onBeforeExecute(command);
            await plugin.onAfterExecute(command);

            expect(mockStore.get).toHaveBeenCalledWith('user-42-ping');
            expect(mockStore.set).toHaveBeenCalledWith('user-42-ping', expect.any(Number));
        });
    });

    describe('inyección de store', () => {
        it('debería funcionar con MemoryCooldownStore por defecto (sin @Cooldown → permite)', async () => {
            class PingCommand extends BaseCommand {
                async run() {}
            }
            const defaultPlugin = new CooldownPlugin();

            const command = makeMockCommand(PingCommand);
            const result = await defaultPlugin.onBeforeExecute(command);

            expect(result).toBe(true);
        });

        it('debería usar el store inyectado y no el store por defecto', async () => {
            class PingCommand extends BaseCommand {
                async run() {}
            }
            mockStore.get.mockResolvedValue(undefined);

            const command = makeMockCommand(PingCommand);
            await plugin.onBeforeExecute(command);

            expect(mockStore.get).toHaveBeenCalled();
        });

        it('el store inyectado debería recibir las escrituras de onAfterExecute', async () => {
            class SlowCommand extends BaseCommand {
                async run() {}
            }
            setCooldown(SlowCommand, 1000);

            const command = makeMockCommand(SlowCommand);
            await plugin.onAfterExecute(command);

            expect(mockStore.set).toHaveBeenCalledTimes(1);
        });
    });
});
