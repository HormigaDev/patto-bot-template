import { Command } from '@/core/decorators/command.decorator';
import { BaseCommand } from '@/core/structures/BaseCommand';
import { CommandCategoryTag } from '@/utils/CommandCategories';

@Command({
    name: 'ping',
    description: 'Muestra la latencia del bot',
    aliases: ['latencia', 'pong'],
    category: CommandCategoryTag.Info,
})
export class PingCommand extends BaseCommand {
    async run(): Promise<void> {
        const embed = this.getEmbed('success')
            .setTitle('🏓 Pong!')
            .setDescription(`Latencia \`${this.ctx.client.ws.ping}ms\``);
        await this.send({ embeds: [embed] });
    }
}
