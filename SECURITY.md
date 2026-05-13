# 🔒 Política de Seguridad

## 📋 Versiones Soportadas

Actualmente estamos dando soporte de seguridad a las siguientes versiones:

| Versión | Soportada          |
| ------- | ------------------ |
| 1.4.x   | :white_check_mark: |
| 1.3.x   | :x:                |
| < 1.3   | :x:                |

> **Nota:** Siempre recomendamos usar la última versión estable para obtener las últimas correcciones de seguridad.

---

## 🐛 Reportar una Vulnerabilidad

Si descubres una vulnerabilidad de seguridad en este proyecto, por favor ayúdanos a mantener el proyecto seguro siguiendo estos pasos:

### 1️⃣ **NO crear un Issue público**

Las vulnerabilidades de seguridad **no deben** ser reportadas mediante issues públicos de GitHub, ya que esto podría exponer a los usuarios actuales a riesgos.

### 2️⃣ **Contacto Privado**

Por favor, reporta las vulnerabilidades de forma privada usando uno de estos métodos:

#### Método Preferido: GitHub Security Advisories

1. Ve a la pestaña **Security** del repositorio
2. Haz clic en **Report a vulnerability**
3. Completa el formulario con los detalles

#### Método Alternativo: Email Directo

- 📧 **Email:** [hormigadev7@gmail.com]
- 🔐 Usa el asunto: `[SECURITY] Descripción breve`

### 3️⃣ **Información a Incluir**

Para ayudarnos a entender y resolver el problema rápidamente, por favor incluye:

- **Tipo de vulnerabilidad** (ej: XSS, SQL Injection, RCE, etc.)
- **Ubicación exacta** del código vulnerable (archivo y línea si es posible)
- **Descripción detallada** del problema
- **Pasos para reproducir** la vulnerabilidad
- **Impacto potencial** (qué podría hacer un atacante)
- **Posible solución** (si tienes alguna idea)
- **Tu información de contacto** (para seguimiento)

#### Ejemplo de Reporte

```markdown
**Tipo:** Inyección de Comandos
**Ubicación:** src/commands/execute.command.ts línea 42
**Descripción:** El comando `execute` no sanitiza correctamente la entrada del usuario
**Reproducción:**

1. Ejecutar `/execute ls && rm -rf /`
2. El comando se ejecuta sin validación
   **Impacto:** Un usuario malicioso podría ejecutar comandos arbitrarios en el servidor
   **Solución Propuesta:** Implementar whitelist de comandos permitidos
```

---

## ⏱️ Proceso de Respuesta

Te mantendremos informado sobre el progreso de tu reporte:

| Tiempo          | Acción                                          |
| --------------- | ----------------------------------------------- |
| **24-48 horas** | Confirmación de recepción del reporte           |
| **3-5 días**    | Evaluación inicial y clasificación de severidad |
| **7-14 días**   | Plan de acción y timeline de corrección         |
| **30 días**     | Corrección implementada y lanzamiento de parche |

### Clasificación de Severidad

Usamos el siguiente criterio para clasificar vulnerabilidades:

- 🔴 **Crítica:** Explotación remota sin autenticación, compromiso total del sistema
- 🟠 **Alta:** Explotación requiere autenticación, compromiso parcial del sistema
- 🟡 **Media:** Explotación requiere condiciones específicas, impacto limitado
- 🟢 **Baja:** Impacto mínimo, requiere acceso privilegiado o interacción compleja

---

## 🏆 Reconocimiento

Valoramos enormemente el trabajo de los investigadores de seguridad que nos ayudan a mantener el proyecto seguro.

### Hall of Fame

Los investigadores que reporten vulnerabilidades válidas serán reconocidos aquí (con su permiso):

<!-- Lista de contribuidores de seguridad -->

- _Aún no hay reportes_

### Recompensas

Actualmente este es un proyecto de código abierto sin financiamiento, por lo que no podemos ofrecer recompensas monetarias. Sin embargo, ofrecemos:

- ✅ **Reconocimiento público** en este archivo y en el CHANGELOG
- ✅ **Mención en el release** de la versión que corrija la vulnerabilidad
- ✅ **Agradecimiento especial** en redes sociales del proyecto
- ✅ **Badge de contributor** en GitHub

---

## 🛡️ Mejores Prácticas de Seguridad

Si vas a usar este template para tu bot, te recomendamos seguir estas prácticas:

### 🔑 Gestión de Secretos

- ❌ **NUNCA** subas tu `.env` al repositorio
- ✅ Usa variables de entorno para tokens y credenciales
- ✅ Rota tu token del bot si crees que fue comprometido
- ✅ Usa `.gitignore` correctamente (ya incluido en el template)

### 🔐 Permisos del Bot

- ✅ Solo solicita **permisos mínimos necesarios** al invitar el bot
- ✅ Revisa regularmente los permisos que usa tu bot
- ❌ No uses el permiso `Administrator` a menos que sea absolutamente necesario

### 📦 Dependencias

- ✅ Mantén las dependencias **actualizadas** regularmente
- ✅ Usa `npm audit` para detectar vulnerabilidades conocidas
- ✅ Revisa las dependencias antes de agregarlas al proyecto

```bash
# Revisar vulnerabilidades
npm audit

# Corregir vulnerabilidades automáticamente (cuando sea posible)
npm audit fix
```

### 🔍 Validación de Entrada

- ✅ **Siempre valida** los argumentos de comandos
- ✅ Usa las funciones de validación del decorador `@Arg`
- ✅ Sanitiza entrada del usuario antes de usarla en embed o mensajes
- ✅ Implementa rate limiting para prevenir abuso

### 🚫 Datos Sensibles

- ❌ No almacenes contraseñas en texto plano
- ❌ No registres tokens o credenciales en logs
- ✅ Implementa RBAC (Role-Based Access Control) para comandos admin
- ✅ Usa canales privados para información sensible

---

## 📚 Recursos Adicionales

Para aprender más sobre seguridad en bots de Discord:

- 📖 [Discord Developer Security Best Practices](https://discord.com/developers/docs/topics/security)
- 📖 [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- 📖 [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- 📖 [npm Security Documentation](https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities)

---

## 📞 Contacto

Para consultas de seguridad:

- 📧 Email: [hormigadev7@gmail.com]
- 🐙 GitHub: [@HormigaDev](https://github.com/HormigaDev)

Para otros temas, por favor usa los [Issues de GitHub](https://github.com/HormigaDev/patto-bot-template/issues).

---

**Gracias por ayudarnos a mantener este proyecto seguro para toda la comunidad! 🙏**
