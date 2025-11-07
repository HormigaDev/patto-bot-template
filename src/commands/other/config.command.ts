import { ConfigDefinition } from '@/definition/config.definition';

/**
 * Comando config con subcomandos
 * Implementación unificada
 */
export class ConfigCommand extends ConfigDefinition {
    // Simulación de configuración en memoria
    private static config = new Map<string, string>([
        ['prefix', '!'],
        ['language', 'es'],
        ['timezone', 'UTC'],
    ]);

    /**
     * Subcomando: config get <clave>
     * Obtiene el valor de una configuración
     */
    async subcommandGet(): Promise<void> {
        const value = ConfigCommand.config.get(this.key);

        if (!value) {
            const embed = this.getEmbed('error')
                .setTitle('Configuración no encontrada')
                .setDescription(`No existe la clave de configuración \`${this.key}\`.`);

            await this.reply({ embeds: [embed] });
            return;
        }

        const embed = this.getEmbed('success')
            .setTitle('Configuración')
            .addFields(
                { name: 'Clave', value: `\`${this.key}\``, inline: true },
                { name: 'Valor', value: `\`${value}\``, inline: true },
            );

        await this.reply({ embeds: [embed] });
    }

    /**
     * Subcomando: config set <clave> <valor>
     * Establece el valor de una configuración
     */
    async subcommandSet(): Promise<void> {
        if (!this.value) {
            const embed = this.getEmbed('error')
                .setTitle('Valor requerido')
                .setDescription('Debes especificar un valor para la configuración.');

            await this.reply({ embeds: [embed] });
            return;
        }

        ConfigCommand.config.set(this.key, this.value);

        const embed = this.getEmbed('success')
            .setTitle('Configuración actualizada')
            .setDescription(`Se ha establecido \`${this.key}\` = \`${this.value}\``);

        await this.reply({ embeds: [embed] });
    }

    /**
     * Subcomando: config list
     * Lista todas las configuraciones
     */
    async subcommandList(): Promise<void> {
        const configEntries = Array.from(ConfigCommand.config.entries());

        if (configEntries.length === 0) {
            const embed = this.getEmbed('info')
                .setTitle('Configuración')
                .setDescription('*No hay configuraciones establecidas*');

            await this.reply({ embeds: [embed] });
            return;
        }

        const configText = configEntries
            .map(([key, value]) => `**${key}**: \`${value}\``)
            .join('\n');

        const embed = this.getEmbed('info')
            .setTitle('Configuración del Bot')
            .setDescription(configText);

        await this.reply({ embeds: [embed] });
    }
}
