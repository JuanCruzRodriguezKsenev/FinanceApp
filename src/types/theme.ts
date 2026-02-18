/**
 * Tipos de temas disponibles en la aplicación
 */
export type Theme = "light" | "dark" | "system";

/**
 * Contexto del tema con métodos para cambiar el tema
 */
export interface ThemeContextType {
  /** Tema actual seleccionado por el usuario */
  theme: Theme;
  /** Función para cambiar el tema */
  setTheme: (theme: Theme) => void;
  /** Tema resuelto actual (light o dark), considerando las preferencias del sistema */
  resolvedTheme: "light" | "dark";
}

/**
 * Variables CSS disponibles para temas
 * Estas son las variables CSS personalizadas que puedes usar en tus estilos
 */
export interface CSSThemeVariables {
  // Colores de fondo
  "--bg-primary": string;
  "--bg-secondary": string;
  "--bg-tertiary": string;
  "--bg-hover": string;

  // Colores de texto
  "--text-primary": string;
  "--text-secondary": string;
  "--text-tertiary": string;
  "--text-inverse": string;

  // Colores de borde
  "--border-primary": string;
  "--border-secondary": string;

  // Colores de marca y estados
  "--color-primary": string;
  "--color-primary-light": string;
  "--color-primary-dark": string;
  "--color-success": string;
  "--color-warning": string;
  "--color-danger": string;
  "--color-info": string;

  // Sombras
  "--shadow-sm": string;
  "--shadow-md": string;
  "--shadow-lg": string;
  "--shadow-xl": string;
  "--shadow-2xl": string;

  // Espaciados
  "--spacing-xs": string;
  "--spacing-sm": string;
  "--spacing-md": string;
  "--spacing-lg": string;
  "--spacing-xl": string;
  "--spacing-2xl": string;
  "--spacing-3xl": string;
  "--spacing-4xl": string;

  // Bordes
  "--border-radius-sm": string;
  "--border-radius-md": string;
  "--border-radius-lg": string;
  "--border-radius-xl": string;
  "--border-radius-2xl": string;
  "--border-radius-full": string;

  // Transiciones
  "--transition-fast": string;
  "--transition-normal": string;
  "--transition-slow": string;
  "--transition-slower": string;
}

/**
 * Opciones de tema para el selector
 */
export interface ThemeOption {
  value: Theme;
  label: string;
  description: string;
  icon: string;
}

/**
 * Configuración del tema guardada en localStorage
 */
export interface ThemeConfig {
  theme: Theme;
  lastUpdated?: number;
}
