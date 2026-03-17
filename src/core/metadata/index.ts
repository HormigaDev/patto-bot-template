/**
 * Módulo de Metadata Centralizada
 *
 * Este módulo proporciona un sistema centralizado para el manejo de metadatos
 * en todo el proyecto. En lugar de usar Reflect.getMetadata en múltiples lugares,
 * toda la metadata se almacena en una única referencia global (MetadataStore)
 * y se accede a través de una API limpia (metadataHandler).
 *
 * ## Beneficios
 *
 * 1. **Rendimiento**: La metadata se carga una sola vez al inicio del programa,
 *    eliminando la latencia de múltiples llamadas a Reflect.getMetadata.
 *
 * 2. **API Limpia**: En lugar de:
 *    ```ts
 *    const cooldown = Reflect.getMetadata(COOLDOWN_METADATA_KEY, target);
 *    ```
 *    Simplemente usa:
 *    ```ts
 *    const cooldown = metadataHandler.getCooldown(target);
 *    ```
 *
 * 3. **Tipado Fuerte**: Todos los métodos tienen tipos correctos, mejorando
 *    la experiencia de desarrollo y reduciendo errores.
 *
 * 4. **Centralización**: Toda la lógica de metadata está en un solo lugar,
 *    facilitando el mantenimiento y debugging.
 *
 * ## Uso
 *
 * ```ts
 * import { metadataHandler } from '@/core/metadata';
 *
 * * Obtener cooldown
 * const cooldown = metadataHandler.getCooldown(PingCommand);
 *
 * * Obtener permisos requeridos
 * const permissions = metadataHandler.getRequiredPermissions(BanCommand);
 *
 * * Obtener argumentos
 * const args = metadataHandler.getArguments(SayCommand);
 *
 * * Obtener metadata completa del comando
 * const metadata = metadataHandler.getCommandMetadata(PingCommand);
 * if (metadata?.type === 'command') {
 *     console.log(metadata.meta.name);
 * }
 * ```
 *
 * ## Arquitectura
 *
 * - **MetadataStore**: Almacén de bajo nivel que mantiene los Maps de metadata.
 *   Los decoradores registran aquí la metadata durante la carga del módulo.
 *
 * - **metadataHandler**: API de alto nivel para consultar metadata.
 *   Este es el punto de entrada principal para todo el código de la aplicación.
 *
 * @module metadata
 */

// Store de bajo nivel (usado internamente por decoradores)
export { MetadataStore } from './metadata.store';
export type { CommandMetadataEntry } from './metadata.store';

// Handler de alto nivel (API principal)
export { metadataHandler } from './metadata.handler';
export type { CommandMetadataResult, ClassOrConstructor } from './metadata.handler';
