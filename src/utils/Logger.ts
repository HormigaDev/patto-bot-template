/**
 * Sistema de logging profesional con niveles, colores y scopes.
 *
 * Niveles soportados (de menor a mayor severidad):
 *   DEBUG  → trazas detalladas para diagnóstico
 *   INFO   → eventos normales del ciclo de vida
 *   WARN   → situaciones recuperables que merecen atención
 *   ERROR  → errores manejados que afectan una operación puntual
 *   FATAL  → errores que comprometen el funcionamiento del proceso
 *   SILENT → desactiva todo el output
 *
 * Configuración vía variable de entorno `LOG_LEVEL` (case-insensitive).
 * Por defecto: `DEBUG` cuando NODE_ENV !== 'production', `INFO` en producción.
 *
 * @example
 * ```ts
 * import { logger } from '@/utils/Logger';
 *
 * logger.info('Bot iniciado');
 * logger.error('No se pudo conectar', error);
 *
 * // Logger con scope (recomendado por módulo)
 * const log = logger.child('CommandLoader');
 * log.debug('Cargando comando', filePath);
 * ```
 */

export enum LogLevel {
    DEBUG = 10,
    INFO = 20,
    WARN = 30,
    ERROR = 40,
    FATAL = 50,
    SILENT = 100,
}

const LEVEL_NAMES: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.ERROR]: 'ERROR',
    [LogLevel.FATAL]: 'FATAL',
    [LogLevel.SILENT]: 'SILENT',
};

/**
 * ANSI color codes. Se aplican solo cuando el stream destino es TTY y los
 * colores no están deshabilitados (ej. `NO_COLOR` env var).
 */
const Colors = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
    gray: '\x1b[90m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    blue: '\x1b[34m',
} as const;

const LEVEL_COLORS: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: Colors.gray,
    [LogLevel.INFO]: Colors.cyan,
    [LogLevel.WARN]: Colors.yellow,
    [LogLevel.ERROR]: Colors.red,
    [LogLevel.FATAL]: Colors.magenta,
    [LogLevel.SILENT]: '',
};

function parseLevel(value: string | undefined): LogLevel | undefined {
    if (!value) return undefined;
    const upper = value.trim().toUpperCase();
    const entry = (Object.entries(LEVEL_NAMES) as [string, string][]).find(
        ([, name]) => name === upper,
    );
    return entry ? (Number(entry[0]) as LogLevel) : undefined;
}

function defaultLevel(): LogLevel {
    const fromEnv = parseLevel(process.env.LOG_LEVEL);
    if (fromEnv !== undefined) return fromEnv;
    return process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
}

function colorsEnabled(): boolean {
    if (process.env.NO_COLOR) return false;
    if (process.env.FORCE_COLOR) return true;
    return Boolean(process.stdout.isTTY);
}

/**
 * Logger principal. Implementa el patrón singleton pero permite crear hijos
 * con scope vía {@link Logger.child}, manteniendo el mismo nivel global.
 */
export class Logger {
    private static globalLevel: LogLevel = defaultLevel();
    private static shardId: string | null = null;
    private readonly scope?: string;
    private readonly useColors: boolean;

    constructor(scope?: string) {
        this.scope = scope;
        this.useColors = colorsEnabled();
    }

    /**
     * Cambia el nivel global de logging en runtime.
     */
    public static setLevel(level: LogLevel): void {
        Logger.globalLevel = level;
    }

    /**
     * Obtiene el nivel global actual.
     */
    public static getLevel(): LogLevel {
        return Logger.globalLevel;
    }

    /**
     * Registra el ID del shard actual para que todos los logs lo incluyan.
     * Llamar una sola vez al inicio del proceso worker, antes de cualquier log.
     * Sin sharding, no llamar este método y el tag no aparecerá.
     */
    public static setShardId(id: string): void {
        Logger.shardId = id;
    }

    /**
     * Crea un logger hijo con un scope específico (ej. nombre de módulo).
     * Útil para identificar el origen de cada mensaje sin repetir el prefijo.
     */
    public child(scope: string): Logger {
        const childScope = this.scope ? `${this.scope}:${scope}` : scope;
        return new Logger(childScope);
    }

    public debug(message: string, ...meta: unknown[]): void {
        this.log(LogLevel.DEBUG, message, meta);
    }

    public info(message: string, ...meta: unknown[]): void {
        this.log(LogLevel.INFO, message, meta);
    }

    public warn(message: string, ...meta: unknown[]): void {
        this.log(LogLevel.WARN, message, meta);
    }

    public error(message: string, ...meta: unknown[]): void {
        this.log(LogLevel.ERROR, message, meta);
    }

    public fatal(message: string, ...meta: unknown[]): void {
        this.log(LogLevel.FATAL, message, meta);
    }

    private log(level: LogLevel, message: string, meta: unknown[]): void {
        if (level < Logger.globalLevel) return;

        const line = this.format(level, message);
        const stream = level >= LogLevel.ERROR ? process.stderr : process.stdout;
        stream.write(line + '\n');

        for (const item of meta) {
            this.writeMeta(stream, item);
        }
    }

    private format(level: LogLevel, message: string): string {
        const timestamp = new Date().toISOString();
        const levelName = LEVEL_NAMES[level].padEnd(5, '');
        const sid = Logger.shardId;

        if (!this.useColors) {
            const shard = sid !== null ? ` [SHARD ${sid}]` : '';
            const scope = this.scope ? ` [${this.scope}]` : '';
            return `[${timestamp}] [${levelName}]${shard}${scope} ${message}`;
        }

        const levelColor = LEVEL_COLORS[level];
        const ts = `${Colors.dim}[${timestamp}]${Colors.reset}`;
        const lvl = `${levelColor}${Colors.bold}[${levelName}]${Colors.reset}`;
        const shard =
            sid !== null ? `${Colors.blue}${Colors.bold}[SHARD ${sid}]${Colors.reset}` : '';
        const scope = this.scope ? ` ${Colors.dim}[${this.scope}]${Colors.reset}` : '';
        return `${ts} ${shard} ${lvl}${scope} ${message}`;
    }

    /**
     * Serializa metadata adjunta. Los Error se imprimen con stack;
     * el resto se inspecciona como objeto.
     */
    private writeMeta(stream: NodeJS.WriteStream, item: unknown): void {
        if (item instanceof Error) {
            const stack = item.stack ?? `${item.name}: ${item.message}`;
            stream.write(this.indent(stack) + '\n');
            return;
        }

        if (typeof item === 'string') {
            stream.write(this.indent(item) + '\n');
            return;
        }

        try {
            stream.write(this.indent(JSON.stringify(item, null, 2)) + '\n');
        } catch {
            stream.write(this.indent(String(item)) + '\n');
        }
    }

    private indent(text: string): string {
        return text
            .split('\n')
            .map((line) => '    ' + line)
            .join('\n');
    }
}

/**
 * Logger raíz (singleton). Para identificar el origen de los mensajes,
 * crea hijos con `logger.child('NombreDelModulo')`.
 */
export const logger = new Logger();
