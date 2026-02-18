"use client";

import { ReactNode, ComponentProps } from "react";
import styles from "./Form.module.css";

// Importaciones corregidas (ajusta según tu estructura real)
import Button from "../Buttons/Button";
import SubmitButton from "../Buttons/Submit/Submit";
import Input from "./Input";
import Select from "./Select";
import SelectCustom from "./SelectCustom";
import PasswordInput from "./PasswordInput";
import Textarea from "./Textarea";
import RadioGroup from "./RadioGroup";
import Checkbox from "./Checkbox";
import FormField from "./FormField";

/**
 * Props para el componente Form
 */
interface FormProps extends Omit<
  ComponentProps<"form">,
  "action" | "className"
> {
  /** Función que maneja el envío del formulario */
  action: (formData: FormData) => void | Promise<void>;
  /** Contenido del formulario */
  children: ReactNode;
  /** Texto del botón de envío (default: "Guardar") */
  submitLabel?: string;
  /** Texto del botón de cancelación (default: "Cancelar") */
  cancelLabel?: string;
  /** Callback cuando se presiona cancelar */
  onCancel?: () => void;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente Form que integra campos de entrada
 *
 * @example
 * <Form action={handleSubmit} onCancel={handleCancel}>
 *   <Form.Input label="Nombre" name="name" />
 *   <Form.Select label="País">
 *     <option>España</option>
 *   </Form.Select>
 * </Form>
 */
function Form({
  action,
  children,
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  onCancel,
  className,
  ...props
}: FormProps) {
  return (
    <form
      action={action}
      className={`${styles.form} ${className || ""}`}
      {...props}
    >
      <div className={styles.fields}>{children}</div>

      <div className={styles.footer}>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

export default Object.assign(Form, {
  Input,
  Select,
  SelectCustom,
  PasswordInput,
  Textarea,
  RadioGroup,
  Checkbox,
  Field: FormField,
});
