/**
 * Fixtures reutilizables para tests
 * Los fixtures son datos de prueba predefinidos que se pueden usar en múltiples tests
 */

import { User, Guild, GuildMember, TextChannel, Message } from 'discord.js';
import {
    createMockUser,
    createMockGuild,
    createMockMember,
    createMockTextChannel,
    createMockMessage,
} from '@tests/mocks/discord.mock';

/**
 * Usuario fixture estándar
 */
export const standardUser = createMockUser('123456789', 'StandardUser');

/**
 * Usuario administrador fixture
 */
export const adminUser = createMockUser('987654321', 'AdminUser');

/**
 * Usuario bot fixture
 */
export const botUser = createMockUser('111222333', 'BotUser');

/**
 * Guild fixture estándar
 */
export const standardGuild = createMockGuild('555666777', 'Test Guild');

/**
 * Canal de texto fixture
 */
export const standardChannel = createMockTextChannel('888999000', 'general', standardGuild);

/**
 * Miembro fixture estándar
 */
export const standardMember = createMockMember(standardUser, standardGuild);

/**
 * Mensaje fixture estándar
 */
export const standardMessage = createMockMessage('!test command', standardUser, standardChannel);

/**
 * Comandos de texto fixtures
 */
export const textCommands = {
    help: '!help',
    ping: '!ping',
    info: '!info',
    withArgs: '!test arg1 arg2 arg3',
    withMention: '!kick <@123456789> spam',
    invalid: '!invalidcommand',
};

/**
 * Datos de argumentos fixtures
 */
export const argumentFixtures = {
    validString: 'test string',
    validNumber: 42,
    validBoolean: true,
    validUser: standardUser,
    validChannel: standardChannel,
    invalidNumber: 'not a number',
    emptyString: '',
    longString: 'a'.repeat(1000),
};

/**
 * Errores fixtures
 */
export const errorFixtures = {
    validation: {
        message: 'Validation failed',
        field: 'username',
    },
    permission: {
        message: 'You do not have permission',
        required: 'ADMINISTRATOR',
    },
    notFound: {
        message: 'Resource not found',
        resource: 'User',
    },
};

/**
 * Datos de cooldown fixtures
 */
export const cooldownFixtures = {
    short: 5000, // 5 segundos
    medium: 60000, // 1 minuto
    long: 300000, // 5 minutos
};

/**
 * Configuración de test fixtures
 */
export const testConfig = {
    discordToken: 'test-token-123',
    clientId: 'test-client-id',
    guildId: '555666777',
    testTimeout: 30000,
};
