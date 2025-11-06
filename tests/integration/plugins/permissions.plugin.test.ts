/**
 * Tests de integración para PermissionsPlugin
 * Prueba el flujo completo: registro → ejecución
 */

import { PermissionsPlugin } from '@/plugins/permissions.plugin';
import { RequirePermissions } from '@/core/decorators/permission.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { Permissions } from '@/utils/Permissions';
import { CommandContext } from '@/core/structures/CommandContext';
import { createMockInteraction, createMockMember } from '@tests/mocks/discord.mock';
import 'reflect-metadata';

describe('PermissionsPlugin Integration', () => {
    let plugin: PermissionsPlugin;

    beforeEach(() => {
        plugin = new PermissionsPlugin();
    });

    describe('Complete flow: register + execute', () => {
        it('should register command with permissions and validate on execution', async () => {
            // 1. Definir comando con decoradores
            @Command({
                name: 'ban',
                description: 'Ban a user',
            })
            @RequirePermissions(Permissions.BanMembers)
            class BanCommand extends BaseCommand {
                async run(): Promise<void> {}
            }

            // 2. FASE DE REGISTRO: onBeforeRegisterCommand
            const commandJson = {
                name: 'ban',
                description: 'Ban a user',
            };

            const modifiedJson = await plugin.onBeforeRegisterCommand(BanCommand, commandJson);

            // Verificar que el JSON fue modificado
            expect(modifiedJson).toBeDefined();
            expect(modifiedJson.default_member_permissions).toBe(Permissions.BanMembers.toString());

            // 3. FASE DE EJECUCIÓN: onBeforeExecute
            const mockInteraction = createMockInteraction();
            const mockMember = createMockMember();

            // Usuario SÍ tiene permiso de ban
            Object.defineProperty(mockMember, 'permissions', {
                value: {
                    has: jest.fn().mockReturnValue(true),
                },
                writable: true,
                configurable: true,
            });

            mockInteraction.member = mockMember;

            const ctx = new CommandContext(mockInteraction);
            const command = new BanCommand();
            (command as any).ctx = ctx;

            const canExecute = await plugin.onBeforeExecute(command);

            expect(canExecute).toBe(true);
        });

        it('should deny execution even if registered when permissions change', async () => {
            @Command({
                name: 'kick',
                description: 'Kick a user',
            })
            @RequirePermissions(Permissions.KickMembers)
            class KickCommand extends BaseCommand {
                async run(): Promise<void> {}
            }

            // 1. Registrar comando
            const commandJson = {
                name: 'kick',
                description: 'Kick a user',
            };

            const modifiedJson = await plugin.onBeforeRegisterCommand(KickCommand, commandJson);
            expect(modifiedJson.default_member_permissions).toBe(
                Permissions.KickMembers.toString(),
            );

            // 2. Simular ejecución donde usuario PERDIÓ permisos
            const mockInteraction = createMockInteraction();
            const mockMember = createMockMember();

            // Usuario NO tiene permiso
            Object.defineProperty(mockMember, 'permissions', {
                value: {
                    has: jest.fn().mockReturnValue(false),
                },
                writable: true,
                configurable: true,
            });

            mockInteraction.member = mockMember;

            const ctx = new CommandContext(mockInteraction);
            const command = new KickCommand();
            (command as any).ctx = ctx;
            (command as any).getEmbed = jest.fn().mockReturnValue({
                setTitle: jest.fn().mockReturnThis(),
                setDescription: jest.fn().mockReturnThis(),
            });
            (command as any).reply = jest.fn().mockResolvedValue(undefined);

            const canExecute = await plugin.onBeforeExecute(command);

            expect(canExecute).toBe(false);
            expect((command as any).reply).toHaveBeenCalled();
        });
    });

    describe('Multiple permissions scenario', () => {
        it('should handle lockdown command with multiple permissions', async () => {
            @Command({
                name: 'lockdown',
                description: 'Lock all channels',
            })
            @RequirePermissions(
                Permissions.ManageChannels,
                Permissions.ManageRoles,
                Permissions.Administrator,
            )
            class LockdownCommand extends BaseCommand {
                async run(): Promise<void> {}
            }

            // Registro
            const commandJson = {
                name: 'lockdown',
                description: 'Lock all channels',
            };

            const modifiedJson = await plugin.onBeforeRegisterCommand(LockdownCommand, commandJson);

            const expectedPerms = (
                Permissions.ManageChannels |
                Permissions.ManageRoles |
                Permissions.Administrator
            ).toString();

            expect(modifiedJson.default_member_permissions).toBe(expectedPerms);

            // Ejecución - Usuario es admin (tiene todos los permisos)
            const mockInteraction = createMockInteraction();
            const mockMember = createMockMember();

            Object.defineProperty(mockMember, 'permissions', {
                value: {
                    has: jest.fn().mockReturnValue(true),
                },
                writable: true,
                configurable: true,
            });

            mockInteraction.member = mockMember;

            const ctx = new CommandContext(mockInteraction);
            const command = new LockdownCommand();
            (command as any).ctx = ctx;

            const canExecute = await plugin.onBeforeExecute(command);

            expect(canExecute).toBe(true);
            expect(mockMember.permissions.has).toHaveBeenCalledTimes(3);
        });
    });

    describe('Command without permissions', () => {
        it('should allow commands without @RequirePermissions to execute freely', async () => {
            @Command({
                name: 'ping',
                description: 'Check bot latency',
            })
            class PingCommand extends BaseCommand {
                async run(): Promise<void> {}
            }

            // Registro - no debería modificar el JSON
            const commandJson = {
                name: 'ping',
                description: 'Check bot latency',
            };

            const result = await plugin.onBeforeRegisterCommand(PingCommand, commandJson);

            expect(result).toBeUndefined();

            // Ejecución - debería permitir sin importar permisos
            const mockInteraction = createMockInteraction();
            const mockMember = createMockMember();

            // Usuario sin permisos especiales
            Object.defineProperty(mockMember, 'permissions', {
                value: {
                    has: jest.fn().mockReturnValue(false),
                },
                writable: true,
                configurable: true,
            });

            mockInteraction.member = mockMember;

            const ctx = new CommandContext(mockInteraction);
            const command = new PingCommand();
            (command as any).ctx = ctx;

            const canExecute = await plugin.onBeforeExecute(command);

            expect(canExecute).toBe(true);
            expect(mockMember.permissions.has).not.toHaveBeenCalled();
        });
    });

    describe('Administrator permission', () => {
        it('should handle administrator-only commands', async () => {
            @Command({
                name: 'config',
                description: 'Configure bot settings',
            })
            @RequirePermissions(Permissions.Administrator)
            class ConfigCommand extends BaseCommand {
                async run(): Promise<void> {}
            }

            // Registro
            const commandJson = {
                name: 'config',
                description: 'Configure bot settings',
            };

            const modifiedJson = await plugin.onBeforeRegisterCommand(ConfigCommand, commandJson);

            expect(modifiedJson.default_member_permissions).toBe(
                Permissions.Administrator.toString(),
            );

            // Ejecución con admin
            const mockInteraction = createMockInteraction();
            const mockMember = createMockMember();

            Object.defineProperty(mockMember, 'permissions', {
                value: {
                    has: jest.fn().mockImplementation((perm) => {
                        return perm === Permissions.Administrator;
                    }),
                },
                writable: true,
                configurable: true,
            });

            mockInteraction.member = mockMember;

            const ctx = new CommandContext(mockInteraction);
            const command = new ConfigCommand();
            (command as any).ctx = ctx;

            const canExecute = await plugin.onBeforeExecute(command);

            expect(canExecute).toBe(true);
        });

        it('should deny non-administrators from admin commands', async () => {
            @Command({
                name: 'dangerous',
                description: 'Dangerous command',
            })
            @RequirePermissions(Permissions.Administrator)
            class DangerousCommand extends BaseCommand {
                async run(): Promise<void> {}
            }

            const mockInteraction = createMockInteraction();
            const mockMember = createMockMember();

            // Usuario normal sin admin
            Object.defineProperty(mockMember, 'permissions', {
                value: {
                    has: jest.fn().mockReturnValue(false),
                },
                writable: true,
                configurable: true,
            });

            mockInteraction.member = mockMember;

            const ctx = new CommandContext(mockInteraction);
            const command = new DangerousCommand();
            (command as any).ctx = ctx;
            (command as any).getEmbed = jest.fn().mockReturnValue({
                setTitle: jest.fn().mockReturnThis(),
                setDescription: jest.fn().mockReturnThis(),
            });
            (command as any).reply = jest.fn().mockResolvedValue(undefined);

            const canExecute = await plugin.onBeforeExecute(command);

            expect(canExecute).toBe(false);
            expect((command as any).reply).toHaveBeenCalledWith({
                embeds: [expect.any(Object)],
            });
        });
    });

    describe('Real-world scenarios', () => {
        it('should handle moderation command suite', async () => {
            @Command({ name: 'ban', description: 'Ban user' })
            @RequirePermissions(Permissions.BanMembers)
            class BanCommand extends BaseCommand {
                async run(): Promise<void> {}
            }

            @Command({ name: 'kick', description: 'Kick user' })
            @RequirePermissions(Permissions.KickMembers)
            class KickCommand extends BaseCommand {
                async run(): Promise<void> {}
            }

            @Command({ name: 'timeout', description: 'Timeout user' })
            @RequirePermissions(Permissions.ModerateMembers)
            class TimeoutCommand extends BaseCommand {
                async run(): Promise<void> {}
            }

            // Moderador con kick y timeout, pero sin ban
            const mockInteraction = createMockInteraction();
            const mockMember = createMockMember();

            Object.defineProperty(mockMember, 'permissions', {
                value: {
                    has: jest.fn().mockImplementation((perm) => {
                        return (
                            perm === Permissions.KickMembers || perm === Permissions.ModerateMembers
                        );
                    }),
                },
                writable: true,
                configurable: true,
            });

            mockInteraction.member = mockMember;
            const ctx = new CommandContext(mockInteraction);

            // Kick - Debería funcionar
            const kickCommand = new KickCommand();
            (kickCommand as any).ctx = ctx;
            const canKick = await plugin.onBeforeExecute(kickCommand);
            expect(canKick).toBe(true);

            // Timeout - Debería funcionar
            const timeoutCommand = new TimeoutCommand();
            (timeoutCommand as any).ctx = ctx;
            const canTimeout = await plugin.onBeforeExecute(timeoutCommand);
            expect(canTimeout).toBe(true);

            // Ban - NO debería funcionar
            const banCommand = new BanCommand();
            (banCommand as any).ctx = ctx;
            (banCommand as any).getEmbed = jest.fn().mockReturnValue({
                setTitle: jest.fn().mockReturnThis(),
                setDescription: jest.fn().mockReturnThis(),
            });
            (banCommand as any).reply = jest.fn().mockResolvedValue(undefined);
            const canBan = await plugin.onBeforeExecute(banCommand);
            expect(canBan).toBe(false);
        });
    });
});
