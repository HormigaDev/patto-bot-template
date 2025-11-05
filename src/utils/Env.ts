/**
 * Utilidad para cargar y validar variables de entorno de forma segura
 */

interface EnvConfig {
    BOT_TOKEN: string;
    CLIENT_ID: string;
    USE_MESSAGE_CONTENT: boolean;
    COMMAND_PREFIX: string;
    INTENTS?: number;
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
        } catch (error) {
            errors.push('❌ COMMAND_PREFIX no puede estar vacío. Use un prefijo válido (ej: !)');
            COMMAND_PREFIX = '!'; // Temporal para evitar undefined
        }

        const INTENTS = this.parseIntents(process.env.INTENTS);

        if (errors.length > 0) {
            this.throwError(errors);
        }

        this.config = {
            BOT_TOKEN: BOT_TOKEN!,
            CLIENT_ID: CLIENT_ID!,
            USE_MESSAGE_CONTENT,
            COMMAND_PREFIX,
            INTENTS,
        };

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
            console.warn(
                `⚠️  INTENTS='${value}' no es un número válido. Se usarán los intents automáticos.`,
            );
            return undefined;
        }

        return parsed;
    }

    /**
     * Lanza un error con todos los problemas encontrados
     */
    private throwError(errors: string[]): never {
        console.error('\n╔════════════════════════════════════════════════════════════════╗');
        console.error('║  ❌ ERROR DE CONFIGURACIÓN                                     ║');
        console.error('╚════════════════════════════════════════════════════════════════╝\n');

        errors.forEach((error) => console.error(`  ${error}`));

        console.error('\n📋 Solución:');
        console.error('  1. Copia el archivo .env.template a .env');
        console.error('  2. Completa las variables obligatorias');
        console.error('  3. Reinicia el bot\n');

        process.exit(1);
    }

    /**
     * Muestra la configuración cargada (sin exponer tokens)
     */
    private logConfig(): void {
        console.log('\n✅ Configuración cargada correctamente:');
        console.log(`   • BOT_TOKEN: ${this.maskToken(this.config!.BOT_TOKEN)}`);
        console.log(`   • CLIENT_ID: ${this.config!.CLIENT_ID}`);
        console.log(`   • USE_MESSAGE_CONTENT: ${this.config!.USE_MESSAGE_CONTENT}`);
        console.log(`   • COMMAND_PREFIX: "${this.config!.COMMAND_PREFIX}"`);
        if (this.config!.INTENTS !== undefined) {
            console.log(`   • INTENTS: ${this.config!.INTENTS} (personalizado)`);
        } else {
            console.log(`   • INTENTS: automático`);
        }
        console.log('');
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
