# Sistema de Temas - FinanceApp

## 📖 Descripción

Sistema completo de temas que permite cambiar entre modo claro, oscuro y automático según las preferencias del sistema. Incluye persistencia en localStorage y prevención de flash durante la carga inicial.

## 🎨 Características

- ✅ **3 modos de tema**: Claro, Oscuro, y Sistema (automático)
- ✅ **Persistencia**: El tema seleccionado se guarda en localStorage
- ✅ **Sin flash**: Script de inicialización previene el flash de tema incorrecto
- ✅ **Sincronización con sistema**: Detecta cambios en las preferencias del sistema operativo
- ✅ **Variables CSS**: Sistema completo de variables para colores y estilos
- ✅ **Transiciones suaves**: Animaciones al cambiar entre temas
- ✅ **Interfaz intuitiva**: Página de configuración fácil de usar

## 🚀 Cómo usar

### En la interfaz

1. Navega a **Settings** en la barra lateral
2. En la sección "Apariencia", selecciona tu tema preferido:
   - ☀️ **Claro**: Tema claro permanente
   - 🌙 **Oscuro**: Tema oscuro permanente
   - 💻 **Sistema**: Sigue las preferencias de tu sistema operativo

### En tu código

#### Usar el hook `useTheme`

```tsx
"use client";

import { useTheme } from "@/contexts";

export function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div>
      <p>Tema actual: {theme}</p>
      <p>Tema resuelto: {resolvedTheme}</p>
      <button onClick={() => setTheme("dark")}>Modo Oscuro</button>
    </div>
  );
}
```

#### Usar variables CSS

```css
.myComponent {
  /* Colores de fondo */
  background-color: var(--bg-primary); /* Fondo principal */
  background-color: var(--bg-secondary); /* Fondo secundario */
  background-color: var(--bg-tertiary); /* Fondo terciario */
  background-color: var(--bg-hover); /* Fondo al hacer hover */

  /* Colores de texto */
  color: var(--text-primary); /* Texto principal */
  color: var(--text-secondary); /* Texto secundario */
  color: var(--text-tertiary); /* Texto terciario */
  color: var(--text-inverse); /* Texto inverso */

  /* Bordes */
  border-color: var(--border-primary); /* Borde principal */
  border-color: var(--border-secondary); /* Borde secundario */

  /* Transiciones */
  transition:
    background-color var(--transition-normal),
    color var(--transition-normal);
}
```

## 📁 Estructura de archivos

```
src/
├── contexts/
│   ├── ThemeProvider.tsx    # Provider de contexto para temas
│   └── index.ts             # Exportaciones
├── app/
│   ├── layout.tsx           # Layout con ThemeProvider integrado
│   ├── globals.css          # Variables CSS para temas
│   └── settings/
│       ├── page.tsx         # Página de configuración
│       └── settings.module.css
```

## 🎨 Variables CSS disponibles

### Colores de fondo

- `--bg-primary`: Fondo principal de la aplicación
- `--bg-secondary`: Fondo secundario (tarjetas, secciones)
- `--bg-tertiary`: Fondo terciario (elementos destacados)
- `--bg-hover`: Fondo al hacer hover

### Colores de texto

- `--text-primary`: Texto principal (alta legibilidad)
- `--text-secondary`: Texto secundario (media legibilidad)
- `--text-tertiary`: Texto terciario (baja legibilidad, hints)
- `--text-inverse`: Texto inverso (sobre fondos oscuros/claros)

### Colores de borde

- `--border-primary`: Bordes principales
- `--border-secondary`: Bordes secundarios (más sutiles)

### Colores de estado

- `--color-primary`: Color primario de la marca
- `--color-success`: Verde para éxito
- `--color-warning`: Amarillo para advertencias
- `--color-danger`: Rojo para errores
- `--color-info`: Azul para información

## 🔧 Extensibilidad

### Agregar una nueva paleta de colores

El sistema está preparado para soportar múltiples paletas de colores. Para agregar una:

1. En `ThemeProvider.tsx`, extiende el tipo `Theme`:

```tsx
export type Theme = "light" | "dark" | "system";
export type ColorScheme = "default" | "blue" | "green" | "purple";
```

2. En `globals.css`, define las variables para cada paleta:

```css
html[data-color-scheme="blue"] {
  --color-primary: #2563eb;
  --color-primary-light: #60a5fa;
  --color-primary-dark: #1e40af;
}
```

3. Actualiza la página de `settings/page.tsx` para mostrar las opciones de paleta.

### Agregar una nueva preferencia

1. Crea un nuevo estado en `ThemeProvider.tsx`
2. Persiste el valor en localStorage
3. Actualiza la interfaz en `settings/page.tsx`

## 📝 Mejores prácticas

1. **Siempre usa variables CSS** en lugar de colores hardcodeados
2. **Añade transiciones** para cambios de color suaves
3. **Prueba ambos temas** al desarrollar nuevos componentes
4. **Usa colores semánticos**: `--text-primary`, `--bg-primary`, etc. en lugar de `--color-gray-900`

## 🐛 Troubleshooting

### El tema no persiste

- Verifica que localStorage esté habilitado en el navegador
- Comprueba que no haya errores en la consola del navegador

### Flash de tema incorrecto

- Asegúrate de que el script en `layout.tsx` esté en la etiqueta `<head>`
- Verifica que `suppressHydrationWarning` esté en la etiqueta `<html>`

### Los colores no cambian

- Revisa que estés usando las variables CSS correctas
- Verifica que el componente use CSS modules o esté en `globals.css`

## 🚀 Próximas mejoras

- [ ] Selector de paleta de colores personalizadas
- [ ] Tema de alto contraste para accesibilidad
- [ ] Exportar/importar configuración de tema
- [ ] Previsualización en tiempo real
- [ ] Modo nocturno automático basado en horario
