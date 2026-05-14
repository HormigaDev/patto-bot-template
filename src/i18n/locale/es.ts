import type { SupportedLocale } from '../types';

/**
 * Catálogo único de claves en **español** — fuente de verdad del bot.
 *
 * Todos los mensajes que el bot muestra al usuario final viven aquí, en
 * **un solo objeto plano** cuyas claves son strings con notación de
 * puntos (`'<dominio>.<seccion>.<mensaje>'`). Es la convención típica de
 * librerías de i18n en TypeScript: la clave es texto, no anidamiento de
 * objetos.
 *
 * ## Convenciones
 *
 * - **Claves planas con puntos**: `'ping.response.title'`, no
 *   `pingResponseTitle` ni objetos anidados. Cada segmento separa un
 *   nivel lógico (`<dominio>.<seccion>.<mensaje>`).
 * - **Segmentos en `snake_case`** cuando son multi-palabra:
 *   `'system.unexpected_error'`, no `'system.unexpectedError'`.
 * - **El primer segmento es el dominio dueño**: `system`, `cooldown`,
 *   `permissions`, `category`, `ping`, `setlocale`, `help`, `color`,
 *   `feedback`, `vote`, `config`, `server`. Borrar un comando = borrar
 *   sus claves agrupadas por prefijo, sin grep.
 * - **Valores como `string` o función**. Para interpolaciones, usar una
 *   función con tipos explícitos: TypeScript validará en cada call site
 *   que se pasen los argumentos correctos. `en.ts` y `pt.ts` heredan la
 *   firma automáticamente vía `typeof es`.
 *
 * ## Añadir un mensaje nuevo
 *
 * 1. Añade la clave aquí (en español).
 * 2. El compilador hará fallar `en.ts` y `pt.ts` hasta que añadas la
 *    traducción correspondiente. Ése es exactamente el contrato.
 */

const localeNames: Record<SupportedLocale, string> = {
    es: 'Español',
    en: 'Inglés',
    pt: 'Portugués',
};

