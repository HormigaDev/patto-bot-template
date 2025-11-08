import { Arg } from '@/core/decorators/argument.decorator';
import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { CommandCategoryTag } from '@/utils/CommandCategories';
import { User } from 'discord.js';

/**
 * Subcomando: user avatar
 * Muestra el avatar de un usuario
 */
@Command({
    name: 'user avatar',
    description: 'Muestra el avatar de un usuario',
    category: CommandCategoryTag.Info,
})
export abstract class UserAvatarDefinition extends BaseCommand {
    @Arg({
        name: 'usuario',
        description: 'El usuario del que quieres ver el avatar',
        index: 0,
    })
    targetUser?: User;
}
