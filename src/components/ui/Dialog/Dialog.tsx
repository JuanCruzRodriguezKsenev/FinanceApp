"use client";

import { useEffect, ReactNode, useRef } from "react";
import styles from "./Dialog.module.css";
import Button from "../Buttons/Button";

/**
 * Props para el componente Dialog
 */
interface DialogProps {
  /** Si el diálogo está abierto */
  open: boolean;
  /** Callback cuando se cierra */
  onClose: () => void;
  /** Título del diálogo */
  title: string;
  /** Contenido del diálogo */
  children: ReactNode;
  /** Variante de diseño */
  variant?: "default" | "fullScreen";
}

/**
 * Componente Dialog modal con animaciones y focus trap
 *
 * @example
 * <Dialog open={isOpen} onClose={closeDialog} title="Confirmar">
 *   ¿Estás seguro?
 * </Dialog>
 */
export default function Dialog({
  open,
  onClose,
  title,
  children,
  variant = "default",
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const FOCUSABLE_SELECTOR =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const getFocusableElements = () =>
    dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [];

  useEffect(() => {
    const toggleBodyScroll = (locked: boolean) => {
      document.body.style.overflow = locked ? "hidden" : "";
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      // Focus trap: mantener el foco dentro del dialog
      if (event.key === "Tab") {
        const focusableElements = getFocusableElements();

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab: si está en el primero, ir al último
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab: si está en el último, ir al primero
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    if (open) {
      // Guardar el elemento activo antes de abrir el dialog
      previousActiveElement.current = document.activeElement as HTMLElement;

      toggleBodyScroll(true);
      window.addEventListener("keydown", handleKeyDown);

      // Enfocar el primer elemento enfocable del dialog
      setTimeout(() => {
        getFocusableElements()[0]?.focus();
      }, 0);
    } else {
      toggleBodyScroll(false);
      // Restaurar el foco al elemento anterior
      previousActiveElement.current?.focus();
    }

    return () => {
      toggleBodyScroll(false);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${
          variant === "fullScreen" ? styles.fullScreen : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            className={styles.closeButton}
            aria-label="Cerrar diálogo"
          >
            ✕
          </Button>
        </div>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
