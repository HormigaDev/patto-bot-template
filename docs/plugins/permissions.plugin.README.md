# PermissionsPlugin

## 📖 Descripción

Plugin que gestiona los **permisos requeridos** para ejecutar comandos. Trabaja en conjunto con el decorador `@RequirePermissions` para validar permisos tanto en Discord (ocultando comandos) como en ejecución (doble validación).

## 🎯 Funcionalidad

### 🟦 Fase de Registro (`onBeforeRegisterCommand`)

Durante el registro de comandos en Discord:

1. Lee la metadata de `@RequirePermissions` del comando
2. Combina todos los permisos requeridos con operador bitwise OR
3. Agrega el campo `default_member_permissions` al JSON del comando
4. Discord automáticamente **oculta el comando** a usuarios sin permisos

**Resultado**: Los usuarios solo ven comandos para los que tienen permisos.

### 🔵 Fase de Ejecución (`onBeforeExecute`)

Cuando un usuario intenta ejecutar un comando:

1. Lee la metadata de `@RequirePermissions` del comando
2. Verifica que el usuario tenga **todos** los permisos requeridos
3. Si falta algún permiso:
    - Muestra un embed de error
    - Cancela la ejecución del comando
4. Si tiene todos los permisos:
    - Continúa con la ejecución normal

**Resultado**: Validación adicional por seguridad (en caso de cambios de permisos en tiempo real).

## 🔧 Uso

### 1. Registrar el Plugin

En `/src/config/plugins.config.ts`:

```typescript
import { PluginRegistry, PluginScope } from './plugin.registry';
import { PermissionsPlugin } from '@/plugins/permissions.plugin';

// Aplicar a TODOS los comandos
PluginRegistry.register({
    plugin: new PermissionsPlugin(),
    scope: PluginScope.DeepFolder,
    folderPath: '', // Raíz = todos los comandos
});
```

### 2. Usar el Decorador en Comandos

```typescript
import { Command } from '@/core/decorators/command.decorator';
import { RequirePermissions } from '@/core/decorators/permission.decorator';
import { Permissions } from '@/utils/Permissions';
import { BaseCommand } from '@/core/structures/BaseCommand';

@Command({
    name: 'ban',
    description: 'Banea un usuario del servidor',
})
@RequirePermissions(Permissions.BanMembers)
export class BanCommand extends BaseCommand {
    async run(): Promise<void> {
        // El usuario YA fue validado
        // Implementa tu lógica aquí
    }
}
```

## 📝 Ejemplos

### Ejemplo 1: Comando Simple con Un Permiso

```typescript
@Command({
    name: 'clear',
    description: 'Elimina mensajes del canal',
})
@RequirePermissions(Permissions.ManageMessages)
export class ClearCommand extends BaseCommand {
    @Arg({
        name: 'cantidad',
        description: 'Cantidad de mensajes a eliminar',
        index: 0,
        required: true,
    })
    public cantidad!: number;

    async run(): Promise<void> {
        // Usuario ya tiene permiso ManageMessages
        await this.channel!.bulkDelete(this.cantidad);

        const embed = this.getEmbed('success')
            .setTitle('✅ Mensajes Eliminados')
            .setDescription(`Se eliminaron ${this.cantidad} mensajes`);

        await this.reply({ embeds: [embed] });
    }
}
```

### Ejemplo 2: Comando con Múltiples Permisos

```typescript
@Command({
    name: 'lockdown',
    description: 'Bloquea todos los canales del servidor',
})
@RequirePermissions(Permissions.ManageChannels, Permissions.ManageRoles, Permissions.Administrator)
export class LockdownCommand extends BaseCommand {
    async run(): Promise<void> {
        // Usuario tiene TODOS los permisos requeridos
        const channels = await this.guild!.channels.fetch();

        for (const [, channel] of channels) {
            if (channel?.isTextBased()) {
                await channel.permissionOverwrites.edit(this.guild!.roles.everyone, {
                    SendMessages: false,
                });
            }
        }

        const embed = this.getEmbed('warning')
            .setTitle('🔒 Servidor Bloqueado')
            .setDescription('Todos los canales han sido bloqueados');

        await this.reply({ embeds: [embed] });
    }
}
```

### Ejemplo 3: Comando Solo para Administradores

