# Carpeta: Error

## 📖 Descripción

Esta carpeta contiene **errores personalizados** del bot. Estos errores tienen significados específicos y son manejados de forma especial por el `CommandHandler`.

## 🏗️ Estructura

```
error/
├── ValidationError.ts    # Errores de validación de argumentos
└── ReplyError.ts         # Errores esperados que deben mostrarse al usuario
```

## ⚠️ ValidationError

### Descripción

Error lanzado cuando la **validación de argumentos falla**.

### Ubicación

```typescript
// src/error/ValidationError.ts
```

### Uso

```typescript
import { ValidationError } from '@/error/ValidationError';

if (this.amount < 0) {
    throw new ValidationError('El monto debe ser positivo');
}
```

### Cuándo Usarlo

-   ✅ Argumento requerido falta
-   ✅ Tipo de argumento inválido
-   ✅ Validación personalizada falla
-   ✅ Formato de datos incorrecto
-   ✅ Valores fuera de rango

### Manejo por CommandHandler

Cuando se lanza un `ValidationError`:

1. Se captura en `executeCommand()` tanto durante la **resolución de argumentos** como durante la **ejecución del comando**
2. Se trata como **error esperado** (al igual que `ReplyError`)
3. Se crea un embed con:
    - Título: "Error de uso"
    - Color: Rojo (#ca5c5c)
    - Descripción: Tu mensaje de error
    - Footer: Usuario que ejecutó
4. Se envía al usuario

**Ejemplo de respuesta:**

```
┌─────────────────────────────────────┐
│ ❌ Error de uso                     │
├─────────────────────────────────────┤
│ El monto debe ser positivo          │
├─────────────────────────────────────┤
│ 👤 John                             │
└─────────────────────────────────────┘
```

**Nota:** `ValidationError` puede ser lanzado en:

-   ✅ Fase de validación de argumentos (decorador `@Arg`)
-   ✅ Durante la ejecución del comando (`run()`)
-   ✅ Dentro de plugins (`onBeforeExecute()`)

En todos los casos, se maneja de la misma forma (error esperado con embed de validación).

### Ejemplos de Uso

#### En Validación de Decorador

```typescript
@Arg({
    name: 'edad',
    index: 0,
    validate: (value: number) => {
        if (value < 18) {
            return 'Debes ser mayor de 18 años'; // Se convierte en ValidationError
        }
        return true;
    }
})
public edad!: number;
```

#### En Método run()

```typescript
export class TransferCommand extends TransferDefinition {
    public async run(): Promise<void> {
        // Validar antes de procesar
        if (this.destinatario.id === this.user.id) {
            throw new ValidationError('No puedes transferir a ti mismo');
        }

        if (this.cantidad > 1000000) {
            throw new ValidationError('Máximo 1,000,000 monedas por transferencia');
        }

        // ... resto de la lógica
    }
}
```

#### Con Múltiples Condiciones

```typescript
public async run(): Promise<void> {
    // Validaciones complejas
    const saldo = await obtenerSaldo(this.user.id);

    if (saldo < this.cantidad) {
        throw new ValidationError(
            `Saldo insuficiente. Tienes: ${saldo}, necesitas: ${this.cantidad}`
        );
    }

    const limiteAcceso = await verificarLimite(this.user.id);

    if (!limiteAcceso) {
        throw new ValidationError(
            'Has alcanzado el límite de transferencias diarias'
        );
    }

    // Procesar transferencia...
}
```

---

## 🚨 ReplyError

### Descripción

Error lanzado para **errores esperados** que deben mostrarse al usuario con un formato específico.

### Ubicación

```typescript
// src/error/ReplyError.ts
```

### Uso

```typescript
import { ReplyError } from '@/error/ReplyError';

if (!tienePermiso) {
    throw new ReplyError('No tienes permisos para usar este comando');
}
```

### Cuándo Usarlo

-   ✅ Usuario sin permisos
-   ✅ Recurso no encontrado
-   ✅ Acción no permitida
-   ✅ Estado inválido del sistema
-   ✅ Operación fallida esperada

### Diferencia con ValidationError

| ValidationError          | ReplyError               |
| ------------------------ | ------------------------ |
| Validación de **inputs** | Error en **ejecución**   |
| "Argumento inválido"     | "Operación no permitida" |
| Antes de procesar        | Durante el procesamiento |
| Título: "Error de uso"   | Título: "Error"          |

### Manejo por CommandHandler

Cuando se lanza un `ReplyError`:

1. Se captura en `executeCommand()`
2. Se crea un embed con:
    - Título: "Error"
    - Color: Rojo (#ca5c5c)
    - Descripción: Tu mensaje de error
    - Footer: "Solicitado por: [usuario]"
3. Se envía al usuario

**Ejemplo de respuesta:**

```
┌─────────────────────────────────────┐
│ ❌ Error                            │
├─────────────────────────────────────┤
│ No tienes permisos para banear      │
├─────────────────────────────────────┤
│ Solicitado por: John                │
└─────────────────────────────────────┘
```

### Ejemplos de Uso

#### Verificar Permisos

```typescript
export class BanCommand extends BanDefinition {
    public async run(): Promise<void> {
        // Verificar permisos
        const member = await this.ctx.guild.members.fetch(this.user.id);

        if (!member.permissions.has('BAN_MEMBERS')) {
            throw new ReplyError('No tienes permiso para banear miembros');
        }

        // Procesar ban...
    }
}
```

#### Recurso No Encontrado

```typescript
export class ProfileCommand extends ProfileDefinition {
    public async run(): Promise<void> {
        const profile = await database.getProfile(this.user.id);

        if (!profile) {
            throw new ReplyError('No tienes un perfil creado. Usa `/register` para crear uno');
        }

        // Mostrar perfil...
    }
}
```

#### Operación Fallida

```typescript
export class ShopCommand extends ShopDefinition {
    public async run(): Promise<void> {
        try {
            await procesarCompra(this.user.id, this.itemId);
        } catch (error) {
            if (error.code === 'INSUFFICIENT_FUNDS') {
                throw new ReplyError('No tienes suficientes monedas para comprar este item');
            }
            if (error.code === 'ITEM_NOT_AVAILABLE') {
                throw new ReplyError('Este item ya no está disponible');
            }
            // Re-lanzar si es otro tipo de error
            throw error;
        }

        await this.reply('¡Compra exitosa!');
    }
}
```

#### Estado Inválido

```typescript
export class StartGameCommand extends StartGameDefinition {
    public async run(): Promise<void> {
        const gameState = await getGameState(this.ctx.guild.id);

        if (gameState.isActive) {
            throw new ReplyError('Ya hay un juego en curso en este servidor');
        }

        if (gameState.players.length < 2) {
            throw new ReplyError('Se necesitan al menos 2 jugadores para empezar');
        }

        // Iniciar juego...
    }
}
```

---

## 🔄 Flujo de Errores

```
Comando Ejecutando
    ↓
    ├─ throw ValidationError → CommandHandler
    │                            ↓
    │                        handleValidationError()
    │                            ↓
    │                        Embed "Error de uso"
    │
    ├─ throw ReplyError → CommandHandler
    │                       ↓
    │                   handleExecutionError()
    │                       ↓
    │                   Embed "Error"
    │
    └─ throw Error → CommandHandler
                        ↓
                    handleExecutionError()
                        ↓
                    Log en consola + Embed genérico
```

## 🎨 Comparación Visual

### ValidationError

```typescript
throw new ValidationError('El monto debe ser mayor a 0');
```

```
╔════════════════════════════════╗
║  ❌ Error de uso              ║
╠════════════════════════════════╣
║  El monto debe ser mayor a 0  ║
╠════════════════════════════════╣
║  👤 Usuario                    ║
╚════════════════════════════════╝
```

### ReplyError

```typescript
throw new ReplyError('No tienes permisos');
```

```
╔════════════════════════════════╗
║  ❌ Error                      ║
╠════════════════════════════════╣
║  No tienes permisos           ║
╠════════════════════════════════╣
║  Solicitado por: Usuario      ║
╚════════════════════════════════╝
```

### Error Genérico

```typescript
throw new Error('Database connection failed');
```

```
╔═══════════════════════════════════════╗
║  ❌ Error                             ║
╠═══════════════════════════════════════╣
║  Ocurrió un error inesperado al      ║
║  procesar el comando. Intenta        ║
║  nuevamente más tarde                ║
╠═══════════════════════════════════════╣
║  Solicitado por: Usuario             ║
╚═══════════════════════════════════════╝

[Consola]: Database connection failed
```

## ✅ Buenas Prácticas

### 1. Usa ValidationError para Inputs

```typescript
// ✅ Correcto
if (this.edad < 0) {
    throw new ValidationError('La edad no puede ser negativa');
}

// ❌ Incorrecto
if (this.edad < 0) {
    throw new ReplyError('La edad no puede ser negativa');
}
```

### 2. Usa ReplyError para Lógica de Negocio

```typescript
// ✅ Correcto
if (!tienePermiso) {
    throw new ReplyError('No tienes permisos');
}

// ❌ Incorrecto
if (!tienePermiso) {
    throw new ValidationError('No tienes permisos');
}
```

### 3. Mensajes Claros y Específicos

```typescript
// ✅ Correcto
throw new ReplyError('No tienes suficientes monedas. Necesitas 100, tienes 50');

// ❌ Incorrecto
throw new ReplyError('Error');
```

### 4. No Expongas Detalles Técnicos

```typescript
// ✅ Correcto
throw new ReplyError('No se pudo completar la operación');

// ❌ Incorrecto
throw new ReplyError('MongoDB connection timeout at pool #3');
```

### 5. Usa Error Genérico para Errores Inesperados

```typescript
// ✅ Correcto - El sistema lo manejará
throw new Error('Unexpected database state');

// ❌ Incorrecto - Expone internos
throw new ReplyError('Unexpected database state');
```

## 📚 Recursos Relacionados

-   `/src/core/handlers/command.handler.ts` - Maneja estos errores
-   `/src/commands/` - Usan estos errores
-   `/src/core/resolvers/argument.resolver.ts` - Lanza ValidationError
