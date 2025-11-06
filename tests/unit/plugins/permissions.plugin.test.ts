/**
 * Tests unitarios para PermissionsPlugin
 */

import { PermissionsPlugin } from '@/plugins/permissions.plugin';
import { REQUIRE_PERMISSIONS_METADATA_KEY } from '@/core/decorators/permission.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { Permissions } from '@/utils/Permissions';
import 'reflect-metadata';

describe('PermissionsPlugin', () => {
    let plugin: PermissionsPlugin;

    beforeEach(() => {
        plugin = new PermissionsPlugin();
    });

    describe('onBeforeRegisterCommand', () => {
        it('no debería modificar el JSON del comando cuando no hay permisos definidos', async () => {
            class TestCommand extends BaseCommand {
                async run() {}
            }

            const commandJson = {
                name: 'test',
                description: 'Test command',
            };

            const result = await plugin.onBeforeRegisterCommand(TestCommand, commandJson);

            expect(result).toBeUndefined();
        });

        it('debería agregar default_member_permissions para un solo permiso', async () => {
            class TestCommand extends BaseCommand {
                async run() {}
            }

            // Simular decorador @RequirePermissions
            Reflect.defineMetadata(
                REQUIRE_PERMISSIONS_METADATA_KEY,
                [Permissions.BanMembers],
                TestCommand,
            );

            const commandJson = {
                name: 'ban',
                description: 'Ban a user',
            };

            const result = await plugin.onBeforeRegisterCommand(TestCommand, commandJson);

            expect(result).toBeDefined();
            expect(result.default_member_permissions).toBe(Permissions.BanMembers.toString());
            expect(result.name).toBe('ban');
            expect(result.description).toBe('Ban a user');
        });

        it('debería combinar múltiples permisos con OR bit a bit', async () => {
            class TestCommand extends BaseCommand {
                async run() {}
            }

            const permissions = [Permissions.BanMembers, Permissions.KickMembers];
            const expected = (Permissions.BanMembers | Permissions.KickMembers).toString();

            Reflect.defineMetadata(REQUIRE_PERMISSIONS_METADATA_KEY, permissions, TestCommand);

            const commandJson = {
                name: 'moderate',
                description: 'Moderate users',
            };

            const result = await plugin.onBeforeRegisterCommand(TestCommand, commandJson);

            expect(result).toBeDefined();
            expect(result.default_member_permissions).toBe(expected);
        });

        it('debería manejar el permiso Administrator correctamente', async () => {
            class TestCommand extends BaseCommand {
                async run() {}
            }

            Reflect.defineMetadata(
                REQUIRE_PERMISSIONS_METADATA_KEY,
                [Permissions.Administrator],
                TestCommand,
            );

            const commandJson = {
                name: 'config',
                description: 'Configure bot',
            };

            const result = await plugin.onBeforeRegisterCommand(TestCommand, commandJson);

            expect(result).toBeDefined();
            expect(result.default_member_permissions).toBe(Permissions.Administrator.toString());
        });

        it('no debería mutar el commandJson original', async () => {
            class TestCommand extends BaseCommand {
                async run() {}
            }

            Reflect.defineMetadata(
                REQUIRE_PERMISSIONS_METADATA_KEY,
                [Permissions.ManageMessages],
                TestCommand,
            );

            const commandJson = {
                name: 'clear',
                description: 'Clear messages',
            };

            const originalJson = { ...commandJson };

            await plugin.onBeforeRegisterCommand(TestCommand, commandJson);

            // El JSON original pasado debe seguir igual (el plugin recibe una copia)
            expect(commandJson).toEqual(originalJson);
        });
    });

    describe('onBeforeExecute', () => {
        it('debería permitir la ejecución cuando no se requieren permisos', async () => {
            class TestCommand extends BaseCommand {
                async run() {}
            }

            const mockCommand = {
                constructor: TestCommand,
                ctx: {
                    member: {
                        permissions: {
                            has: jest.fn().mockReturnValue(true),
                        },
                    },
                },
                getEmbed: jest.fn(),
                reply: jest.fn(),
            } as any;

            const result = await plugin.onBeforeExecute(mockCommand);

            expect(result).toBe(true);
        });

        it('debería permitir la ejecución cuando el usuario tiene el permiso requerido', async () => {
            class TestCommand extends BaseCommand {
                async run() {}
            }

            Reflect.defineMetadata(
                REQUIRE_PERMISSIONS_METADATA_KEY,
                [Permissions.ManageMessages],
                TestCommand,
            );

            const mockCommand = {
                constructor: TestCommand,
                ctx: {
                    member: {
                        permissions: {
                            has: jest.fn().mockReturnValue(true),
                        },
                    },
                },
                getEmbed: jest.fn(),
                reply: jest.fn(),
            } as any;

            const result = await plugin.onBeforeExecute(mockCommand);

            expect(result).toBe(true);
            expect(mockCommand.ctx.member.permissions.has).toHaveBeenCalledWith(
                Permissions.ManageMessages,
            );
        });

        it('debería denegar la ejecución cuando el usuario no tiene el permiso requerido', async () => {
            class TestCommand extends BaseCommand {
                async run() {}
            }

            Reflect.defineMetadata(
                REQUIRE_PERMISSIONS_METADATA_KEY,
                [Permissions.BanMembers],
                TestCommand,
            );

            const mockEmbed = {
                setTitle: jest.fn().mockReturnThis(),
                setDescription: jest.fn().mockReturnThis(),
            };

            const mockCommand = {
                constructor: TestCommand,
                ctx: {
                    member: {
                        permissions: {
                            has: jest.fn().mockReturnValue(false),
                        },
                    },
                },
                getEmbed: jest.fn().mockReturnValue(mockEmbed),
                reply: jest.fn().mockResolvedValue(undefined),
            } as any;

            const result = await plugin.onBeforeExecute(mockCommand);

            expect(result).toBe(false);
            expect(mockCommand.getEmbed).toHaveBeenCalledWith('error');
            expect(mockEmbed.setTitle).toHaveBeenCalledWith('Permisos insuficientes');
            expect(mockEmbed.setDescription).toHaveBeenCalledWith(
                'No tienes los permisos necesarios para ejecutar este comando.',
            );
            expect(mockCommand.reply).toHaveBeenCalledWith({ embeds: [mockEmbed] });
        });

        it('debería denegar la ejecución si al usuario le falta CUALQUIERA de los múltiples permisos requeridos', async () => {
            class TestCommand extends BaseCommand {
                async run() {}
            }

            const permissions = [Permissions.BanMembers, Permissions.KickMembers];
            Reflect.defineMetadata(REQUIRE_PERMISSIONS_METADATA_KEY, permissions, TestCommand);

            const mockEmbed = {
                setTitle: jest.fn().mockReturnThis(),
                setDescription: jest.fn().mockReturnThis(),
            };

            const mockCommand = {
                constructor: TestCommand,
                ctx: {
                    member: {
                        permissions: {
                            // Tiene BanMembers pero no KickMembers
                            has: jest.fn().mockImplementation((perm) => {
                                return perm === Permissions.BanMembers;
                            }),
                        },
                    },
                },
                getEmbed: jest.fn().mockReturnValue(mockEmbed),
                reply: jest.fn().mockResolvedValue(undefined),
            } as any;

            const result = await plugin.onBeforeExecute(mockCommand);

            expect(result).toBe(false);
            expect(mockCommand.ctx.member.permissions.has).toHaveBeenCalledTimes(2);
            expect(mockCommand.reply).toHaveBeenCalled();
        });

        it('debería permitir la ejecución cuando el usuario tiene TODOS los permisos requeridos', async () => {
            class TestCommand extends BaseCommand {
                async run() {}
            }

            const permissions = [
                Permissions.ManageChannels,
                Permissions.ManageRoles,
                Permissions.Administrator,
            ];
            Reflect.defineMetadata(REQUIRE_PERMISSIONS_METADATA_KEY, permissions, TestCommand);

            const mockCommand = {
                constructor: TestCommand,
                ctx: {
                    member: {
                        permissions: {
                            has: jest.fn().mockReturnValue(true),
                        },
                    },
                },
                getEmbed: jest.fn(),
                reply: jest.fn(),
            } as any;

            const result = await plugin.onBeforeExecute(mockCommand);

            expect(result).toBe(true);
            expect(mockCommand.ctx.member.permissions.has).toHaveBeenCalledTimes(3);
            expect(mockCommand.reply).not.toHaveBeenCalled();
        });

        it('debería dejar de verificar permisos después del primer permiso faltante', async () => {
            class TestCommand extends BaseCommand {
                async run() {}
            }

            const permissions = [
                Permissions.BanMembers,
                Permissions.KickMembers,
                Permissions.ManageMessages,
            ];
            Reflect.defineMetadata(REQUIRE_PERMISSIONS_METADATA_KEY, permissions, TestCommand);

            const mockEmbed = {
                setTitle: jest.fn().mockReturnThis(),
                setDescription: jest.fn().mockReturnThis(),
            };

            const mockCommand = {
                constructor: TestCommand,
                ctx: {
                    member: {
                        permissions: {
                            // Primera permission falla
                            has: jest.fn().mockReturnValue(false),
                        },
                    },
                },
                getEmbed: jest.fn().mockReturnValue(mockEmbed),
                reply: jest.fn().mockResolvedValue(undefined),
            } as any;

            const result = await plugin.onBeforeExecute(mockCommand);

            expect(result).toBe(false);
            // Solo verifica el primer permiso antes de fallar
            expect(mockCommand.ctx.member.permissions.has).toHaveBeenCalledTimes(1);
            expect(mockCommand.ctx.member.permissions.has).toHaveBeenCalledWith(
                Permissions.BanMembers,
            );
        });
    });

    describe('integración con el decorador @RequirePermissions', () => {
        it('debería leer los metadatos establecidos por el decorador', async () => {
            class DecoratedCommand extends BaseCommand {
                async run() {}
            }

            // Simular el comportamiento del decorador
            const permissions = [Permissions.Administrator];
            Reflect.defineMetadata(REQUIRE_PERMISSIONS_METADATA_KEY, permissions, DecoratedCommand);

            const commandJson = {
                name: 'admin',
                description: 'Admin command',
            };

            const result = await plugin.onBeforeRegisterCommand(DecoratedCommand, commandJson);

            expect(result).toBeDefined();
            expect(result.default_member_permissions).toBe(Permissions.Administrator.toString());
        });

        it('debería manejar comandos sin decorador', async () => {
            class NormalCommand extends BaseCommand {
                async run() {}
            }

            const commandJson = {
                name: 'normal',
                description: 'Normal command',
            };

            const result = await plugin.onBeforeRegisterCommand(NormalCommand, commandJson);

            expect(result).toBeUndefined();
        });
    });
});
