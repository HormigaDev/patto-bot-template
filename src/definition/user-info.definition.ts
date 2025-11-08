import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { CommandCategoryTag } from '@/utils/CommandCategories';
import { User } from 'discord.js';

/**
 * Subcomando: user info
 * Muestra información de un usuario
 */
@Command({
    name: 'user info',
    description: 'Muestra información detallada de un usuario',
    category: CommandCategoryTag.Info,
})
export abstract class UserInfoDefinition extends BaseCommand {
    @Arg({
        name: 'usuario',
        description: 'El usuario del que quieres ver información',
        index: 0,
    })
    targetUser?: User;
}