```typescript
@Command({
    name: 'config',
    description: 'Configura el bot en el servidor',
})
@RequirePermissions(Permissions.Administrator)
export class ConfigCommand extends BaseCommand {
    async run(): Promise<void> {
        // Solo administradores pueden llegar aquí
        // Tu lógica de configuración...
    }
}
```

## 🔍 Cómo Funciona Internamente

### Fase de Registro

```typescript
async onBeforeRegisterCommand(
    commandClass: new (...args: any[]) => BaseCommand,
    commandJson: any,
): Promise<any | false | null | undefined> {
    // 1. Leer metadata del decorador
    const metadata = Reflect.getMetadata(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        commandClass
    ) as bigint[] | undefined;

    // 2. Si hay permisos definidos
    if (metadata) {
        // 3. Combinar permisos con OR bitwise
        const combinedPerms = metadata.reduce((a, b) => a | b, BigInt(0));

        // 4. Crear NUEVO objeto con permisos agregados (inmutabilidad)
        const modifiedJson = {
            ...commandJson,
            default_member_permissions: combinedPerms.toString(),
        };

        // 5. Retornar JSON modificado (el original NO es mutado)
        return modifiedJson;
    }

    // Sin metadata = no modificar
    return undefined;
}
```

### Fase de Ejecución

```typescript
async onBeforeExecute(command: BaseCommand): Promise<boolean> {
    // 1. Leer metadata del comando
    const requiredPermissions = Reflect.getMetadata(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        command.constructor,
    ) as bigint[] | undefined;

    // 2. Si hay permisos definidos
    if (requiredPermissions) {
        const member = command.ctx.member;

        // 3. Verificar cada permiso
        for (const permission of requiredPermissions) {
            if (!member.permissions.has(permission)) {
                // 4. Usuario no tiene permiso
                const embed = command.getEmbed('error')
                    .setTitle('Permisos insuficientes')
                    .setDescription('No tienes los permisos necesarios para ejecutar este comando.');

                await command.reply({ embeds: [embed] });
                return false; // Cancelar ejecución
            }
        }
    }

    // 5. Usuario tiene todos los permisos
    return true;
}
```

## ✅ Ventajas

| Característica            | Beneficio                              |
| ------------------------- | -------------------------------------- |
| **Validación en Discord** | Comandos solo aparecen si hay permisos |
| **Validación doble**      | Seguridad extra en ejecución           |
| **Sin boilerplate**       | No necesitas validar en cada comando   |
| **Embeds claros**         | Mensajes visuales de error             |
| **Bitwise OR**            | Combina permisos automáticamente       |
| **Type-safe**             | Autocompletado con TypeScript          |
| **Flexible**              | Uno o múltiples permisos               |
| **Centralizado**          | Lógica de permisos en un solo lugar    |

## 🔒 Seguridad

### ¿Por qué doble validación?

1. **Validación en Discord** (`default_member_permissions`):

    - Oculta comandos visualmente
    - Usuario no puede ni verlos
    - Mejora UX (no muestra comandos inaccesibles)

2. **Validación en ejecución** (`onBeforeExecute`):
    - Protección extra por seguridad
    - En caso de:
        - Comandos de texto (sin validación Discord)
        - Cambios de permisos en tiempo real
        - Exploits o bugs de Discord
        - Caché desactualizado

**Resultado**: Máxima seguridad con ambas capas de validación.

## 🎨 Personalización

Si necesitas personalizar el comportamiento, puedes extender el plugin:

```typescript
import { PermissionsPlugin } from '@/plugins/permissions.plugin';
import { BaseCommand } from '@/core/structures/BaseCommand';

export class CustomPermissionsPlugin extends PermissionsPlugin {
    // Personalizar mensaje de error
    async onBeforeExecute(command: BaseCommand): Promise<boolean> {
        const requiredPermissions = Reflect.getMetadata(
            REQUIRE_PERMISSIONS_METADATA_KEY,
            command.constructor,
        ) as bigint[] | undefined;

        if (requiredPermissions) {
            const member = command.ctx.member;
            const missingPerms: string[] = [];

            for (const permission of requiredPermissions) {
                if (!member.permissions.has(permission)) {
                    // Agregar nombre del permiso faltante
                    missingPerms.push(this.getPermissionName(permission));
                }
            }

            if (missingPerms.length > 0) {
                const embed = command
                    .getEmbed('error')
                    .setTitle('❌ Permisos Insuficientes')
                    .setDescription(
                        `Te faltan los siguientes permisos:\n${missingPerms
                            .map((p) => `• ${p}`)
                            .join('\n')}`,
                    )
                    .setFooter({ text: 'Contacta a un administrador' });

                await command.reply({ embeds: [embed] });
                return false;
            }
        }

        return true;
    }

    private getPermissionName(permission: bigint): string {
        // Mapear bigint a nombre legible
        // Implementación custom...
        return 'Permiso Desconocido';
    }
}
```

