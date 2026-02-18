/**
 * EJEMPLO DE USO DEL COMPONENTE NAVBAR
 *
 * El navbar es totalmente modularizado y flexible:
 * - Posiciones: top, bottom, left, right
 * - Direcciones: row (horizontal), column (vertical)
 * - Secc iones: Brand, Nav, End, Divider
 * - Personalizable con props y variables CSS
 */

import {
  Navbar,
  NavbarBrand,
  NavbarNav,
  NavbarItem,
  NavbarEnd,
  NavbarDivider,
} from "@/components/ui/Navbar";

// ============================================================
// EJEMPLO 1: Navbar TOP (Por defecto) - Estándar
// ============================================================
export function TopNavbarExample() {
  return (
    <Navbar position="top" direction="row" sticky shadow padding="medium">
      <NavbarBrand onClick={() => console.log("Home")}>
        💰 FinanceApp
      </NavbarBrand>

      <NavbarNav align="center" gap="medium">
        <NavbarItem href="/dashboard" active>
          Dashboard
        </NavbarItem>
        <NavbarItem href="/transactions">Transactions</NavbarItem>
        <NavbarItem href="/accounts">Accounts</NavbarItem>
      </NavbarNav>

      <NavbarEnd gap="medium">
        <input type="search" placeholder="Search..." />
        <NavbarItem href="/profile">Profile</NavbarItem>
        <NavbarItem>Logout</NavbarItem>
      </NavbarEnd>
    </Navbar>
  );
}

// ============================================================
// EJEMPLO 2: Navbar BOTTOM - Pie de página
// ============================================================
export function BottomNavbarExample() {
  return (
    <Navbar position="bottom" direction="row" shadow padding="small">
      <NavbarNav align="center" gap="large">
        <NavbarItem href="/">Home</NavbarItem>
        <NavbarItem href="/about">About</NavbarItem>
        <NavbarItem href="/contact">Contact</NavbarItem>
      </NavbarNav>
    </Navbar>
  );
}

// ============================================================
// EJEMPLO 3: Navbar LEFT - Sidebar
// ============================================================
export function LeftSidebarExample() {
  return (
    <Navbar position="left" direction="column" padding="large">
      <NavbarBrand>App</NavbarBrand>
      <NavbarDivider vertical />

      <NavbarNav align="start" gap="small" className="w-full flex-col">
        <NavbarItem href="/dashboard" active>
          📊 Dashboard
        </NavbarItem>
        <NavbarItem href="/transactions">💳 Transactions</NavbarItem>
        <NavbarItem href="/accounts">🏦 Accounts</NavbarItem>
        <NavbarItem href="/analytics">📈 Analytics</NavbarItem>
      </NavbarNav>

      <div style={{ marginTop: "auto" }}>
        <NavbarDivider vertical />
        <NavbarNav align="start" gap="small" className="w-full flex-col">
          <NavbarItem href="/settings">⚙️ Settings</NavbarItem>
          <NavbarItem href="/help">❓ Help</NavbarItem>
        </NavbarNav>
      </div>
    </Navbar>
  );
}

// ============================================================
// EJEMPLO 4: Navbar RIGHT - Sidebar derecho
// ============================================================
export function RightSidebarExample() {
  return (
    <Navbar position="right" direction="column" padding="medium">
      <NavbarNav align="center" gap="medium">
        <NavbarItem href="/notifications">🔔</NavbarItem>
        <NavbarItem href="/messages">💬</NavbarItem>
        <NavbarItem href="/settings">⚙️</NavbarItem>
      </NavbarNav>
    </Navbar>
  );
}

// ============================================================
// EJEMPLO 5: Navbar VERTICAL (Column) - Completo
// ============================================================
export function VerticalNavbarExample() {
  return (
    <Navbar position="top" direction="column" padding="medium">
      <NavbarBrand>My App</NavbarBrand>

      <NavbarNav align="start" gap="small">
        <NavbarItem href="/">Home</NavbarItem>
        <NavbarItem href="/about">About</NavbarItem>
        <NavbarItem href="/contact">Contact</NavbarItem>
      </NavbarNav>

      <NavbarEnd gap="small">
        <NavbarItem>Login</NavbarItem>
      </NavbarEnd>
    </Navbar>
  );
}

