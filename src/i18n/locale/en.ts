import type { SupportedLocale } from '../types';
import type { es } from './es';

/**
 * Traducciones al inglés.
 *
 * Tipado como `typeof es` para forzar paridad estructural con el idioma
 * base. Si añades una clave a `es.ts` y no la añades aquí, el build
 * fallará. Si renombras una clave en `es.ts` y no la propagas, también.
 */

const localeNames: Record<SupportedLocale, string> = {
    es: 'Spanish',
    en: 'English',
    pt: 'Portuguese',
};

export const en: typeof es = {
    // ─── system / infrastructure ───────────────────────────────────────
    'system.usage_error.title': 'Usage error',
    'system.error.title': 'Error',
    'system.requested_by': (username) => `Requested by: ${username}`,
    'system.unexpected_error':
        'An unexpected error occurred while processing the command. Please try again later.',
    'system.unexpected_arguments_error': 'An error occurred while processing your arguments.',
    'system.component_action_error': '❌ An error occurred while processing this action.',

    'system.argument.required': (name) => `The \`${name}\` argument is required.`,
    'system.argument.parse_error': (name, reason) => `Failed to parse \`${name}\`: ${reason}`,
    'system.argument.invalid_value': (name, expectedType) =>
        `The \`${name}\` value is invalid. Expected type: \`${expectedType}\``,
    'system.argument.choice_invalid': (name, validOptions) =>
        `\`${name}\` must be one of the valid options: ${validOptions}`,
    'system.argument.discord_type_not_found': (typeName) =>
        `Could not find the specified ${typeName}.`,
    'system.argument.discord_type_not_found_for_value': (typeName, raw) =>
        `Could not find the specified ${typeName}: \`${raw}\``,
    'system.argument.validation_failed': (value) => `Value \`${value}\` is not valid.`,

    'system.self_action.forbidden': 'You cannot run this command on yourself.',
    'system.self_action.bot_forbidden': 'Why would I do that to myself?',

    // ─── CooldownPlugin ────────────────────────────────────────────────
    'cooldown.wait_until': (discordTimestamp) =>
        `Wait until ${discordTimestamp} before using this command again.`,

    // ─── PermissionsPlugin ─────────────────────────────────────────────
    'permissions.insufficient.title': 'Insufficient permissions',
    'permissions.insufficient.description':
        'You do not have the required permissions to run this command.',

    // ─── Categories ────────────────────────────────────────────────────
    'category.info.name': 'Information',
    'category.info.description': 'Commands related to bot and server information.',
    'category.utils.name': 'Utilities',
    'category.utils.description': 'General-purpose utility commands.',
    'category.moderation.name': 'Moderation',
    'category.moderation.description': 'Server moderation commands.',
    'category.settings.name': 'Settings',
    'category.settings.description': 'Bot and server configuration.',
    'category.economy.name': 'Economy',
    'category.economy.description': 'Economy and rewards commands.',
    'category.other.name': 'Other',
    'category.other.description': 'Commands that do not fit any other category.',

    // ─── PingCommand ───────────────────────────────────────────────────
    'ping.command_description': "Shows the bot's latency.",
    'ping.response.title': '🏓 Pong!',
    'ping.response.latency': (ms) => `Latency \`${ms}ms\``,

    // ─── SetLocaleCommand ──────────────────────────────────────────────
    'setlocale.command_description': 'Change the language the bot uses in this server.',
    'setlocale.argument.description': 'Language to use for the bot responses',
    'setlocale.argument.language_label': (locale) => localeNames[locale],
    'setlocale.response.title': 'Language updated',
    'setlocale.response.description': (locale) =>
        `The bot will now reply in **${localeNames[locale]}** in this server.`,
    'setlocale.response.unsupported': (raw) =>
        `Language \`${raw}\` is not supported. Available languages: \`es\`, \`en\`, \`pt\`.`,
    'setlocale.response.same_locale': (locale) =>
        `This server was already configured to **${localeNames[locale]}**.`,
    'setlocale.response.only_in_guild': 'This command can only be used in a server.',

    // ─── HelpCommand ───────────────────────────────────────────────────
    'help.command_description': 'Shows the help of the available commands',
    'help.argument.description': 'The name of the command to get help for',
    'help.root.title': 'Command Help',
    'help.root.description': 'Pick a category from the dropdown to see its commands.',
    'help.select.category_placeholder': 'Pick a category',
    'help.category_empty': '*This category has no commands*',
    'help.command_help.title': (commandTitle) => `Help: ${commandTitle}`,
    'help.command_help.empty_description': '*No description*',
    'help.command_help.usage_label': 'Usage',
    'help.command_help.arguments_label': 'Arguments',
    'help.command_help.aliases_label': 'Aliases',
    'help.command_help.footer_args_legend': '<> = required, [] = optional',
    'help.not_found.title': 'Command not found',
    'help.not_found.description': (name) => `Command \`${name}\` was not found.`,
    'help.expired': 'This interaction has expired.',
    'help.page_of': (current, total) => `Page ${current} of ${total}`,
    'help.previous_button': 'Previous',
    'help.next_button': 'Next',
    'help.subcommand_groups.title': (parentName) => `📚 Help: ${parentName}`,
    'help.subcommand_groups.intro': (parentName) =>
        `The \`${parentName}\` command has the following subcommand groups:`,
    'help.subcommand_groups.entry': (prefix, parent, group, subcommand, description) =>
        `  • \`${prefix}${parent} ${group} ${subcommand}\` - ${description}`,
    'help.subcommand_groups.footer': (prefix, helpCommand, parentName) =>
        `Use ${prefix}${helpCommand} ${parentName} <group> <subcommand> for more information`,
    'help.subcommands.title': (parentName) => `📚 Help: ${parentName}`,
    'help.subcommands.intro': (parentName) =>
        `The \`${parentName}\` command has the following subcommands:`,
    'help.subcommands.entry': (prefix, parent, name, description) =>
        `• \`${prefix}${parent} ${name}\` - ${description}`,
    'help.subcommands.footer': (prefix, helpCommand, parentName) =>
        `Use ${prefix}${helpCommand} ${parentName} <subcommand> for more information`,

    // ─── ColorCommand ──────────────────────────────────────────────────
    'color.command_description': 'Example color picker using a Select menu.',
    'color.prompt.title': '🎨 Color picker',
    'color.prompt.description': 'Pick a color from the menu to see it applied to the embed.',
    'color.select.placeholder': 'Pick a color',
    'color.expired': 'This interaction has expired.',
    'color.only_initiator': 'Only the user who ran the command can use this menu.',
    'color.unknown': 'Unknown color.',
    'color.hex_label': 'Hex',
    'color.red.label': 'Red',
    'color.red.description': 'Warm and intense',
    'color.green.label': 'Green',
    'color.green.description': 'Nature and calm',
    'color.blue.label': 'Blue',
    'color.blue.description': 'Serene and deep',
    'color.yellow.label': 'Yellow',
    'color.yellow.description': 'Vibrant and bright',
    'color.purple.label': 'Purple',
    'color.purple.description': 'Mystical and elegant',

    // ─── FeedbackCommand ───────────────────────────────────────────────
    'feedback.command_description': 'Example feedback form using a Modal.',
    'feedback.prompt.title': '💬 Share your feedback',
    'feedback.prompt.description':
        'Press the button to open a form where you can tell us what you think.',
    'feedback.button.open_label': 'Open form',
    'feedback.invitation_expired': 'This invitation has expired. Run `/feedback` again.',
    'feedback.only_initiator': 'Only the user who ran the command can open this form.',
    'feedback.modal.title': 'Your feedback',
    'feedback.form_expired': 'The form expired before submission.',
    'feedback.subject.label': 'Subject',
    'feedback.subject.placeholder': 'Short summary',
    'feedback.message.label': 'Message',
    'feedback.message.placeholder': 'Tell us what you think…',
    'feedback.received.title': '✅ Feedback received',
    'feedback.received.subject_label': 'Subject',
    'feedback.received.message_label': 'Message',
    'feedback.received.elapsed_label': 'Response time',
    'feedback.received.elapsed_value': (seconds) => `${seconds}s`,
    'feedback.received.sent_by': (tag) => `Sent by ${tag}`,

    // ─── VoteCommand ───────────────────────────────────────────────────
    'vote.command_description': 'Launches an example poll with interactive buttons.',
    'vote.default_question': 'Do you like this template?',
    'vote.expired': 'This poll has expired. Run `/vote` again.',
    'vote.yes_label': 'Yes',
    'vote.no_label': 'No',
    'vote.meh_label': 'Meh',
    'vote.reset_label': 'Reset',
    'vote.total': (count) => `Total: **${count}** vote${count === 1 ? '' : 's'}`,

    // ─── /config get|set ───────────────────────────────────────────────
    'config.command_description': 'Configuration commands',
    'config.get.command_description': 'Gets a configuration value',
    'config.set.command_description': 'Sets a configuration value',
    'config.argument.key': 'The key of the value to look up',
    'config.argument.set_key': 'The key of the value to store',
    'config.argument.value': 'The value to store',
    'config.get.title': 'Configuration',
    'config.get.value': (key, value) => `The value of configuration \`${key}\` is \`${value}\``,
    'config.set.title': 'Configuration set',
    'config.set.value': (key, value) => `Configuration \`${key}\` = \`${value}\` has been set`,
    'config.generic_value': 'Generic data',

    // ─── /server config and /server user ───────────────────────────────
    'server.command_description': 'Server commands',
    'server.config.command_description': 'Server configuration commands',
    'server.config.get.command_description': 'Gets a server configuration value',
    'server.config.set.command_description': 'Sets a server configuration value',
    'server.config.argument.key': 'The key of the configuration to look up',
    'server.config.argument.set_key': 'The key of the value to store',
    'server.config.argument.value': 'The value to store',
    'server.config.get.value': (key, value) =>
        `The value of server configuration \`${key}\` is \`${value}\``,
    'server.config.set.value': (key, value) =>
        `Server configuration \`${key}\` = \`${value}\` has been set`,

    'server.user.command_description': 'Server user commands',
    'server.user.info.command_description': 'Shows information about a user',
    'server.user.info.argument.description': 'The user whose information you want to view',
    'server.user.info.title': (tag) => `User information: ${tag}`,
    'server.user.info.id_label': 'ID',
    'server.user.info.created_at_label': 'Created at',
};
