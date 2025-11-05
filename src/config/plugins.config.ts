import { PluginRegistry, PluginScope } from './plugin.registry';

// Aquí defines tus plugins con sus scopes

/**
 * Ejemplo 1: Aplicar plugin a TODOS los comandos
 */
// PluginRegistry.register({
//     plugin: new CooldownPlugin(),
//     scope: PluginScope.DeepFolder,
//     folderPath: '', // Raíz = todos los comandos
// });

/**
 * Ejemplo 2: Aplicar plugin solo a comandos en /src/commands/admin/
 * (no incluye subcarpetas)
 */
// PluginRegistry.register({
//     plugin: new RolePermissionPlugin(),
//     scope: PluginScope.Folder,
//     folderPath: 'admin',
// });

/**
 * Ejemplo 3: Aplicar plugin a comandos en /src/commands/moderation/
 * y todas sus subcarpetas
 */
// PluginRegistry.register({
//     plugin: new CommandLoggerPlugin(),
//     scope: PluginScope.DeepFolder,
//     folderPath: 'moderation',
// });

/**
 * Ejemplo 4: Aplicar plugin a comandos específicos
 */
// import { BanCommand } from '@/commands/ban.command';
// import { KickCommand } from '@/commands/kick.command';
//
// PluginRegistry.register({
//     plugin: new AuditLogPlugin(),
//     scope: PluginScope.Specified,
//     commands: [BanCommand, KickCommand],
// });

/**
 * IMPORTANTE:
 * - Los plugins se ejecutan en el ORDEN que los registres aquí
 * - onBeforeExecute se ejecuta en orden normal
 * - onAfterExecute se ejecuta en orden INVERSO
 * - Los plugins de @UsePlugins se ejecutan ANTES que estos
 */

// Registra tus plugins aquí:
// PluginRegistry.register({ ... });
