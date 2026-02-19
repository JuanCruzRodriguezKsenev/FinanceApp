"use client";

import { useFormStatus } from "react-dom";

// Ajusta la ruta de importación según tu estructura
import Button from "../Button";
// Si exportaste la interfaz ButtonProps en Button/index.tsx, impórtala también.
// Si no, puedes usar React.ComponentProps<typeof Button>

interface SubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  // Puedes agregar más props que soporte tu Button original si quieres
}

export default function SubmitButton({
  children,
  variant = "primary",
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      isLoading={pending}
      className={className}
      // Deshabilitamos el botón mientras carga para evitar doble envío
      disabled={pending}
    >
      {children}
    </Button>
  );
}
