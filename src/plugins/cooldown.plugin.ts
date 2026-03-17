import { metadataHandler } from '@/core/metadata';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { BasePlugin } from '@/core/structures/BasePlugin';
import { CustomDate } from '@/utils/Times';

export class CooldownPlugin extends BasePlugin {
    private cooldowns: Map<string, number>;

    constructor() {
        super();
        this.cooldowns = new Map();
    }

    async onBeforeExecute(command: BaseCommand): Promise<boolean> {
        const cooldownKey = `${command.user.id}-${command.id}`;
        const cooldown = this.cooldowns.get(cooldownKey);
        if (!cooldown) return true;

        if (cooldown < Date.now()) {
            this.cooldowns.delete(cooldownKey);
            return true;
        } else {
            const date = new CustomDate(cooldown);
            const embed = command
                .getEmbed('error')
                .setDescription(
                    `Espera hasta ${date.toDiscordTimestamp('T')} para usar este comando`,
                );
            await command.reply({ embeds: [embed] });
            return false;
        }
    }

    async onAfterExecute(command: BaseCommand): Promise<any> {
        const cooldownKey = `${command.user.id}-${command.id}`;
        const opt = metadataHandler.getCooldown(command.constructor);
        const cooldown = Date.now() + (opt?.time || 0);

        this.cooldowns.set(cooldownKey, cooldown);
    }
}
