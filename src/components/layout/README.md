# 🧭 AppNavbar Component

Componente de navegación principal de la aplicación que implementa un sidebar izquierdo usando el componente `Navbar` genérico.

## 📍 Ubicación

`src/components/layout/AppNavbar.tsx`

## ✨ Características

✅ **Sidebar izquierdo fijo** - Navegación persistente en la parte izquierda
✅ **Secciones organizadas** - Agrupa links en diferentes categorías
✅ **Links activos** - Indica automáticamente la página actual
✅ **Responsivo** - Se adapta a mobile (drawer que se abre/cierra)
✅ **Accesibilidad** - Navegación por teclado y focus visible

## 📦 Estructura

```
AppNavbar
├── Brand (Logo + Nombre de app)
├── Divider
├── Principal (Home, Dashboard, Transactions)
├── Divider
├── Auth (Login, Register)
├── Divider
├── Desarrollo (Navbar Examples)
├── Espaciador
├── Divider
└── Usuario (Profile, Settings)
```

## 🚀 Uso

El componente se implementa automáticamente en `src/app/layout.tsx`:

```tsx
import { AppNavbar } from "@/components/layout/AppNavbar";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <div className="app-layout">
          <AppNavbar />
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
```

## 🎨 Personalización

### Agregar nuevas páginas al navbar:

1. Edita `src/components/layout/AppNavbar.tsx`
2. Agrega un nuevo `<NavbarItem>` en la sección correspondiente:

```tsx
<NavbarItem href="/mi-nueva-pagina" active={isActive("/mi-nueva-pagina")}>
  🎯 Mi Nueva Página
</NavbarItem>
```

3. Usa `pathname === '/ruta'` o `isActive('/ruta')` para activar el estado

### Estilo CSS

Los estilos se encuentran en `src/components/layout/AppNavbar.module.css`:

- `.appNavbar` - Container principal
- `.brand` - Logo y nombre
- `.section` - Sección de navegación
- `.sectionTitle` - Título de sección
- `.navList` - Lista de items

## 📱 Responsive

En pantallas menores a 768px:

- El sidebar se convierte en un drawer
- Se posiciona fijo a la izquierda
- Se oculta por defecto
- Puede activarse con un botón hamburguesa

## 🔗 Links actuales

### Principal

- 🏠 Home `/`
- 📊 Dashboard `/dashboard`
- 💳 Transactions `/transactions`

### Auth

- 🔐 Login `/auth/login`
- ✍️ Register `/auth/register`

### Desarrollo

- 🧭 Navbar Examples `/navbar-examples`

### Usuario

- 👤 Profile `/profile` (próximamente)
- ⚙️ Settings `/settings` (próximamente)

## 🎯 Próximas mejoras

- [ ] Botón hamburguesa para mobile
- [ ] Collapse de secciones
- [ ] Submenu items
- [ ] Iconos dinámicos
- [ ] Indicador de notificaciones
