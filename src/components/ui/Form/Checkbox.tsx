import { forwardRef,InputHTMLAttributes } from "react";

import styles from "./Form.module.css";

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  description?: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className, ...props }, ref) => {
    const errorId = error && props.id ? `${props.id}-error` : undefined;

    return (
      <div className={`${styles.checkboxWrapper} ${className || ""}`}>
        <label className={styles.checkboxLabel}>
          <input
            ref={ref}
            type="checkbox"
            className={styles.checkboxInput}
            aria-invalid={!!error}
            aria-describedby={errorId}
            {...props}
          />
          <span
            className={`${styles.checkboxCustom} ${error ? styles.checkboxCustomError : ""}`}
          ></span>
          {label && (
            <span className={styles.checkboxText}>
              {label}
              {props.required && <span className={styles.required}> *</span>}
            </span>
          )}
        </label>
        {description && (
          <span className={styles.checkboxDescription}>{description}</span>
        )}
        {error && (
          <span className={styles.errorText} id={errorId}>
            {error}
          </span>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
export default Checkbox;
