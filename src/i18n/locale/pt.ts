import type { SupportedLocale } from '../types';
import type { es } from './es';

/**
 * Traducciones al portugués.
 *
 * Tipado como `typeof es` para forzar paridad estructural con el idioma
 * base. Si añades una clave a `es.ts` y no la añades aquí, el build
 * fallará. Si renombras una clave en `es.ts` y no la propagas, también.
 */

const localeNames: Record<SupportedLocale, string> = {
    es: 'Espanhol',
    en: 'Inglês',
    pt: 'Português',
};

export const pt: typeof es = {
    // ─── system / infraestrutura ───────────────────────────────────────
    'system.usage_error.title': 'Erro de uso',
    'system.error.title': 'Erro',
    'system.requested_by': (username) => `Solicitado por: ${username}`,
    'system.unexpected_error':
        'Ocorreu um erro inesperado ao processar o comando. Tente novamente mais tarde.',
    'system.unexpected_arguments_error': 'Ocorreu um erro ao processar seus argumentos.',
    'system.component_action_error': '❌ Ocorreu um erro ao processar esta ação.',

    'system.argument.required': (name) => `O argumento \`${name}\` é obrigatório.`,
    'system.argument.parse_error': (name, reason) => `Erro ao parsear \`${name}\`: ${reason}`,
    'system.argument.invalid_value': (name, expectedType) =>
        `O valor \`${name}\` é inválido. Tipo esperado: \`${expectedType}\``,
    'system.argument.choice_invalid': (name, validOptions) =>
        `O valor de \`${name}\` deve ser uma das opções válidas: ${validOptions}`,
    'system.argument.discord_type_not_found': (typeName) =>
        `Não foi possível encontrar o ${typeName} especificado.`,
    'system.argument.discord_type_not_found_for_value': (typeName, raw) =>
        `Não foi possível encontrar o ${typeName} especificado: \`${raw}\``,
    'system.argument.validation_failed': (value) => `Valor \`${value}\` não é válido.`,

    'system.self_action.forbidden': 'Você não pode executar este comando sobre você mesmo.',
    'system.self_action.bot_forbidden': 'Por que eu faria isso comigo mesmo?',

    // ─── CooldownPlugin ────────────────────────────────────────────────
    'cooldown.wait_until': (discordTimestamp) =>
        `Aguarde até ${discordTimestamp} para usar este comando novamente.`,

    // ─── PermissionsPlugin ─────────────────────────────────────────────
    'permissions.insufficient.title': 'Permissões insuficientes',
    'permissions.insufficient.description':
        'Você não tem as permissões necessárias para executar este comando.',

    // ─── Categorias ────────────────────────────────────────────────────
    'category.info.name': 'Informação',
    'category.info.description': 'Comandos relacionados às informações do bot e do servidor.',
    'category.utils.name': 'Utilidades',
    'category.utils.description': 'Comandos utilitários gerais.',
    'category.moderation.name': 'Moderação',
    'category.moderation.description': 'Comandos de moderação do servidor.',
    'category.settings.name': 'Configurações',
    'category.settings.description': 'Configuração do bot e do servidor.',
    'category.economy.name': 'Economia',
    'category.economy.description': 'Comandos de economia e recompensas.',
    'category.other.name': 'Outros',
    'category.other.description': 'Comandos que não se encaixam em outras categorias.',

    // ─── PingCommand ───────────────────────────────────────────────────
    'ping.command_description': 'Mostra a latência do bot.',
    'ping.response.title': '🏓 Pong!',
    'ping.response.latency': (ms) => `Latência \`${ms}ms\``,

    // ─── SetLocaleCommand ──────────────────────────────────────────────
    'setlocale.command_description': 'Altera o idioma que o bot usa neste servidor.',
    'setlocale.argument.description': 'Idioma a usar para as respostas do bot',
    'setlocale.argument.language_label': (locale) => localeNames[locale],
    'setlocale.response.title': 'Idioma atualizado',
    'setlocale.response.description': (locale) =>
        `O bot responderá em **${localeNames[locale]}** neste servidor a partir de agora.`,
    'setlocale.response.unsupported': (raw) =>
        `O idioma \`${raw}\` não é suportado. Idiomas disponíveis: \`es\`, \`en\`, \`pt\`.`,
    'setlocale.response.same_locale': (locale) =>
        `Este servidor já estava configurado em **${localeNames[locale]}**.`,

    // ─── HelpCommand ───────────────────────────────────────────────────
    'help.command_description': 'Mostra a ajuda dos comandos disponíveis',
    'help.argument.description': 'O nome do comando para obter ajuda',
    'help.root.title': 'Ajuda dos Comandos',
    'help.root.description': 'Selecione uma categoria no menu para ver seus comandos.',
    'help.select.category_placeholder': 'Selecione uma categoria',
    'help.category_empty': '*Esta categoria não tem comandos*',
    'help.command_help.title': (commandTitle) => `Ajuda: ${commandTitle}`,
    'help.command_help.empty_description': '*Sem descrição*',
    'help.command_help.usage_label': 'Uso',
    'help.command_help.arguments_label': 'Argumentos',
    'help.command_help.aliases_label': 'Apelidos',
    'help.command_help.footer_args_legend': '<> = obrigatório, [] = opcional',
    'help.not_found.title': 'Comando não encontrado',
    'help.not_found.description': (name) => `O comando \`${name}\` não foi encontrado.`,
    'help.expired': 'Esta interação expirou.',
    'help.page_of': (current, total) => `Página ${current} de ${total}`,
    'help.previous_button': 'Anterior',
    'help.next_button': 'Próximo',
    'help.subcommand_groups.title': (parentName) => `📚 Ajuda: ${parentName}`,
    'help.subcommand_groups.intro': (parentName) =>
        `O comando \`${parentName}\` tem os seguintes grupos de subcomandos:`,
    'help.subcommand_groups.entry': (prefix, parent, group, subcommand, description) =>
        `  • \`${prefix}${parent} ${group} ${subcommand}\` - ${description}`,
    'help.subcommand_groups.footer': (prefix, helpCommand, parentName) =>
        `Use ${prefix}${helpCommand} ${parentName} <grupo> <subcomando> para mais informações`,
    'help.subcommands.title': (parentName) => `📚 Ajuda: ${parentName}`,
    'help.subcommands.intro': (parentName) =>
        `O comando \`${parentName}\` tem os seguintes subcomandos:`,
    'help.subcommands.entry': (prefix, parent, name, description) =>
        `• \`${prefix}${parent} ${name}\` - ${description}`,
    'help.subcommands.footer': (prefix, helpCommand, parentName) =>
        `Use ${prefix}${helpCommand} ${parentName} <subcomando> para mais informações`,

    // ─── ColorCommand ──────────────────────────────────────────────────
    'color.command_description': 'Seletor de cor de exemplo usando um menu Select.',
    'color.prompt.title': '🎨 Seletor de cor',
    'color.prompt.description': 'Escolha uma cor no menu para vê-la aplicada ao embed.',
    'color.select.placeholder': 'Selecione uma cor',
    'color.expired': 'Esta interação expirou.',
    'color.only_initiator': 'Apenas quem invocou o comando pode usar este menu.',
    'color.unknown': 'Cor desconhecida.',
    'color.hex_label': 'Hex',
    'color.red.label': 'Vermelho',
    'color.red.description': 'Quente e intenso',
    'color.green.label': 'Verde',
    'color.green.description': 'Natureza e calma',
    'color.blue.label': 'Azul',
    'color.blue.description': 'Sereno e profundo',
    'color.yellow.label': 'Amarelo',
    'color.yellow.description': 'Vibrante e luminoso',
    'color.purple.label': 'Roxo',
    'color.purple.description': 'Místico e elegante',

    // ─── FeedbackCommand ───────────────────────────────────────────────
    'feedback.command_description': 'Formulário de feedback de exemplo usando um Modal.',
    'feedback.prompt.title': '💬 Compartilhe seu feedback',
    'feedback.prompt.description':
        'Aperte o botão para abrir um formulário onde poderá nos contar o que acha.',
    'feedback.button.open_label': 'Abrir formulário',
    'feedback.invitation_expired': 'Este convite expirou. Execute `/feedback` novamente.',
    'feedback.only_initiator': 'Apenas quem invocou o comando pode abrir este formulário.',
    'feedback.modal.title': 'Seu feedback',
    'feedback.form_expired': 'O formulário expirou antes do envio.',
    'feedback.subject.label': 'Assunto',
    'feedback.subject.placeholder': 'Resumo breve',
    'feedback.message.label': 'Mensagem',
    'feedback.message.placeholder': 'Conte-nos o que pensa…',
    'feedback.received.title': '✅ Feedback recebido',
    'feedback.received.subject_label': 'Assunto',
    'feedback.received.message_label': 'Mensagem',
    'feedback.received.elapsed_label': 'Tempo de resposta',
    'feedback.received.elapsed_value': (seconds) => `${seconds}s`,
    'feedback.received.sent_by': (tag) => `Enviado por ${tag}`,

    // ─── VoteCommand ───────────────────────────────────────────────────
    'vote.command_description': 'Cria uma enquete de exemplo com botões interativos.',
    'vote.default_question': 'Você gosta deste template?',
    'vote.expired': 'Esta enquete expirou. Execute `/vote` novamente.',
    'vote.yes_label': 'Sim',
    'vote.no_label': 'Não',
    'vote.meh_label': 'Indiferente',
    'vote.reset_label': 'Reiniciar',
    'vote.total': (count) => `Total: **${count}** voto${count === 1 ? '' : 's'}`,

    // ─── /config get|set ───────────────────────────────────────────────
    'config.command_description': 'Comandos de configuração',
    'config.get.command_description': 'Obtém um valor de configuração',
    'config.set.command_description': 'Define um valor de configuração',
    'config.argument.key': 'A chave do valor a buscar',
    'config.argument.set_key': 'A chave do valor a salvar',
    'config.argument.value': 'O valor a salvar',
    'config.get.title': 'Configuração',
    'config.get.value': (key, value) => `O valor da configuração \`${key}\` é \`${value}\``,
    'config.set.title': 'Configuração definida',
    'config.set.value': (key, value) => `A configuração \`${key}\` = \`${value}\` foi definida`,
    'config.generic_value': 'Dado genérico',

    // ─── /server config e /server user ─────────────────────────────────
    'server.command_description': 'Comandos do servidor',
    'server.config.command_description': 'Comandos de configuração do servidor',
    'server.config.get.command_description': 'Obtém uma configuração do servidor',
    'server.config.set.command_description': 'Define uma configuração do servidor',
    'server.config.argument.key': 'A chave da configuração a buscar',
    'server.config.argument.set_key': 'A chave do valor a salvar',
    'server.config.argument.value': 'O valor a salvar',
    'server.config.get.value': (key, value) =>
        `O valor da configuração do servidor \`${key}\` é \`${value}\``,
    'server.config.set.value': (key, value) =>
        `A configuração do servidor \`${key}\` = \`${value}\` foi definida`,

    'server.user.command_description': 'Comandos de usuários do servidor',
    'server.user.info.command_description': 'Mostra as informações de um usuário',
    'server.user.info.argument.description': 'O usuário cujas informações deseja visualizar',
    'server.user.info.title': (tag) => `Informações do usuário: ${tag}`,
    'server.user.info.id_label': 'ID',
    'server.user.info.created_at_label': 'Criado em',
};