export const es = {
    // ─── system / infraestructura ──────────────────────────────────────
    'system.usage_error.title': 'Error de uso',
    'system.error.title': 'Error',
    'system.requested_by': (username: string) => `Solicitado por: ${username}`,
    'system.unexpected_error':
        'Ocurrió un error inesperado al procesar el comando. Intenta nuevamente más tarde',
    'system.unexpected_arguments_error': 'Ocurrió un error al procesar tus argumentos',
    'system.component_action_error': '❌ Ocurrió un error al procesar esta acción.',

    'system.argument.required': (name: string) => `El argumento \`${name}\` es obligatorio.`,
    'system.argument.parse_error': (name: string, reason: string) =>
        `Error al parsear \`${name}\`: ${reason}`,
    'system.argument.invalid_value': (name: string, expectedType: string) =>
        `El valor \`${name}\` es inválido. Tipo esperado: \`${expectedType}\``,
    'system.argument.choice_invalid': (name: string, validOptions: string) =>
        `El valor de \`${name}\` debe ser una de las opciones válidas: ${validOptions}`,
    'system.argument.discord_type_not_found': (typeName: string) =>
        `No se pudo encontrar el ${typeName} especificado.`,
    'system.argument.discord_type_not_found_for_value': (typeName: string, raw: string) =>
        `No se pudo encontrar el ${typeName} especificado: \`${raw}\``,
    'system.argument.validation_failed': (value: string) => `Valor \`${value}\` no válido`,

    'system.self_action.forbidden': 'No puedes ejecutar este comando sobre ti mismo.',
    'system.self_action.bot_forbidden': '¿Por qué debería hacer eso conmigo mismo?',

    // ─── CooldownPlugin ────────────────────────────────────────────────
    'cooldown.wait_until': (discordTimestamp: string) =>
        `Espera hasta ${discordTimestamp} para usar este comando`,

    // ─── PermissionsPlugin ─────────────────────────────────────────────
    'permissions.insufficient.title': 'Permisos insuficientes',
    'permissions.insufficient.description':
        'No tienes los permisos necesarios para ejecutar este comando.',

    // ─── Categorías (CommandCategories) ────────────────────────────────
    'category.info.name': 'Información',
    'category.info.description': 'Comandos relacionados con la información del bot y del servidor.',
    'category.utils.name': 'Utilidades',
    'category.utils.description': 'Comandos de utilidad general.',
    'category.moderation.name': 'Moderación',
    'category.moderation.description': 'Comandos de moderación del servidor.',
    'category.settings.name': 'Ajustes',
    'category.settings.description': 'Configuración del bot y del servidor.',
    'category.economy.name': 'Economía',
    'category.economy.description': 'Comandos de economía y recompensas.',
    'category.other.name': 'Otros',
    'category.other.description': 'Comandos que no encajan en otras categorías.',

    // ─── PingCommand ───────────────────────────────────────────────────
    'ping.command_description': 'Muestra la latencia del bot',
    'ping.response.title': '🏓 Pong!',
    'ping.response.latency': (ms: number) => `Latencia \`${ms}ms\``,

    // ─── SetLocaleCommand ──────────────────────────────────────────────
    'setlocale.command_description': 'Cambia el idioma en el que el bot responde en este servidor.',
    'setlocale.argument.description': 'Idioma a usar para las respuestas del bot',
    'setlocale.argument.language_label': (locale: SupportedLocale) => localeNames[locale],
    'setlocale.response.title': 'Idioma actualizado',
    'setlocale.response.description': (locale: SupportedLocale) =>
        `Las respuestas del bot se mostrarán en **${localeNames[locale]}** a partir de ahora en este servidor.`,
    'setlocale.response.unsupported': (raw: string) =>
        `El idioma \`${raw}\` no está soportado. Idiomas disponibles: \`es\`, \`en\`, \`pt\`.`,
    'setlocale.response.same_locale': (locale: SupportedLocale) =>
        `Este servidor ya estaba configurado en **${localeNames[locale]}**.`,
    'setlocale.response.only_in_guild': 'Este comando solo puede ser ejecutado en un servidor',

    // ─── HelpCommand ───────────────────────────────────────────────────
    'help.command_description': 'Muestra la ayuda de los comandos disponibles',
    'help.argument.description': 'El nombre del comando para obtener ayuda',
    'help.root.title': 'Ayuda de Comandos',
    'help.root.description': 'Selecciona una categoría del menú desplegable para ver sus comandos.',
    'help.select.category_placeholder': 'Selecciona una categoría',
    'help.category_empty': '*Esta categoría no tiene comandos*',
    'help.command_help.title': (commandTitle: string) => `Ayuda: ${commandTitle}`,
    'help.command_help.empty_description': '*Sin descripción*',
    'help.command_help.usage_label': 'Uso',
    'help.command_help.arguments_label': 'Argumentos',
    'help.command_help.aliases_label': 'Alias',
    'help.command_help.footer_args_legend': '<> = obligatorio, [] = opcional',
    'help.not_found.title': 'Comando no encontrado',
    'help.not_found.description': (name: string) => `No se encontró el comando \`${name}\`.`,
    'help.expired': 'Esta interacción ha expirado.',
    'help.page_of': (current: number, total: number) => `Página ${current} de ${total}`,
    'help.previous_button': 'Anterior',
    'help.next_button': 'Siguiente',
    'help.subcommand_groups.title': (parentName: string) => `📚 Ayuda: ${parentName}`,
    'help.subcommand_groups.intro': (parentName: string) =>
        `El comando \`${parentName}\` tiene los siguientes grupos de subcomandos:`,
    'help.subcommand_groups.entry': (
        prefix: string,
        parent: string,
        group: string,
        subcommand: string,
        description: string,
    ) => `  • \`${prefix}${parent} ${group} ${subcommand}\` - ${description}`,
    'help.subcommand_groups.footer': (prefix: string, helpCommand: string, parentName: string) =>
        `Usa ${prefix}${helpCommand} ${parentName} <grupo> <subcomando> para más información`,
    'help.subcommands.title': (parentName: string) => `📚 Ayuda: ${parentName}`,
    'help.subcommands.intro': (parentName: string) =>
        `El comando \`${parentName}\` tiene los siguientes subcomandos:`,
    'help.subcommands.entry': (prefix: string, parent: string, name: string, description: string) =>
        `• \`${prefix}${parent} ${name}\` - ${description}`,
    'help.subcommands.footer': (prefix: string, helpCommand: string, parentName: string) =>
        `Usa ${prefix}${helpCommand} ${parentName} <subcomando> para más información`,

    // ─── ColorCommand ──────────────────────────────────────────────────
    'color.command_description': 'Selector de color de ejemplo usando un Select menu.',
    'color.prompt.title': '🎨 Selector de color',
    'color.prompt.description': 'Elige un color del menú para verlo aplicado al embed.',
    'color.select.placeholder': 'Selecciona un color',
    'color.expired': 'Esta interacción ha expirado.',
    'color.only_initiator': 'Sólo quien invocó el comando puede usar este menú.',
    'color.unknown': 'Color desconocido.',
    'color.hex_label': 'Hex',
    'color.red.label': 'Rojo',
    'color.red.description': 'Cálido e intenso',
    'color.green.label': 'Verde',
    'color.green.description': 'Naturaleza y calma',
    'color.blue.label': 'Azul',
    'color.blue.description': 'Sereno y profundo',
    'color.yellow.label': 'Amarillo',
    'color.yellow.description': 'Vibrante y luminoso',
    'color.purple.label': 'Morado',
    'color.purple.description': 'Místico y elegante',

    // ─── FeedbackCommand ───────────────────────────────────────────────
    'feedback.command_description': 'Formulario de feedback de ejemplo usando un Modal.',
    'feedback.prompt.title': '💬 Comparte tu feedback',
    'feedback.prompt.description':
        'Pulsa el botón para abrir un formulario donde podrás contarnos qué te parece.',
    'feedback.button.open_label': 'Abrir formulario',
    'feedback.invitation_expired': 'Esta invitación ha expirado. Vuelve a ejecutar `/feedback`.',
    'feedback.only_initiator': 'Sólo quien invocó el comando puede abrir este formulario.',
    'feedback.modal.title': 'Tu feedback',
    'feedback.form_expired': 'El formulario expiró antes de enviarse.',
    'feedback.subject.label': 'Asunto',
    'feedback.subject.placeholder': 'Resumen breve',
    'feedback.message.label': 'Mensaje',
    'feedback.message.placeholder': 'Cuéntanos qué piensas…',
    'feedback.received.title': '✅ Feedback recibido',
    'feedback.received.subject_label': 'Asunto',
    'feedback.received.message_label': 'Mensaje',
    'feedback.received.elapsed_label': 'Tiempo de respuesta',
    'feedback.received.elapsed_value': (seconds: number) => `${seconds}s`,
    'feedback.received.sent_by': (tag: string) => `Enviado por ${tag}`,

    // ─── VoteCommand ───────────────────────────────────────────────────
    'vote.command_description': 'Lanza una encuesta de ejemplo con botones interactivos.',
    'vote.default_question': '¿Te gusta esta plantilla?',
    'vote.expired': 'Esta encuesta ha expirado. Vuelve a ejecutar `/vote`.',
    'vote.yes_label': 'Sí',
    'vote.no_label': 'No',
    'vote.meh_label': 'Indiferente',
    'vote.reset_label': 'Reiniciar',
    'vote.total': (count: number) => `Total: **${count}** voto${count === 1 ? '' : 's'}`,

    // ─── Subcomandos /config get|set ───────────────────────────────────
    'config.command_description': 'Comandos de configuración',
    'config.get.command_description': 'Obtiene un valor de configuración',
    'config.set.command_description': 'Establece una configuración',
    'config.argument.key': 'La clave del valor a buscar',
    'config.argument.set_key': 'La clave del valor a guardar',
    'config.argument.value': 'El valor a guardar',
    'config.get.title': 'Configuración',
    'config.get.value': (key: string, value: string) =>
        `El valor de la configuración \`${key}\` es \`${value}\``,
    'config.set.title': 'Configuración establecida',
    'config.set.value': (key: string, value: string) =>
        `Se ha establecido la configuración \`${key}\` = \`${value}\``,
    'config.generic_value': 'Dato genérico',

    // ─── Subcomandos /server config y /server user ─────────────────────
    'server.command_description': 'Comandos del servidor',
    'server.config.command_description': 'Comandos de configuración del servidor',
    'server.config.get.command_description': 'Obtiene la configuración del servidor',
    'server.config.set.command_description': 'Establece una configuración en el servidor',
    'server.config.argument.key': 'La clave de la configuración a buscar',
    'server.config.argument.set_key': 'La clave del valor a guardar',
    'server.config.argument.value': 'El valor a guardar',
    'server.config.get.value': (key: string, value: string) =>
        `El valor de la configuración del servidor \`${key}\` es \`${value}\``,
    'server.config.set.value': (key: string, value: string) =>
        `Se ha establecido la configuración del servidor \`${key}\` = \`${value}\``,

    'server.user.command_description': 'Comandos de usuarios del servidor',
    'server.user.info.command_description': 'Muestra la información de un usuario',
    'server.user.info.argument.description':
        'El usuario del cual se quiere visualizar la información',
    'server.user.info.title': (tag: string) => `Información de usuario: ${tag}`,
    'server.user.info.id_label': 'ID',
    'server.user.info.created_at_label': 'Creado el',
};
