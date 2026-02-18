# 🧭 Navbar Component - Documentación

Un componente de navbar genérico, altamente modularizado y flexible para Next.js/React. Soporta múltiples posiciones, direcciones y está completamente personalizable.

## 📦 Estructura

```
Navbar/
├── Navbar.tsx                    # Componente principal
├── Navbar.module.css            # Estilos principales
├── index.ts                     # Exportaciones
├── sections/
│   ├── NavbarBrand.tsx         # Logo/Marca
│   ├── NavbarBrand.module.css
│   ├── NavbarNav.tsx           # Lista de ítems de navegación
│   ├── NavbarNav.module.css
│   ├── NavbarItem.tsx          # Ítem individual de navegación
│   ├── NavbarItem.module.css
│   ├── NavbarEnd.tsx           # Sección derecha
│   ├── NavbarEnd.module.css
│   ├── NavbarDivider.tsx       # Divisor
│   └── NavbarDivider.module.css
└── EJEMPLOS.tsx                # Ejemplos de uso
```

## 🚀 Uso Rápido

```tsx
import {
  Navbar,
  NavbarBrand,
  NavbarNav,
  NavbarItem,
  NavbarEnd,
} from "@/components/ui/Navbar";

export function MyNavbar() {
  return (
    <Navbar position="top" sticky shadow>
      <NavbarBrand>MyApp</NavbarBrand>

      <NavbarNav>
        <NavbarItem href="/dashboard" active>
          Dashboard
        </NavbarItem>
        <NavbarItem href="/settings">Settings</NavbarItem>
      </NavbarNav>

      <NavbarEnd>
        <NavbarItem href="/logout">Logout</NavbarItem>
      </NavbarEnd>
    </Navbar>
  );
}
```

## 📋 Componentes

### **Navbar** (Principal)

| Prop        | Tipo                                     | Default              | Descripción                               |
| ----------- | ---------------------------------------- | -------------------- | ----------------------------------------- |
| `position`  | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'`              | Ubicación del navbar                      |
| `direction` | `'row' \| 'column'`                      | `'row'`              | Dirección del flujo (horizontal/vertical) |
| `sticky`    | `boolean`                                | `false`              | Fijo al hacer scroll                      |
| `shadow`    | `boolean`                                | `true`               | Mostrar sombra                            |
| `padding`   | `'small' \| 'medium' \| 'large'`         | `'medium'`           | Espaciado interno                         |
| `bgColor`   | `string`                                 | `'var(--navbar-bg)'` | Color de fondo personalizado              |
| `className` | `string`                                 | `''`                 | Clases CSS adicionales                    |

### **NavbarBrand**

Sección para logo y marca de la aplicación.

```tsx
<NavbarBrand href="/">💰 FinanceApp</NavbarBrand>
```

| Prop        | Tipo         | Descripción                   |
| ----------- | ------------ | ----------------------------- |
| `href`      | `string`     | Link de navegación (opcional) |
| `onClick`   | `() => void` | Acción al hacer click         |
| `className` | `string`     | Clases CSS adicionales        |

### **NavbarNav**

Contenedor para items de navegación.

```tsx
<NavbarNav align="center" gap="large">
  <NavbarItem href="/home">Home</NavbarItem>
  <NavbarItem href="/about">About</NavbarItem>
</NavbarNav>
```

| Prop        | Tipo                             | Default    | Descripción            |
| ----------- | -------------------------------- | ---------- | ---------------------- |
| `align`     | `'start' \| 'center' \| 'end'`   | `'start'`  | Alineación             |
| `gap`       | `'small' \| 'medium' \| 'large'` | `'medium'` | Espaciado entre items  |
| `className` | `string`                         | `''`       | Clases CSS adicionales |

### **NavbarItem**

Ítem individual de navegación.

```tsx
<NavbarItem href="/dashboard" active>
  Dashboard
</NavbarItem>
```

| Prop        | Tipo         | Default     | Descripción                   |
| ----------- | ------------ | ----------- | ----------------------------- |
| `href`      | `string`     | `undefined` | Link de navegación (opcional) |
| `onClick`   | `() => void` | `undefined` | Acción al hacer click         |
| `active`    | `boolean`    | `false`     | Marcar como activo            |
| `disabled`  | `boolean`    | `false`     | Deshabilitado                 |
| `className` | `string`     | `''`        | Clases CSS adicionales        |

