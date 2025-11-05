import { Message } from 'discord.js';
import { CommandContext } from '@/core/structures/CommandContext';

export class TypeResolver {
    /**
     * Coerce raw values to their expected types (String, Number, Boolean, Array)
     */
    static coerceType(rawValue: any, designType: Function): { value?: any; error?: string } {
        const typeName = designType.name.toLowerCase();

        if (typeName === 'string') {
            return { value: String(rawValue) };
        }

        if (typeName === 'number') {
            const num = Number(rawValue);
            if (isNaN(num)) {
                return { error: 'Debe ser un número.' };
            }
            return { value: num };
        }

        if (typeName === 'boolean') {
            if (typeof rawValue === 'boolean') return { value: rawValue };

            const positiveRegex = /^(?:yes|s[ií])$/iu;
            if (positiveRegex.test(rawValue)) {
                return { value: true };
            }

            return { value: ['true', 't', '1'].includes(String(rawValue).toLowerCase()) };
        }

        if (typeName === 'array') {
            if (typeof rawValue === 'string') {
                const arr = rawValue
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                return { value: arr };
            }
            if (Array.isArray(rawValue)) {
                return { value: rawValue };
            }
            return { error: 'Debe ser un array (o string separada por comas).' };
        }

        // Para otros tipos, solo verificar si ya es una instancia válida
        // Esto cubre casos donde Discord.js ya resolvió el tipo (User, Channel, etc.)
        if (rawValue instanceof designType) {
            return { value: rawValue };
        }

        // Si no es ningún tipo conocido, intentar devolver el valor tal cual
        // para que sea manejado por la lógica específica de Discord types
        return { value: rawValue };
    }

    /**
     * Resuelve tipos de Discord (User, Channel, Role, Member) desde menciones o IDs
     */
    static async resolveDiscordType(
        rawValue: string,
        typeName: string,
        msg: Message,
        ctx: CommandContext,
    ): Promise<any> {
        const value = String(rawValue);

        switch (typeName) {
            case 'user': {
                // Formato: <@123456789> o <@!123456789> (con nickname)
                const userMentionMatch = value.match(/^<@!?(\d+)>$/);
                if (userMentionMatch) {
                    const userId = userMentionMatch[1];
                    return (
                        msg.mentions.users.get(userId) ||
                        (await ctx.client.users.fetch(userId).catch(() => null))
                    );
                }

                // ID directo
                if (/^\d+$/.test(value)) {
                    return await ctx.client.users.fetch(value).catch(() => null);
                }

                return null;
            }

            case 'member': {
                // Formato: <@123456789> o <@!123456789>
                const memberMentionMatch = value.match(/^<@!?(\d+)>$/);
                if (memberMentionMatch) {
                    const memberId = memberMentionMatch[1];
                    return (
                        msg.mentions.members?.get(memberId) ||
                        (await ctx.guild.members.fetch(memberId).catch(() => null))
                    );
                }

                // ID directo
                if (/^\d+$/.test(value)) {
                    return await ctx.guild.members.fetch(value).catch(() => null);
                }

                return null;
            }

            case 'role': {
                // Formato: <@&123456789>
                const roleMentionMatch = value.match(/^<@&(\d+)>$/);
                if (roleMentionMatch) {
                    const roleId = roleMentionMatch[1];
                    return (
                        msg.mentions.roles.get(roleId) ||
                        (await ctx.guild.roles.fetch(roleId).catch(() => null))
                    );
                }

                // ID directo
                if (/^\d+$/.test(value)) {
                    return await ctx.guild.roles.fetch(value).catch(() => null);
                }

                return null;
            }

            case 'channel': {
                // Formato: <#123456789>
                const channelMentionMatch = value.match(/^<#(\d+)>$/);
                if (channelMentionMatch) {
                    const channelId = channelMentionMatch[1];
                    return (
                        msg.mentions.channels.get(channelId) ||
                        (await ctx.client.channels.fetch(channelId).catch(() => null))
                    );
                }

                // ID directo
                if (/^\d+$/.test(value)) {
                    return await ctx.client.channels.fetch(value).catch(() => null);
                }

                return null;
            }

            default:
                return null;
        }
    }
}