## 📚 Referencias

-   **Decorador**: [`@RequirePermissions`](/src/core/decorators/README.md#-decorador-requirepermissions)
-   **Permisos**: [`Permissions`](/src/utils/README.md#-permissionsts)
-   **BasePlugin**: [`BasePlugin`](/src/core/structures/README.md#-baseplugin)
-   **Discord Permissions**: [Discord.js Permissions Guide](https://discord.js.org/#/docs/discord.js/main/class/PermissionsBitField)

## 🧪 Testing

El plugin incluye tests completos que verifican su correcto funcionamiento:

### Tests Unitarios

Ubicación: `/tests/unit/plugins/permissions.plugin.test.ts`

Cobertura:

-   ✅ Registro sin permisos (no modifica JSON)
-   ✅ Registro con un permiso
-   ✅ Registro con múltiples permisos (combinación bitwise)
-   ✅ Permiso de administrador
-   ✅ Inmutabilidad del commandJson original
-   ✅ Ejecución sin permisos requeridos
-   ✅ Ejecución con permisos válidos
-   ✅ Denegación cuando faltan permisos
-   ✅ Validación de todos los permisos requeridos
-   ✅ Early exit en primer permiso faltante

### Tests de Integración

Ubicación: `/tests/integration/plugins/permissions.plugin.test.ts`

Escenarios:

-   ✅ Flujo completo: registro → ejecución
-   ✅ Cambio de permisos entre registro y ejecución
-   ✅ Comandos con múltiples permisos (lockdown)
-   ✅ Comandos sin decorador @RequirePermissions
-   ✅ Comandos solo para administradores
-   ✅ Suite de moderación completa (ban/kick/timeout)

### Ejecutar Tests

```bash
# Todos los tests del plugin
npm test -- permissions.plugin.test.ts

# Solo tests unitarios
npm test -- tests/unit/plugins/permissions.plugin.test.ts

# Solo tests de integración
npm test -- tests/integration/plugins/permissions.plugin.test.ts
```

### Ejemplo de Test

```typescript
it('should deny execution when user lacks required permission', async () => {
    @Command({ name: 'ban', description: 'Ban user' })
    @RequirePermissions(Permissions.BanMembers)
    class BanCommand extends BaseCommand {
        async run(): Promise<void> {}
    }

    const plugin = new PermissionsPlugin();

    // Mock member sin permisos
    const mockCommand = {
        constructor: BanCommand,
        ctx: {
            member: {
                permissions: {
                    has: jest.fn().mockReturnValue(false),
                },
            },
        },
        getEmbed: jest.fn().mockReturnValue({
            setTitle: jest.fn().mockReturnThis(),
            setDescription: jest.fn().mockReturnThis(),
        }),
        reply: jest.fn(),
    };

    const canExecute = await plugin.onBeforeExecute(mockCommand as any);

    expect(canExecute).toBe(false);
    expect(mockCommand.reply).toHaveBeenCalled();
});
```

## 💡 Tips

1. **Siempre registra el plugin globalmente** para que funcione en todos los comandos
2. **Usa permisos específicos** en lugar de `Administrator` cuando sea posible
3. **Combina con otros plugins** para validaciones adicionales (roles, cooldowns, etc.)
4. **Verifica permisos del bot** antes de ejecutar acciones que los requieran
5. **Testea comandos** con diferentes roles para verificar funcionamiento
6. **El plugin NO muta el commandJson original** - retorna una copia modificada

---

**🎯 Con este plugin, tus comandos siempre estarán protegidos con permisos de Discord correctamente validados!**
