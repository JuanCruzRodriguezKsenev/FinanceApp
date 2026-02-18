# Patrón Observer: ThemeProvider

## Descripción

El `ThemeProvider` implementa el **Patrón Observer** para gestionar y sincronizar el tema visual en toda la aplicación.

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│          ThemeProvider (Subject)                │
│  - Mantiene estado: theme, resolvedTheme        │
│  - Lista de observers: Todos los componentes    │
│    que usan useTheme()                          │
│  - Notifica cambios automáticamente             │
└─────────────────┬───────────────────────────────┘
                  │ notify() cuando theme cambia
                  │
                  ├──────────────┬──────────────┬──────────────┐
                  ▼              ▼              ▼              ▼
         ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
         │ ThemeToggle│  │  AppNavbar │  │   Button   │  │    Card    │
         │ (Observer) │  │ (Observer) │  │ (Observer) │  │ (Observer) │
         └────────────┘  └────────────┘  └────────────┘  └────────────┘
         Re-renderiza    Cambia colores  Cambia estilo   Cambia fondo
         automáticamente automáticamente automáticamente automáticamente
```

## Componentes del Patrón

### 1. Subject (ThemeProvider)

El contexto que mantiene el estado del tema y notifica a todos los observers:

```tsx
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Notificar cambios aplicando clases CSS
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    root.setAttribute("data-theme", resolved);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 2. Observer Interface (useTheme hook)

Hook que permite a los componentes suscribirse al Subject:

```tsx
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme debe usarse dentro de un ThemeProvider");
  }
  return context;
}
```

### 3. Concrete Observers (Componentes consumidores)

Cualquier componente que use el hook `useTheme()` se convierte en un observer:

```tsx
function ThemeToggle() {
  const { theme, setTheme } = useTheme(); // 👈 Subscribe al Subject

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      Cambiar tema
    </button>
  );
}
```

## Flujo de Actualización

1. **Usuario cambia el tema** en ThemeToggle

   ```tsx
   setTheme("dark");
   ```

2. **Subject notifica el cambio**
   - Actualiza `theme` state
   - Guarda en localStorage
   - Aplica clases CSS al `<html>`

3. **Todos los Observers reaccionan**
   - ThemeToggle actualiza su UI
   - AppNavbar cambia colores
   - Buttons cambian estilos
   - Cards actualizan fondos

4. **Sincronización completa**
   - Todo ocurre en un solo render cycle
   - No se requiere prop drilling
   - Componentes desacoplados

## Observador Adicional: MediaQuery

El ThemeProvider también implementa un **segundo nivel de Observer** para el tema del sistema:

```tsx
useEffect(() => {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  // Observer que escucha cambios en la preferencia del sistema
  const handleChange = () => {
    if (theme === "system") {
      updateResolvedTheme();
    }
  };

  mediaQuery.addEventListener("change", handleChange);
  return () => mediaQuery.removeEventListener("change", handleChange);
}, [theme]);
```

### Diagrama de doble observación:

```
┌──────────────────────┐
│   Sistema Operativo  │
│   (Tema del sistema) │
└──────────┬───────────┘
           │ notify()
           ▼
┌──────────────────────┐
│   MediaQuery API     │
│   (Subject)          │
└──────────┬───────────┘
           │ addEventListener('change')
           ▼
┌──────────────────────┐           notify()
│   ThemeProvider      │ ───────────────────────► Componentes
│   (Observer/Subject) │                          de la App
└──────────────────────┘
```

## Ventajas de esta Implementación

### ✅ Desacoplamiento Total

Los componentes no necesitan conocerse entre sí. Cada uno solo conoce al ThemeProvider.

### ✅ Sincronización Automática

Todos los observers se actualizan automáticamente sin intervención manual.

### ✅ Persistencia

El tema se guarda en localStorage y persiste entre sesiones.

### ✅ Responsive al Sistema

Detecta y responde a cambios en la preferencia del sistema operativo.

### ✅ Fácil de Extender

Agregar nuevos observers es tan simple como usar el hook `useTheme()`.

### ✅ Rendimiento Optimizado

React Context optimiza los re-renders solo a componentes que usan el contexto.

## Cómo Usar

### 1. Envolver la aplicación con el Provider

```tsx
// app/layout.tsx
import { ThemeProvider } from "@/contexts/ThemeProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. Suscribirse al tema en cualquier componente

```tsx
// Cualquier componente
import { useTheme } from "@/contexts/ThemeProvider";

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className={`component ${resolvedTheme}`}>{/* Tu contenido */}</div>
  );
}
```

### 3. Usar CSS basado en tema

```css
/* globals.css */
:root[data-theme="light"] {
  --background: #ffffff;
  --text: #000000;
}

:root[data-theme="dark"] {
  --background: #000000;
  --text: #ffffff;
}
```

## Comparación con Alternativas

### Sin Observer Pattern (Prop Drilling)

```tsx
// ❌ Malo: Pasar props manualmente
<App theme={theme}>
  <Navbar theme={theme}>
    <Button theme={theme}>
      <Icon theme={theme} />
    </Button>
  </Navbar>
</App>
```

### Con Observer Pattern (Actual)

```tsx
// ✅ Bueno: Cada componente se suscribe
<App>
  <Navbar /> {/* useTheme() internamente */}
  <Button /> {/* useTheme() internamente */}
  <Icon /> {/* useTheme() internamente */}
</App>
```

## Referencias

- [Patrón Observer - Refactoring Guru](https://refactoring.guru/design-patterns/observer)
- [React Context API](https://react.dev/reference/react/createContext)
- [Hooks de React](https://react.dev/reference/react)
