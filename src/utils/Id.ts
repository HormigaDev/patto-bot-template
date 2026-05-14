import { randomBytes } from 'node:crypto';

/**
 * Generador de identificadores compactos de alta entropía usando base62.
 *
 * ## Formato
 *
 * Cadena aleatoria codificada con el alfabeto:
 *
 * `0-9A-Za-z`
 *
 * Cada carácter aporta 62 posibilidades (`log2(62) ≈ 5.95 bits`).
 *
 * ## Entropía
 *
 * Con el tamaño por defecto de 10 caracteres:
 *
 * `62¹⁰ ≈ 8.39×10¹⁷`
 *
 * ≈ 839 cuatrillones de combinaciones posibles.
 *
 * Esto hace que la probabilidad de colisión sea extremadamente baja
 * incluso en tests concurrentes o generación masiva de IDs.
 *
 * ## Cuándo usarlo
 *
 * - `customId` de componentes interactivos
 * - IDs efímeros en memoria
 * - Claves de payloads
 * - Identificadores temporales
 * - Fixtures y tests paralelos
 *
 * ## Cuándo NO usarlo
 *
 * Aunque usa entropía criptográficamente segura (`crypto.randomBytes`),
 * este util no pretende reemplazar:
 *
 * - tokens de autenticación
 * - secretos
 * - claves API
 * - hashes criptográficos
 *
 * Para esos casos usar utilidades especializadas.
 *
 * ## Características
 *
 * - Sin timestamp
 * - Sin orden temporal
 * - Alta entropía real
 * - Compacto
 * - URL-safe
 * - Sin sesgo estadístico (rejection sampling)
 *
 * @example
 * ```ts
 * import { generateId } from '@/utils/Id';
 *
 * const id = generateId();      // 10 caracteres
 * const big = generateId(20);   // más entropía
 * ```
 */
export function generateId(size: number = DEFAULT_ID_SIZE): string {
    if (!Number.isInteger(size) || size < 1) {
        throw new RangeError(`Tamaño inválido para generateId: ${size}`);
    }

    return randomString(size);
}

/**
 * Alfabeto base62 ASCII-safe y URL-safe.
 *
 * Se evita usar símbolos especiales para mantener compatibilidad con:
 *
 * - URLs
 * - customIds
 * - nombres de archivo
 * - payloads serializados
 * - logs
 */
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Base numérica del alfabeto.
 */
const RADIX = ALPHABET.length; // 62

/**
 * Tamaño por defecto:
 *
 * 62¹⁰ ≈ 8.39×10¹⁷ combinaciones.
 */
const DEFAULT_ID_SIZE = 10;

/**
 * Genera una cadena aleatoria base62 sin sesgo estadístico.
 *
 * ## Rejection sampling
 *
 * Un byte tiene 256 posibles valores.
 *
 * Como 256 no es divisible entre 62, usar `% 62` directamente
 * introduciría distribución desigual.
 *
 * Para evitarlo:
 *
 * - se aceptan únicamente valores `< 248`
 * - 248 es el múltiplo de 62 más cercano por debajo de 256
 * - los valores restantes (`248-255`) se descartan
 *
 * Esto garantiza distribución uniforme.
 */
function randomString(length: number): string {
    if (length === 0) return '';

    const out: string[] = new Array(length);

    /**
     * 248 = floor(256 / 62) * 62
     *
     * Valores >= 248 se descartan para evitar sesgo.
     */
    const maxUnbiased = Math.floor(256 / RADIX) * RADIX;

    let outIndex = 0;

    while (outIndex < length) {
        /**
         * Se generan únicamente los bytes necesarios pendientes.
         */
        const bytes = randomBytes(length - outIndex);

        for (let i = 0; i < bytes.length && outIndex < length; i++) {
            const value = bytes[i];

            /**
             * Rejection sampling.
             */
            if (value >= maxUnbiased) continue;

            out[outIndex++] = ALPHABET[value % RADIX];
        }
    }

    return out.join('');
}
