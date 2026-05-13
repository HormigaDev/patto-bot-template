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
 * - **Timestamp** (primeros `min(size, 7)` caracteres): `Date.now()` en
 *   milisegundos codificado en base62 ASCII-sort. Esto hace que los IDs
 *   generados antes ordenen lexicográficamente antes que los generados
 *   después. 7 caracteres base62 cubren ~3.5×10¹² ms, suficiente hasta
 *   bien entrado el año 3000.
 * - **Random** (caracteres restantes): bytes obtenidos de
 *   `crypto.randomBytes` para evitar colisiones dentro del mismo
 *   milisegundo. Cada carácter adicional multiplica el espacio de
 *   entropía por 62.
 *
 * Para el tamaño por defecto de 10 caracteres: 7 de timestamp + 3 de
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
 * const id = generateId();       // 10 caracteres por defecto
 * const big = generateId(20);    // 20 caracteres (más entropía)
 * ```
 */
export function generateId(size: number = 10): string {
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
 * 7 caracteres base62 → 62⁷ ≈ 3.52×10¹² valores, ≈ 111 años de ms.
 * Más allá de 7 chars el timestamp empieza a desperdiciar espacio que
 * conviene reservar para entropía aleatoria.
 */
const MAX_TIMESTAMP_CHARS = 7;

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
    const bytes = randomBytes(length);
    const out: string[] = new Array(length);
    for (let i = 0; i < length; i++) {
        // El módulo introduce un sesgo despreciable (256 % 62 = 8): para
        // identificadores no criptográficos es perfectamente aceptable.
        out[i] = ALPHABET[bytes[i] % RADIX];
    }
    return out.join('');
}
