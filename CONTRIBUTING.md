# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a **Patto Bot Template**! Este documento te guiará en el proceso de contribución.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [¿Cómo Puedo Contribuir?](#cómo-puedo-contribuir)
- [Reportar Bugs](#reportar-bugs)
- [Sugerir Features](#sugerir-features)
- [Pull Requests](#pull-requests)
- [Guías de Estilo](#guías-de-estilo)
- [Desarrollo Local](#desarrollo-local)
- [Testing](#testing)
- [Documentación](#documentación)

## 📜 Código de Conducta

Este proyecto y todos sus participantes están regidos por nuestro [Código de Conducta](CODE_OF_CONDUCT.md). Al participar, se espera que respetes este código.

## 🎯 ¿Cómo Puedo Contribuir?

### 🐛 Reportar Bugs

Los bugs se rastrean como [GitHub Issues](https://github.com/HormigaDev/patto-bot-template/issues). Para reportar un bug:

1. **Verifica** que el bug no haya sido reportado antes
2. **Usa el template** de bug report
3. **Incluye detalles**:
    - Descripción clara del problema
    - Pasos para reproducir
    - Comportamiento esperado vs actual
    - Screenshots si aplican
    - Versiones (Node.js, Discord.js, OS)
    - Logs relevantes

**Ejemplo de buen reporte:**

```markdown
**Descripción**: El comando /ping no responde en servidores grandes

**Pasos para reproducir**:

1. Invitar el bot a un servidor con 1000+ miembros
2. Ejecutar /ping
3. El bot no responde

**Esperado**: El bot debería responder con la latencia

**Versiones**:

- Node.js: v20.0.0
- Discord.js: 14.16.3
- OS: Ubuntu 22.04

**Logs**:
```

```txt
Error: Timeout waiting for interaction response
```

### 💡 Sugerir Features

Las sugerencias de features también se manejan como Issues:

1. **Verifica** que no exista una sugerencia similar
2. **Usa el template** de feature request
3. **Describe**:
    - El problema que resuelve
    - La solución propuesta
    - Alternativas consideradas
    - Contexto adicional

### 🔧 Pull Requests

#### Proceso

1. **Fork** el repositorio
2. **Crea una rama** desde `master`:

    ```bash
    git checkout -b feature/mi-feature
    # o
    git checkout -b fix/mi-fix
    ```

3. **Desarrolla** tu cambio:
    - Sigue las [guías de estilo](#guías-de-estilo)
    - Agrega tests si es necesario
    - Actualiza documentación si aplica

4. **Verifica calidad** antes de commitear:

    ```bash
    # Ejecutar linter y formatear
    npm run lint
    npm run format

    # Ejecutar tests
    npm test
    ```

5. **Commitea** tus cambios:

    ```bash
    git commit -m "feat: descripción del cambio"
    ```

    Ver [Conventional Commits](#conventional-commits)

6. **Push** a tu fork:

    ```bash
    git push origin feature/mi-feature
    ```

7. **Abre un Pull Request** en GitHub

#### Checklist para PRs

Antes de enviar tu PR, verifica:

- [ ] El código sigue las guías de estilo
- [ ] **Linting pasa sin errores** (`npm run lint`)
- [ ] **Código está formateado** (`npm run format`)
- [ ] Los tests pasan (`npm test`)
- [ ] Agregaste tests para nuevo código
- [ ] Actualizaste la documentación
- [ ] El commit sigue Conventional Commits
- [ ] No hay conflictos con `master`
- [ ] La descripción del PR es clara

**⚠️ Importante**: Ejecuta `npm run lint` y `npm run format` antes de hacer push para evitar fallos en CI/CD.

#### Template de PR

```markdown
## Descripción

Breve descripción de los cambios

## Tipo de cambio

- [ ] Bug fix
- [ ] Nueva feature
- [ ] Breaking change
- [ ] Documentación

## ¿Cómo se ha probado?

Describe las pruebas realizadas

## Checklist

- [ ] Tests pasan
- [ ] Documentación actualizada
- [ ] Código sigue guías de estilo
```

## 🎨 Guías de Estilo

### TypeScript

Seguimos las mejores prácticas de TypeScript:

```typescript
// ✅ BIEN
export class MyCommand extends BaseCommand {
    private readonly logger: Logger;

    constructor() {
        super();
        this.logger = new Logger('MyCommand');
    }

    public async run(): Promise<void> {
        // Implementación
    }
}

// ❌ MAL
export class mycommand {
    logger;

    run() {
        // Implementación
    }
}
```

**Reglas clave:**

- ✅ Usa `PascalCase` para clases e interfaces
- ✅ Usa `camelCase` para variables y métodos
- ✅ Usa `UPPER_SNAKE_CASE` para constantes
- ✅ Siempre tipifica (no uses `any` sin razón)
- ✅ Usa `async/await` en lugar de `.then()`
- ✅ Exporta solo lo necesario
- ✅ Documenta con JSDoc

### Nombres de Archivos

```
✅ BIEN:
src/commands/ping.command.ts
src/plugins/cooldown.plugin.ts
src/utils/TimeUtils.ts
tests/unit/plugins/permissions.plugin.test.ts

❌ MAL:
src/commands/PingCommand.ts
src/plugins/cooldownPlugin.ts
src/utils/time-utils.ts
tests/PermissionsTest.ts
```

### Conventional Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/) para mensajes de commit:

```bash
# Features
git commit -m "feat(commands): agregar comando de moderación"
git commit -m "feat(plugins): nuevo plugin de cooldowns"

# Fixes
git commit -m "fix(handlers): corregir error en message handler"
git commit -m "fix(permissions): validación incorrecta de permisos"

# Documentación
git commit -m "docs(readme): actualizar guía de instalación"
git commit -m "docs(plugins): documentar sistema de scopes"

# Tests
git commit -m "test(permissions): agregar tests de integración"

# Refactoring
git commit -m "refactor(core): simplificar command loader"

# Chores
git commit -m "chore(deps): actualizar discord.js a 14.16.3"
```

**Tipos disponibles:**

- `feat`: Nueva feature
- `fix`: Bug fix
- `docs`: Documentación
- `style`: Formateo (no afecta código)
- `refactor`: Refactorización
- `test`: Tests
- `chore`: Mantenimiento
- `perf`: Performance
- `ci`: CI/CD

### Documentación

Todo código público debe estar documentado:

````typescript
/**
 * Comando para banear usuarios del servidor.
 * Requiere el permiso BanMembers.
 *
 * @example
 * ```typescript
 * /ban @usuario razón del baneo
 * ```
 */
@Command({
    name: 'ban',
    description: 'Banea un usuario del servidor',
})
@RequirePermissions(Permissions.BanMembers)
export class BanCommand extends BaseCommand {
    /**
     * Usuario objetivo del baneo
     */
    @Arg({
        name: 'usuario',
        description: 'Usuario a banear',
        index: 0,
        required: true,
    })
    public usuario!: User;

    /**
     * Ejecuta el comando de baneo.
     * Valida permisos y envía mensaje de confirmación.
     */
    public async run(): Promise<void> {
        // Implementación
    }
}
````

## 💻 Desarrollo Local

### Setup Inicial

```bash
# 1. Fork y clonar
git clone https://github.com/TU_USUARIO/patto-bot-template.git
cd patto-bot-template

# 2. Instalar dependencias
npm install

# 3. Configurar entorno
cp .env.template .env
# Edita .env con tus credenciales

# 4. Ejecutar en desarrollo
npm run dev
```

### Estructura del Proyecto

```
src/
├── commands/       # Implementaciones de comandos
├── core/          # Sistema core (no tocar sin necesidad)
├── definition/    # Definiciones de comandos
├── plugins/       # Plugins del sistema
└── utils/         # Utilidades

tests/
├── unit/          # Tests unitarios
├── integration/   # Tests de integración
└── mocks/         # Mocks de Discord.js
```

### Scripts Disponibles

```bash
npm run dev           # Desarrollo con hot reload
npm run build         # Compilar TypeScript
npm start             # Ejecutar compilado
npm test              # Todos los tests
npm run test:watch    # Tests en modo watch
npm run test:coverage # Coverage report
npm run lint          # Linting con ESLint
npm run format        # Formatear código con Prettier
```

### 🔧 Workflow Recomendado

Antes de hacer commit, ejecuta siempre:

```bash
# 1. Formatear código
npm run format

# 2. Verificar linting
npm run lint

# 3. Ejecutar tests
npm test

# 4. Si todo pasa, hacer commit
git add .
git commit -m "feat: tu mensaje"
```

**💡 Pro tip**: Considera usar git hooks para automatizar esto (ej: husky + lint-staged).

## 🧪 Testing

### Escribir Tests

Todo nuevo código debe incluir tests:

```typescript
// tests/unit/commands/ping.command.test.ts
import { PingCommand } from '@/commands/ping.command';
import { createMockInteraction } from '@tests/mocks/discord.mock';

describe('PingCommand', () => {
    let command: PingCommand;

    beforeEach(() => {
        command = new PingCommand();
    });

    it('should respond with latency', async () => {
        const interaction = createMockInteraction();
        (command as any).ctx = { interaction };

        await command.run();

        expect(interaction.reply).toHaveBeenCalled();
    });
});
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Por categoría
npm run test:unit
npm run test:integration

# Archivo específico
npm test -- ping.command.test.ts

# Con coverage
npm run test:coverage
```

### Coverage Mínimo

- **Funciones**: 80%
- **Líneas**: 80%
- **Branches**: 70%

## 📝 Documentación

### Actualizar Documentación

Si tu cambio afecta comportamiento existente:

1. **README.md** - Si afecta uso general
2. **ARCHITECTURE.md** - Si afecta arquitectura
3. **CHANGELOG.md** - Agregar entrada en [Unreleased]
4. **JSDoc** - Actualizar comentarios en código
5. **README específicos** - En carpetas afectadas

### Estructura de Documentación

````markdown
# Título Principal

## Descripción breve

## Uso

### Ejemplo Básico

```typescript
// Código de ejemplo
```
````

### Ejemplo Avanzado

```typescript
// Código más complejo
```

## API

### Método1

Descripción

**Parámetros:**

- `param1` (tipo): descripción
- `param2` (tipo): descripción

**Retorna:** tipo - descripción

## Ejemplos Adicionales

## Ver También

- [Link relacionado](#)

```

## 🎯 Prioridades

### Alta Prioridad
- 🐛 Bugs críticos (crashea el bot)
- 🔒 Vulnerabilidades de seguridad
- 📚 Documentación faltante importante

### Media Prioridad
- ✨ Features solicitadas frecuentemente
- 🧪 Mejorar coverage de tests
- ♻️ Refactorización necesaria

### Baja Prioridad
- 💄 Mejoras estéticas
- 📝 Documentación adicional
- 🎨 Optimizaciones menores

## ❓ ¿Preguntas?

Si tienes preguntas sobre cómo contribuir:

1. **Revisa** la documentación existente
2. **Busca** en Issues cerrados
3. **Abre** un Issue con la etiqueta `question`
4. **Únete** a nuestro [Discord](https://discord.gg/x79VjB37vQ)

## 🙏 Agradecimientos

¡Gracias por contribuir a hacer este template mejor para todos!

### Top Contributors

<!-- Esto se actualizará automáticamente -->

---

**Happy Coding! 🚀**
```
