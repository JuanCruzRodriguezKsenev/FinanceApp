import { forwardRef, ReactNode,SelectHTMLAttributes } from "react";

import styles from "./Form.module.css";
import FormField from "./FormField";

/**
 * Props para Select
 */
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Etiqueta */
  label?: string;
  /** Mensaje de error */
  error?: string;
  /** Opciones */
  children: ReactNode;
}

/**
 * Componente Select reutilizable
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, children, className = "", ...props }, ref) => {
    const errorId = error && props.id ? `${props.id}-error` : undefined;

    return (
      <FormField
        id={props.id}
        label={label}
        required={props.required}
        error={error}
        errorId={errorId}
        className={className}
      >
        <div className={styles.selectWrapper}>
          <select
            ref={ref}
            className={`${styles.control} ${error ? styles.errorControl : ""}`}
            aria-invalid={!!error}
            aria-describedby={errorId}
            {...props}
          >
            {children}
          </select>

          <svg
            className={styles.selectArrow}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </FormField>
    );
  },
);

Select.displayName = "Select";
export default Select;
