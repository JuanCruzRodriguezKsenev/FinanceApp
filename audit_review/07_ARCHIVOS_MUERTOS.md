# 7️⃣ Análisis de Archivos y Código Muerto

**Fecha:** 18 Febrero 2026

---

## 📊 Resumen

Identificación de archivos, carpetas y código sin usar en el proyecto.

**Hallazgos:**

- ⚠️ Archivos de ejemplo en src/
- ⚠️ Archivos de test UI en app/
- ✅ Generalmente bien limpio
- ? Necesita validación con herramientas

---

## ⚠️ Archivos Potencialmente Muertos

### 1. Archivos de Ejemplo/Demo ⚠️

**Ubicación detectada:**

```
src/components/ui/Navbar/EJEMPLOS.tsx    ❌ Ejemplo en código fuente
src/app/ui-test/page.tsx                 ⚠️ Página de test manual
```

**Status:** Debería moverse a `/examples/`

**Impacto:**

- 🟡 Aumenta bundle size
- 🟡 Confunde desarrolladores
- 🟡 No debería estar en src/ producción

**Solución:**

```bash
# Mover a carpeta examples
mkdir -p examples/components/navbar
mkdir -p examples/pages/ui-test

# Mover archivos
mv src/components/ui/Navbar/EJEMPLOS.tsx examples/components/navbar/
mv src/app/ui-test/page.tsx examples/pages/
```

---

### 2. Posibles Archivos Duplicados o Sin Usar ⚠️

**Necesita verificación:**

```
src/proxy.ts                   ❓ ¿Cuál es el propósito? ¿Se usa?
src/lib/auth.config.ts         ❓ Vs src/lib/auth.ts - confusión
src/lib/formMediator.ts        ❓ Vs useForm.ts - duplicado?
src/app/cards/constants.ts     ❓ ¿Se usa? ¿Relacionado con UI?
```

---

### 3. Carpetas Potencialmente Vacías o Sin Usar ⚠️

**Verificar:**

```
src/shared/lib/auth/actions.ts      ❓ vs src/lib/auth.ts
src/app/auth/                       ❓ Auth pages - vs components/auth/
src/app/cards/                      ❓ Qué es? ¿Tarjetas? ¿Se usa?
src/app/settings/                   ❓ Página settings - contenido?
src/app/dashboard/                  ❓ Dashboard page - contenido?
```

---

## ✅ Lo que está BIEN (Código limpio)

### 1. No hay /utils duplicate ✅

```
src/lib/                ✅ Únicos utils centralizados
src/features/*/utils/   ✅ Utils específicas de feature (pocos)
```

### 2. No hay /components duplicados ✅

```
src/components/         ✅ Genéricos
src/features/*/components/  ✅ Feature-específicos
```

### 3. No hay imports masivos sin usar ✅

- ESLint está configurado para detectarlos
- Necesita validación

---

## 🔍 Herramientas para Detectar Código Muerto

### 1. Next.js Unused

```bash
npm install -D next-unused
npx next-unused
```

**Output esperado:**

```
Unused files found:
- src/proxy.ts
- src/app/ui-test/page.tsx
- src/components/ui/Navbar/EJEMPLOS.tsx
```

---

### 2. Depcheck (Dependencias sin usar)

```bash
npm install -D depcheck
npx depcheck
```

**Encuentra:**

- Dependencias en package.json no importadas
- Ej: si instalaste `lodash` pero no lo usas

---

### 3. Unimported (Imports sin resultado)

```bash
npm install -D unimported
npx unimported
```

**Encuentra:**

- Imports de archivos que no existen
- Imports sin resolver

---

## 🎯 Plan de Limpieza

### Paso 1: Ejecutar Detectores (30 minutos)

```bash
# 1. Instalar herramientas
npm install -D next-unused depcheck unimported

# 2. Ejecutar análisis
npx next-unused > unused-files.txt
npx depcheck > unused-deps.txt
npx unimported > unresolved-imports.txt

# 3. Revisar resultados
cat unused-files.txt
cat unused-deps.txt
cat unresolved-imports.txt
```

---

### Paso 2: Revisar Manualmente (1-2 horas)

Para cada archivo detectado como muerto:

1. ¿Se usa en otros archivos? (grep -r)
2. ¿Debería moverse? (a examples/)
3. ¿Debería eliminarse?

**Ejemplo:**

```bash
# Verificar si proxy.ts se importa en algún lado
grep -r "from.*proxy" src/

# Verificar si se usa dirección
grep -r "proxy" src/ | grep -v ".next/"
```

---

### Paso 3: Mover a Examples (1 hora)

```bash
# Crear estructura de examples
mkdir -p examples/{components,pages,patterns}

# Mover archivos
mv src/components/ui/Navbar/EJEMPLOS.tsx examples/components/navbar-examples.tsx
mv src/app/ui-test/page.tsx examples/pages/ui-test-demo.tsx

# Crear README en examples/
cat > examples/README.md << 'EOF'
# Examples Directory

Código de demostración y ejemplos de uso.

## Contenido
- components/ - Ejemplos de componentes UI
- pages/ - Páginas de demostración
- patterns/ - Patrones de arquitectura

## Nota
Este contenido NO se incluye en build de producción.
EOF
```

---

### Paso 4: Eliminar Archivos Definitivamente Muertos (30 minutos)

```bash
# Crear backup antes de eliminar
mkdir -p backup-deleted-$(date +%Y%m%d)

# Mover en lugar de eliminar (safer)
mv src/proxy.ts backup-deleted-$(date +%Y%m%d)/ 2>/dev/null || true

# Verificar que todo sigue funcionando
npm run build
npm run test
```

---

## 📋 Checklist de Código Muerto

- [ ] Instalar herramientas de detección
- [ ] Ejecutar `npx next-unused`
- [ ] Ejecutar `npx depcheck`
- [ ] Ejecutar `npx unimported`
- [ ] Documentar hallazgos en [RESULTADOS_MUERTOS.md](./RESULTADOS_MUERTOS.md)
- [ ] Mover EJEMPLOS.tsx a examples/
- [ ] Mover ui-test/page.tsx a examples/
- [ ] Revisar src/proxy.ts
- [ ] Revisar src/lib/auth.config.ts vs auth.ts
- [ ] Revisar src/app/cards/
- [ ] Crear examples/README.md
- [ ] Actualizar .gitignore si aplica
- [ ] Ejecutar build y tests para validar

---

## 🚀 Estimación

| Tarea          | Esfuerzo | ROI           |
| -------------- | -------- | ------------- |
| Detectar       | 0.5h     | Alto          |
| Revisar        | 1.5h     | Medio         |
| Mover/Eliminar | 1h       | Medio         |
| Validar        | 1h       | Alto          |
| **Total**      | **4h**   | **ROI = 4/5** |

---

## 📊 Meta esperada

- ✅ 0 archivos de ejemplo en src/
- ✅ 0 dependencias sin usar
- ✅ 0 imports sin resolver
- ✅ ~/examples/ bien organizado
- ✅ Build exitoso sin warnings

---

## 🔗 Siguiente: [09_PLAN_ACCION.md](./09_PLAN_ACCION.md)
