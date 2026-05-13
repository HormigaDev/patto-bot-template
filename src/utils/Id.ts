import { randomBytes } from 'node:crypto';

/**
 * Generador de identificadores cortos, ordenados temporalmente y con
 * cola aleatoria. Inspirado en UUIDv7 pero con tamaño configurable y
 * mucho más compacto.
 *
 * ## Formato
 *
 * `<timestamp><random>` codificado en base62 (`0-9A-Za-z`).
 *
 * - **Timestamp** (primeros `min(size, 8)` caracteres): `Date.now()` en
 *   milisegundos codificado en base62 ASCII-sort. Esto hace que los IDs
 *   generados antes ordenen lexicográficamente antes que los generados
 *   después. 8 caracteres base62 cubren ~2.18×10¹⁴ ms desde Unix epoch:
 *   suficiente hasta bastante después del año 3000.
 * - **Random** (caracteres restantes): bytes obtenidos de
 *   `crypto.randomBytes` para evitar colisiones dentro del mismo
 *   milisegundo. Cada carácter adicional multiplica el espacio de
 *   entropía por 62.
 *
 * Para el tamaño por defecto de 11 caracteres: 8 de timestamp + 3 de
 * entropía → ~238 mil identificadores únicos por milisegundo.
 *
 * ## Cuándo usarlo
 *
 * Cualquier identificador efímero del bot: `customId` de componentes
 * interactivos, claves de payloads, IDs de mensajes en memoria, etc.
 *
 * No usar para hash de seguridad, tokens de sesión o cualquier otro
 * caso donde se necesite imprevisibilidad criptográfica fuerte: la
 * mitad del ID es predecible (el timestamp).
 *
 * @example
 * ```ts
 * import { generateId } from '@/utils/Id';
 *
 * const id = generateId();       // 11 caracteres por defecto
 * const big = generateId(20);    // 20 caracteres (más entropía)
 * ```
 */
export function generateId(size: number = DEFAULT_ID_SIZE): string {
    if (!Number.isInteger(size) || size < 1) {
        throw new RangeError(`Tamaño inválido para generateId: ${size}`);
    }

    const timestampChars = Math.min(size, MAX_TIMESTAMP_CHARS);
    const randomChars = size - timestampChars;

    return encodeTimestamp(Date.now(), timestampChars) + randomTail(randomChars);
}

/**
 * Alfabeto base62 ordenado por código ASCII. El orden importa: como el
 * timestamp se codifica con `% RADIX`, esta secuencia garantiza que la
 * comparación lexicográfica de dos IDs respete el orden cronológico.
 */
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const RADIX = ALPHABET.length; // 62

/**
 * 8 caracteres base62 → 62⁸ ≈ 2.18×10¹⁴ valores, ≈ 6918 años de ms
 * desde Unix epoch. Cubre holgadamente el año 3000 manteniendo orden
 * lexicográfico cronológico.
 */
const MAX_TIMESTAMP_CHARS = 8;
const DEFAULT_ID_SIZE = MAX_TIMESTAMP_CHARS + 3;

function encodeTimestamp(ms: number, length: number): string {
    if (length === 0) return '';
    let n = ms;
    const out: string[] = new Array(length);
    for (let i = length - 1; i >= 0; i--) {
        out[i] = ALPHABET[n % RADIX];
        n = Math.floor(n / RADIX);
    }
    return out.join('');
}

function randomTail(length: number): string {
    if (length === 0) return '';

    const out: string[] = new Array(length);

    const maxUnbiased = Math.floor(256 / RADIX) * RADIX; // 248 para base62
    let outIndex = 0;
    while (outIndex < length) {
        const bytes = randomBytes(length - outIndex);
        for (let i = 0; i < bytes.length && outIndex < length; i++) {
            const value = bytes[i];
            if (value >= maxUnbiased) continue; // descartar para evitar sesgo
            out[outIndex++] = ALPHABET[value % RADIX];
        }
    }
    return out.join('');
}
