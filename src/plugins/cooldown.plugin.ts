import { metadataHandler } from '@/core/metadata';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { BasePlugin } from '@/core/structures/BasePlugin';
import { MemoryCooldownStore, type CooldownStore } from '@/core/store/cooldown.store';
import { CustomDate } from '@/utils/Times';

export class CooldownPlugin extends BasePlugin {
    private readonly store: CooldownStore;

    /**
     * @param store Store de cooldowns. Por defecto usa {@link MemoryCooldownStore}
     *              (in-memory, válido para single-instance). Para sharding pasar
     *              un {@link RedisCooldownStore} vía {@link StoreRegistry}.
     */
    constructor(store: CooldownStore = new MemoryCooldownStore()) {
        super();
        this.store = store;
    }

    async onBeforeExecute(command: BaseCommand): Promise<boolean> {
        const cooldownKey = `${command.user.id}-${command.id}`;
        const expiry = await this.store.get(cooldownKey);

        if (expiry === undefined) return true;

        if (expiry < Date.now()) {
            await this.store.delete(cooldownKey);
            return true;
        }

        const date = new CustomDate(expiry);
        const embed = command
            .getEmbed('error')
            .setDescription(`Espera hasta ${date.toDiscordTimestamp('T')} para usar este comando`);
        await command.reply({ embeds: [embed] });
        return false;
    }

    async onAfterExecute(command: BaseCommand): Promise<void> {
        const cooldownKey = `${command.user.id}-${command.id}`;
        const opt = metadataHandler.getCooldown(command.constructor);

        if (!opt?.time || opt.time <= 0) return;
        const expiry = Date.now() + opt.time;

        await this.store.set(cooldownKey, expiry);
    }
}