### **NavbarEnd**

Sección de la derecha (auto alineada al final).

```tsx
<NavbarEnd gap="medium">
  <NavbarItem href="/profile">Profile</NavbarItem>
  <NavbarItem href="/logout">Logout</NavbarItem>
</NavbarEnd>
```

| Prop        | Tipo                             | Default    | Descripción            |
| ----------- | -------------------------------- | ---------- | ---------------------- |
| `gap`       | `'small' \| 'medium' \| 'large'` | `'medium'` | Espaciado entre items  |
| `className` | `string`                         | `''`       | Clases CSS adicionales |

### **NavbarDivider**

Divisor visual entre secciones.

```tsx
<NavbarDivider vertical={false} />
```

| Prop        | Tipo      | Default | Descripción                   |
| ----------- | --------- | ------- | ----------------------------- |
| `vertical`  | `boolean` | `false` | Divisor vertical u horizontal |
| `className` | `string`  | `''`    | Clases CSS adicionales        |

## 🎨 Personalización con CSS Variables

Personaliza los colores y estilos sin modificar código:

```css
:root {
  --navbar-bg: #ffffff;
  --navbar-text: #000000;
  --navbar-text-hover: #333333;
  --navbar-active-text: #4f46e5;
  --navbar-active-bg: rgba(79, 70, 229, 0.1);
  --navbar-hover-bg: rgba(0, 0, 0, 0.05);
  --navbar-disabled-text: #9ca3af;
  --navbar-divider: #e5e7eb;
  --navbar-focus: #4f46e5;
}
```

## 💡 Casos de Uso

### 1. **Navbar Top (Dashboard)**

```tsx
<Navbar position="top" sticky shadow>
  <NavbarBrand>FinanceApp</NavbarBrand>
  <NavbarNav>
    <NavbarItem href="/dashboard" active>
      Dashboard
    </NavbarItem>
    <NavbarItem href="/transactions">Transactions</NavbarItem>
  </NavbarNav>
  <NavbarEnd>
    <NavbarItem href="/settings">⚙️</NavbarItem>
    <NavbarItem href="/logout">Logout</NavbarItem>
  </NavbarEnd>
</Navbar>
```

### 2. **Sidebar Izquierdo**

```tsx
<Navbar position="left" direction="column" padding="large">
  <NavbarBrand>App</NavbarBrand>
  <NavbarNav align="start" gap="small">
    <NavbarItem href="/dashboard" active>
      Dashboard
    </NavbarItem>
    <NavbarItem href="/transactions">Transactions</NavbarItem>
  </NavbarNav>
  <div style={{ marginTop: "auto" }}>
    <NavbarItem href="/settings">Settings</NavbarItem>
  </div>
</Navbar>
```

### 3. **Bottom Navigation (Mobile)**

```tsx
<Navbar position="bottom" direction="row">
  <NavbarNav align="center" gap="medium">
    <NavbarItem href="/">Home</NavbarItem>
    <NavbarItem href="/search">Search</NavbarItem>
    <NavbarItem href="/profile">Profile</NavbarItem>
  </NavbarNav>
</Navbar>
```

### 4. **Navbar Personalizado (Gradiente)**

```tsx
<Navbar
  bgColor="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  position="top"
  sticky
>
  {/* ... */}
</Navbar>
```

## ♿ Accesibilidad

- ✅ Soporte para navegación con teclado (Tab, Enter, Space)
- ✅ Focus visible para todos los elementos interactivos
- ✅ Roles ARIA apropiados
- ✅ Contraste de colores adecuado

## 📱 Responsive

El navbar es responsive por defecto:

- En móviles, los sidebars (left/right) pueden ocultarse con CSS
- Los gaps se ajustan automáticamente
- Los items se adaptan al ancho disponible

## 🔧 Ejemplos Avanzados

Ver [EJEMPLOS.tsx](./EJEMPLOS.tsx) para:

- Navbar top estándar
- Bottom navbar
- Left sidebar
- Right sidebar
- Navbar vertical
- Navbar personalizado con gradiente
- Navbar responsive completo

## 📋 Notas

- **Modularidad**: Cada componente es independiente y reutilizable
- **Flexibilidad**: Soporta cualquier combinación de posición y dirección
- **Personalización**: Totalmente personalizable con props y CSS
- **Accesibilidad**: Cumple con estándares WCAG
- **Performance**: Usa CSS modules para optimizar
