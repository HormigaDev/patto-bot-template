# Configuración de Comandos de Texto

## 📝 Descripción

Este template soporta dos tipos de comandos:

1. **Slash Commands** (`/comando`) - Siempre habilitados
2. **Text Commands** (`!comando`) - Opcionales, controlados por variable de entorno

## ⚙️ Configuración

### Habilitar Comandos de Texto

Para habilitar los comandos de texto (con prefijo `!`), configura la variable de entorno:

```env
USE_MESSAGE_CONTENT=yes
```

### Valores Aceptados

La validación es **insensible a mayúsculas y acentos Unicode**:

✅ Válidos:

-   `yes`
-   `Yes`
-   `YES`
-   `yés`
-   `yês`
-   `YÉS`

❌ Inválidos (deshabilitan comandos de texto):

-   `no`
-   `false`
-   `0`
-   ` ` (vacío)
-   Cualquier otro valor

## 🔑 Intents Requeridos

### Automático (Recomendado)

Si **NO** especificas la variable `INTENTS`, el bot configurará automáticamente los intents necesarios:

-   **Con `USE_MESSAGE_CONTENT=yes`**:

    -   `GatewayIntentBits.Guilds`
    -   `GatewayIntentBits.GuildMessages`
    -   `GatewayIntentBits.MessageContent` ⚠️ **Privilegiado**

-   **Con `USE_MESSAGE_CONTENT` deshabilitado**:
    -   `GatewayIntentBits.Guilds` (solo slash commands)

### Manual

Si especificas la variable `INTENTS` con un número, debes calcular el valor correcto:

```env
# Ejemplo con todos los intents necesarios
INTENTS=3276799
```

## 🌐 Discord Developer Portal

Si habilitas `USE_MESSAGE_CONTENT=yes`, **DEBES** activar el intent privilegiado en el portal:

1. Ve a [Discord Developer Portal](https://discord.com/developers/applications)
2. Selecciona tu aplicación
3. Ve a **Bot** → **Privileged Gateway Intents**
4. Activa: ✅ **MESSAGE CONTENT INTENT**
5. Guarda los cambios

## 📊 Flujo de Validación

```
Inicio
  ↓
¿USE_MESSAGE_CONTENT existe?
  ↓                    ↓
  NO                  SÍ
  ↓                    ↓
Solo Guilds     Normalizar valor
                       ↓
                ¿Es "yes"?
                  ↓         ↓
                 SÍ        NO
                  ↓         ↓
      Guilds + Messages  Solo Guilds
      + MessageContent
                  ↓
            Comandos de texto
            habilitados ✅
```

## 🔍 Logs del Sistema

Al iniciar el bot, verás uno de estos mensajes:

```bash
# Comandos de texto HABILITADOS
✅ Comandos de texto habilitados (USE_MESSAGE_CONTENT=Yes)

# Comandos de texto DESHABILITADOS
⚠️  Comandos de texto deshabilitados (USE_MESSAGE_CONTENT no está configurado como Yes)
```

## ⚡ Ejemplos

### Ejemplo 1: Solo Slash Commands

```env
BOT_TOKEN=tu_token_aqui
CLIENT_ID=tu_client_id_aqui
# USE_MESSAGE_CONTENT no especificado o diferente de "yes"
```

**Resultado**: Solo `/comando` funciona

### Ejemplo 2: Slash + Text Commands

```env
BOT_TOKEN=tu_token_aqui
CLIENT_ID=tu_client_id_aqui
USE_MESSAGE_CONTENT=yes
```

**Resultado**: Tanto `/comando` como `!comando` funcionan

### Ejemplo 3: Con Intents Manuales

```env
BOT_TOKEN=tu_token_aqui
CLIENT_ID=tu_client_id_aqui
USE_MESSAGE_CONTENT=yes
INTENTS=3276799
```

**Resultado**: Usa los intents especificados manualmente

## 🛠️ Troubleshooting

### Error: "Missing Access"

**Causa**: El intent `MESSAGE CONTENT` no está habilitado en el portal

**Solución**: Activa el intent privilegiado en Discord Developer Portal

### Advertencia: "USE_MESSAGE_CONTENT='xxx' no es válido"

**Causa**: El valor no es "yes" (o variante con acentos)

**Solución**: Cambia el valor a `yes`, `Yes`, `yés`, etc.

### Los comandos de texto no funcionan

**Checklist**:

1. ✅ `USE_MESSAGE_CONTENT=yes` en `.env`
2. ✅ Intent **MESSAGE CONTENT** habilitado en Developer Portal
3. ✅ El bot tiene permisos para leer mensajes en el canal
4. ✅ El bot está en el servidor

## 🔒 Seguridad

El intent `MESSAGE CONTENT` es **privilegiado** porque permite al bot leer el contenido de todos los mensajes. Discord lo requiere para:

-   Proteger la privacidad de los usuarios
-   Prevenir uso indebido de datos
-   Cumplir con regulaciones de privacidad

**Recomendación**: Solo habilítalo si realmente necesitas comandos de texto. Los slash commands son más seguros y no requieren intents privilegiados.
