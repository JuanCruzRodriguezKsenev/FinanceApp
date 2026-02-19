import { forwardRef, InputHTMLAttributes, ReactNode } from "react";

import styles from "./Form.module.css";
import FormField from "./FormField";

/**
 * Props para el componente Input
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Etiqueta del input */
  label?: string;
  /** Mensaje de error */
  error?: string;
  /** Icono al inicio del input (ej: $, €) */
  startIcon?: ReactNode;
  /** Desactiva flechas, rueda y teclas en inputs number */
  disableNumberControls?: boolean;
}

/**
 * Componente Input con soporte para etiqueta, error e iconos
 *
 * @example
 * <Input label="Monto" type="number" error="Campo requerido" startIcon="$" />
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      className = "",
      startIcon,
      disableNumberControls = false,
      ...props
    },
    ref,
  ) => {
    const errorId = error && props.id ? `${props.id}-error` : undefined;
    const isNumber = props.type === "number";
    const shouldDisableNumberControls = isNumber && disableNumberControls;

    const handleWheel: InputProps["onWheel"] = (event) => {
      props.onWheel?.(event);
      if (event.defaultPrevented || !shouldDisableNumberControls) return;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.blur();
    };

    const handleKeyDown: InputProps["onKeyDown"] = (event) => {
      props.onKeyDown?.(event);
      if (event.defaultPrevented || !shouldDisableNumberControls) return;
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
      }
    };

    return (
      <FormField
        id={props.id}
        label={label}
        required={props.required}
        error={error}
        errorId={errorId}
        className={className}
      >
        <div className={styles.inputWrapper}>
          {startIcon && <span className={styles.icon}>{startIcon}</span>}

          <input
            ref={ref}
            className={`${styles.control} ${error ? styles.errorControl : ""} ${startIcon ? styles.hasIcon : ""} ${shouldDisableNumberControls ? styles.noNumberControls : ""}`}
            aria-invalid={!!error}
            aria-describedby={errorId}
            onWheel={shouldDisableNumberControls ? handleWheel : props.onWheel}
            onWheelCapture={
              shouldDisableNumberControls ? handleWheel : props.onWheelCapture
            }
            onKeyDown={
              shouldDisableNumberControls ? handleKeyDown : props.onKeyDown
            }
            {...props}
          />
        </div>
      </FormField>
    );
  },
);

Input.displayName = "Input";
export default Input;