// ============================================================
// EJEMPLO 6: Navbar PERSONALIZADO con CSS Variables
// ============================================================
export function CustomStyledNavbar() {
  const customStyles = `
    :root {
      --navbar-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --navbar-text: #ffffff;
      --navbar-text-hover: #f0f0f0;
      --navbar-active-text: #ffd700;
      --navbar-active-bg: rgba(255, 215, 0, 0.2);
      --navbar-hover-bg: rgba(255, 255, 255, 0.1);
      --navbar-divider: rgba(255, 255, 255, 0.3);
      --navbar-focus: #ffd700;
    }
  `;

  return (
    <>
      <style>{customStyles}</style>
      <Navbar sticky shadow padding="large">
        <NavbarBrand>🚀 Premium App</NavbarBrand>

        <NavbarNav gap="large">
          <NavbarItem href="/" active>
            Home
          </NavbarItem>
          <NavbarItem href="/features">Features</NavbarItem>
          <NavbarItem href="/pricing">Pricing</NavbarItem>
        </NavbarNav>

        <NavbarEnd gap="medium">
          <NavbarItem href="/login">Sign In</NavbarItem>
          <NavbarItem href="/signup">Get Started</NavbarItem>
        </NavbarEnd>
      </Navbar>
    </>
  );
}

// ============================================================
// EJEMPLO 7: Navbar RESPONSIVE con Secciones
// ============================================================
export function ResponsiveNavbarExample() {
  return (
    <Navbar position="top" sticky padding="medium" shadow>
      {/* Sección 1: Brand */}
      <NavbarBrand href="/">💼 FinanceApp</NavbarBrand>

      {/* Separador */}
      <NavbarDivider />

      {/* Sección 2: Navegación principal */}
      <NavbarNav align="center" gap="medium">
        <NavbarItem href="/dashboard">Dashboard</NavbarItem>
        <NavbarItem href="/transactions">Transacciones</NavbarItem>
        <NavbarItem href="/budgets">Presupuestos</NavbarItem>
        <NavbarItem href="/analytics">Analytics</NavbarItem>
      </NavbarNav>

      {/* Sección 3: Derecha (Usuario, acciones) */}
      <NavbarEnd gap="medium">
        <NavbarItem>🔍 Search</NavbarItem>
        <NavbarDivider />
        <NavbarItem href="/profile">👤 Mi Perfil</NavbarItem>
        <NavbarItem href="/settings">⚙️ Settings</NavbarItem>
        <NavbarItem href="/logout">🚪 Logout</NavbarItem>
      </NavbarEnd>
    </Navbar>
  );
}

// ============================================================
// PROPS DISPONIBLES
// ============================================================
/*

NAVBAR:
- position: 'top' | 'bottom' | 'left' | 'right' (default: 'top')
- direction: 'row' | 'column' (default: 'row')
- sticky: boolean (default: false)
- shadow: boolean (default: true)
- padding: 'small' | 'medium' | 'large' (default: 'medium')
- bgColor: string (CSS color)
- className: string (custom CSS classes)

NAVBARBRAND:
- href: string (opcional, para navegación)
- onClick: () => void
- className: string

NAVBARNAV:
- align: 'start' | 'center' | 'end' (default: 'start')
- gap: 'small' | 'medium' | 'large' (default: 'medium')
- className: string

NAVBARITEM:
- href: string (opcional, si no hay href usa onClick)
- onClick: () => void
- active: boolean
- disabled: boolean
- className: string

NAVBAREND:
- gap: 'small' | 'medium' | 'large' (default: 'medium')
- className: string

NAVBARDIVIDER:
- vertical: boolean (default: false)
- className: string

============================================================
CSS VARIABLES PERSONALIZABLES:
============================================================
--navbar-bg: color de fondo
--navbar-text: color de texto
--navbar-text-hover: color al pasar el ratón
--navbar-active-text: color del texto activo
--navbar-active-bg: color de fondo activo
--navbar-hover-bg: color de fondo al pasar el ratón
--navbar-disabled-text: color de texto deshabilitado
--navbar-divider: color del divisor
--navbar-focus: color del focus (accesibilidad)
*/
