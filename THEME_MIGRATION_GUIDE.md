# Guía de Migración de Componentes al Sistema de Temas

## 🎯 Objetivo

Esta guía te ayudará a actualizar componentes existentes o crear nuevos que sean compatibles con el sistema de temas claro/oscuro.

## 📋 Checklist para componentes

Al crear o actualizar un componente, asegúrate de:

- [ ] Usar variables CSS en lugar de colores hardcodeados
- [ ] Añadir transiciones para cambios de color
- [ ] Probar en ambos temas (claro y oscuro)
- [ ] Verificar que el contraste sea adecuado
- [ ] Actualizar el CSS module si usas uno

## 🔄 Proceso de migración

### 1. Identificar colores hardcodeados

❌ **Antes:**

```css
.myComponent {
  background-color: #ffffff;
  color: #1f2937;
  border: 1px solid #e5e7eb;
}
```

✅ **Después:**

```css
.myComponent {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  transition:
    background-color var(--transition-normal),
    color var(--transition-normal),
    border-color var(--transition-normal);
}
```

### 2. Mapeo de colores comunes

| Color hardcodeado    | Variable CSS recomendada                            |
| -------------------- | --------------------------------------------------- |
| `#ffffff`, `white`   | `var(--bg-primary)`                                 |
| `#f9fafb`, `#f3f4f6` | `var(--bg-secondary)` o `var(--bg-tertiary)`        |
| `#1f2937`, `#111827` | `var(--text-primary)`                               |
| `#6b7280`, `#9ca3af` | `var(--text-secondary)` o `var(--text-tertiary)`    |
| `#e5e7eb`, `#d1d5db` | `var(--border-primary)` o `var(--border-secondary)` |
| `#3b82f6`            | `var(--color-primary)`                              |

### 3. Añadir transiciones

Siempre incluye transiciones para que el cambio de tema sea suave:

```css
.myComponent {
  /* Tus estilos... */
  transition:
    background-color var(--transition-normal),
    color var(--transition-normal),
    border-color var(--transition-normal);
}
```

### 4. Estados hover y focus

❌ **Antes:**

```css
.button:hover {
  background-color: #f3f4f6;
}
```

✅ **Después:**

```css
.button:hover {
  background-color: var(--bg-hover);
}
```

## 🎨 Variables CSS por categoría

### Fondos (Backgrounds)

```css
/* Fondo principal de la página/app */
background-color: var(--bg-primary);

/* Fondo de tarjetas, paneles, secciones */
background-color: var(--bg-secondary);

/* Fondo de elementos destacados o terciarios */
background-color: var(--bg-tertiary);

/* Fondo al hacer hover sobre elementos interactivos */
background-color: var(--bg-hover);
```

### Texto

```css
/* Texto principal, alta legibilidad */
color: var(--text-primary);

/* Texto secundario, descripciones */
color: var(--text-secondary);

/* Texto terciario, hints, placeholders */
color: var(--text-tertiary);

/* Texto sobre fondos oscuros (en tema claro) o claros (en tema oscuro) */
color: var(--text-inverse);
```

### Bordes

```css
/* Bordes principales de tarjetas, inputs, etc */
border-color: var(--border-primary);

/* Bordes más sutiles, divisores */
border-color: var(--border-secondary);
```

### Estados y colores de marca

```css
/* Color primario de la aplicación */
color: var(--color-primary);
background-color: var(--color-primary);

/* Estados */
color: var(--color-success); /* Verde */
color: var(--color-warning); /* Amarillo */
color: var(--color-danger); /* Rojo */
color: var(--color-info); /* Azul */
```

## 📝 Ejemplos prácticos

### Ejemplo 1: Botón

```css
.button {
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--color-primary);
  color: var(--text-inverse);
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius-lg);
  transition: all var(--transition-fast);
}

.button:hover {
  background-color: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.buttonSecondary {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border-color: var(--border-primary);
}

.buttonSecondary:hover {
  background-color: var(--bg-hover);
  border-color: var(--color-primary);
}
```

### Ejemplo 2: Tarjeta

```css
.card {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.cardTitle {
  color: var(--text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-md);
}

.cardDescription {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}
```

### Ejemplo 3: Input

```css
.input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-lg);
  transition: all var(--transition-fast);
}

.input::placeholder {
  color: var(--text-tertiary);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input:disabled {
  background-color: var(--bg-tertiary);
  color: var(--text-tertiary);
  cursor: not-allowed;
  opacity: 0.6;
}
```

### Ejemplo 4: Tabla

```css
.table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--bg-primary);
}

.tableHeader {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
  border-bottom: 2px solid var(--border-primary);
  padding: var(--spacing-md);
  text-align: left;
  transition: background-color var(--transition-normal);
}

.tableCell {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-primary);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.tableRow:hover .tableCell {
  background-color: var(--bg-hover);
}
```

## 🧪 Testing

### Checklist de pruebas

1. **Tema claro**
   - [ ] Los colores son legibles
   - [ ] El contraste es adecuado
   - [ ] Los estados hover son visibles

2. **Tema oscuro**
   - [ ] Los colores son legibles
   - [ ] El contraste es adecuado
   - [ ] No hay elementos que se vean "quemados" (demasiado brillantes)

3. **Transiciones**
   - [ ] El cambio de tema es suave
   - [ ] No hay flashes o cambios bruscos
   - [ ] Las animaciones funcionan en ambos temas

4. **Accesibilidad**
   - [ ] El contraste cumple con WCAG AA (mínimo 4.5:1 para texto normal)
   - [ ] Los focus states son visibles
   - [ ] Los elementos interactivos son distinguibles

## 🚫 Errores comunes

### 1. Mezclar colores hardcodeados con variables

❌ **Mal:**

```css
.component {
  background-color: var(--bg-primary);
  color: #1f2937; /* ← Hardcoded! */
}
```

✅ **Bien:**

```css
.component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

### 2. Olvidar transiciones

❌ **Mal:**

```css
.component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

✅ **Bien:**

```css
.component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition:
    background-color var(--transition-normal),
    color var(--transition-normal);
}
```

### 3. Usar variables incorrectas

❌ **Mal:**

```css
.text {
  color: var(--bg-primary); /* ← Variable de fondo para texto! */
}
```

✅ **Bien:**

```css
.text {
  color: var(--text-primary);
}
```

### 4. Sombras estáticas

❌ **Mal:**

```css
.card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

✅ **Bien:**

```css
.card {
  box-shadow: var(--shadow-md);
}
```

## 💡 Tips y mejores prácticas

1. **Sé consistente**: Usa siempre las mismas variables para los mismos propósitos
2. **Usa nombres semánticos**: Prefiere `--text-primary` sobre `--color-gray-900`
3. **Añade transiciones**: Haz que los cambios sean suaves
4. **Prueba en ambos temas**: Siempre verifica cómo se ve en claro y oscuro
5. **Considera el contraste**: Especialmente importante en tema oscuro
6. **Usa las utilidades de globals.css**: Ya hay clases predefinidas que puedes usar

## 🔗 Recursos adicionales

- [THEME_SYSTEM.md](./THEME_SYSTEM.md) - Documentación completa del sistema
- [src/app/globals.css](./src/app/globals.css) - Variables CSS definidas
- [src/contexts/ThemeProvider.tsx](./src/contexts/ThemeProvider.tsx) - Lógica del tema
- [src/app/settings/page.tsx](./src/app/settings/page.tsx) - Ejemplo de uso del hook
