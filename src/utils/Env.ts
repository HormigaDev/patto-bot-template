/**
 * Utilidad para cargar y validar variables de entorno de forma segura
 */
import { logger, Logger, LogLevel } from './Logger';

const envLog = logger.child('Env');

interface EnvConfig {
    BOT_TOKEN: string;
    CLIENT_ID: string;
    USE_MESSAGE_CONTENT: boolean;
    COMMAND_PREFIX: string;
    INTENTS?: number;
    LOG_LEVEL: LogLevel;
    SHARDING_ENABLED: boolean;
    /** Presente solo cuando SHARDING_ENABLED=true. Contiene la URL completa de Redis. */
    REDIS_URL?: string;
    /** Número de shards a lanzar, o 'auto' para que Discord lo calcule. */
    TOTAL_SHARDS: number | 'auto';
}

class EnvValidator {
    private config: EnvConfig | null = null;

    /**
     * Valida y carga todas las variables de entorno
     * Lanza un error claro si falta alguna variable obligatoria
     */
    public load(): EnvConfig {
        if (this.config) {
            return this.config;
        }

        const errors: string[] = [];

        // Variables obligatorias
        const BOT_TOKEN = this.validateRequired('BOT_TOKEN', errors);
        const CLIENT_ID = this.validateRequired('CLIENT_ID', errors);

        // Si hay errores en las obligatorias, no continuar
        if (errors.length > 0) {
            this.throwError(errors);
        }

        // Variables opcionales con valores por defecto
        const USE_MESSAGE_CONTENT = this.parseBoolean(process.env.USE_MESSAGE_CONTENT);

        let COMMAND_PREFIX: string;
        try {
            COMMAND_PREFIX = this.parseCommandPrefix(process.env.COMMAND_PREFIX);
        } catch (_error) {
            errors.push('❌ COMMAND_PREFIX no puede estar vacío. Use un prefijo válido (ej: !)');
            COMMAND_PREFIX = '!'; // Temporal para evitar undefined
        }

        const INTENTS = this.parseIntents(process.env.INTENTS);
        const LOG_LEVEL = this.parseLogLevel(process.env.LOG_LEVEL);

        const SHARDING_ENABLED = this.parseBoolean(process.env.SHARDING_ENABLED);
        const TOTAL_SHARDS = this.parseTotalShards(process.env.TOTAL_SHARDS);

        let REDIS_URL: string | undefined;
        if (SHARDING_ENABLED) {
            REDIS_URL = this.validateRequired('REDIS_URL', errors);
            if (REDIS_URL) {
                this.validateRedisUrl(REDIS_URL, errors);
            }
        }

        if (errors.length > 0) {
            this.throwError(errors);
        }

        this.config = {
            BOT_TOKEN: BOT_TOKEN!,
            CLIENT_ID: CLIENT_ID!,
            USE_MESSAGE_CONTENT,
            COMMAND_PREFIX,
            INTENTS,
            LOG_LEVEL,
            SHARDING_ENABLED,
            REDIS_URL,
            TOTAL_SHARDS,
        };

        // Aplicar el nivel de logging al singleton ANTES de imprimir la config,
        // así un LOG_LEVEL=WARN no muestra el banner de configuración.
        Logger.setLevel(LOG_LEVEL);

        this.logConfig();

        return this.config;
    }

    /**
     * Obtiene la configuración ya validada
     * Lanza error si no se ha llamado a load() primero
     */
    public get(): EnvConfig {
        if (!this.config) {
            throw new Error(
                '❌ Configuración no cargada. Llama a Env.load() antes de usar Env.get()',
            );
        }
        return this.config;
    }

    /**
     * Valida que una variable obligatoria exista y no esté vacía
     */
    private validateRequired(key: string, errors: string[]): string | undefined {
        const value = process.env[key]?.trim();

        if (!value) {
            errors.push(`❌ Variable obligatoria faltante o vacía: ${key}`);
            return undefined;
        }

        return value;
    }

    /**
     * Convierte un string a boolean
     * Solo 'true' (case insensitive) es true, todo lo demás es false
     */
    private parseBoolean(value: string | undefined): boolean {
        if (!value) return false;
        return value.trim().toLowerCase() === 'true';
    }

