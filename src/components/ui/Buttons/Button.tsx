"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";
import { BUTTON_VARIANTS, ButtonVariant } from "@/constants/globals";

/**
 * Props para el componente Button
 * @property variant - Estilo visual del botón (default: "primary")
 * @property isLoading - Muestra estado de carga (default: false)
 * @property children - Contenido del botón
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  isLoading?: boolean;
}

/**
 * Componente Button reutilizable con múltiples variantes
 *
 * @example
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 */
export default function Button({
  children,
  variant = "primary",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${className}`}
      disabled={isLoading || disabled}
      aria-busy={isLoading}
      aria-disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <span className={styles.loader} aria-label="Loading">
          ...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