    /**
     * Parsea COMMAND_PREFIX con validación
     * No puede ser un string vacío, pero puede ser undefined (usa default)
     */
    private parseCommandPrefix(value: string | undefined): string {
        if (!value) return '!'; // Default si no está definido

        const trimmed = value.trim();

        if (trimmed.length === 0) {
            // Error: definido pero vacío
            throw new Error('COMMAND_PREFIX definido pero vacío');
        }

        return trimmed;
    }

    /**
     * Parsea INTENTS como número si está definido
     */
    private parseIntents(value: string | undefined): number | undefined {
        if (!value) return undefined;

        const parsed = parseInt(value.trim(), 10);

        if (isNaN(parsed)) {
            envLog.warn(
                `INTENTS='${value}' no es un número válido. Se usarán los intents automáticos.`,
            );
            return undefined;
        }

        return parsed;
    }

    /**
     * Parsea TOTAL_SHARDS. Acepta un número entero positivo o 'auto'.
     * Valor inválido → usa 'auto' con advertencia.
     */
    private parseTotalShards(value: string | undefined): number | 'auto' {
        if (!value || value.trim().toLowerCase() === 'auto') return 'auto';

        const parsed = parseInt(value.trim(), 10);

        if (isNaN(parsed) || parsed < 1) {
            envLog.warn(
                `TOTAL_SHARDS='${value}' no es válido (debe ser un entero ≥ 1 o 'auto'). Se usará 'auto'.`,
            );
            return 'auto';
        }

        return parsed;
    }

    /**
     * Valida que REDIS_URL tenga el esquema correcto (redis:// o rediss://).
     * Agrega error al array si es inválida.
     */
    private validateRedisUrl(url: string, errors: string[]): void {
        if (!url.startsWith('redis://') && !url.startsWith('rediss://')) {
            errors.push('❌ REDIS_URL debe comenzar con redis:// o rediss://');
        }
    }

    /**
     * Enmascara las credenciales de una URL de Redis para los logs.
     */
    private maskRedisUrl(url: string): string {
        try {
            const parsed = new URL(url);
            if (parsed.password) {
                parsed.username = parsed.username ? '***' : '';
                parsed.password = '***';
            }
            return parsed.toString();
        } catch {
            return '(URL inválida)';
        }
    }

    /**
     * Parsea LOG_LEVEL. Acepta los nombres de {@link LogLevel} (case-insensitive).
     * Valor inválido → usa el default (DEBUG en dev, INFO en producción).
     */
    private parseLogLevel(value: string | undefined): LogLevel {
        const current = Logger.getLevel();
        if (!value) return current;

        const normalized = value.trim().toUpperCase();
        const candidate = LogLevel[normalized as keyof typeof LogLevel];

        if (typeof candidate !== 'number') {
            envLog.warn(
                `LOG_LEVEL='${value}' no es válido. Valores aceptados: DEBUG, INFO, WARN, ERROR, FATAL, SILENT.`,
            );
            return current;
        }

        return candidate;
    }

    /**
     * Lanza un error con todos los problemas encontrados
     */
    private throwError(errors: string[]): never {
        envLog.fatal('Error de configuración. El bot no puede iniciar.');
        for (const error of errors) {
            envLog.fatal(error);
        }
        envLog.fatal(
            'Solución: copia .env.template a .env, completa las variables obligatorias y reinicia el bot.',
        );
        process.exit(1);
    }

    /**
     * Muestra la configuración cargada (sin exponer tokens ni credenciales)
     */
    private logConfig(): void {
        const cfg = this.config!;
        envLog.info('Configuración cargada correctamente', {
            BOT_TOKEN: this.maskToken(cfg.BOT_TOKEN),
            CLIENT_ID: cfg.CLIENT_ID,
            USE_MESSAGE_CONTENT: cfg.USE_MESSAGE_CONTENT,
            COMMAND_PREFIX: cfg.COMMAND_PREFIX,
            INTENTS: cfg.INTENTS ?? 'automático',
            LOG_LEVEL: LogLevel[cfg.LOG_LEVEL],
            SHARDING_ENABLED: cfg.SHARDING_ENABLED,
            ...(cfg.SHARDING_ENABLED && {
                REDIS_URL: this.maskRedisUrl(cfg.REDIS_URL!),
                TOTAL_SHARDS: cfg.TOTAL_SHARDS,
            }),
        });
    }

    /**
     * Enmascara el token para no mostrarlo completo en logs
     */
    private maskToken(token: string): string {
        if (token.length <= 8) return '***';
        return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
    }
}

// Singleton para mantener una única instancia
export const Env = new EnvValidator();
