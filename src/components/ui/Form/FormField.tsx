import { ReactNode } from "react";
import styles from "./Form.module.css";

interface FormFieldProps {
  id?: string;
  label?: string;
  labelFor?: string;
  required?: boolean;
  error?: string;
  errorId?: string;
  className?: string;
  children: ReactNode;
}

export default function FormField({
  id,
  label,
  labelFor,
  required,
  error,
  errorId,
  className = "",
  children,
}: FormFieldProps) {
  return (
    <div className={`${styles.group} ${className}`}>
      {label && (
        <label className={styles.label} htmlFor={labelFor ?? id}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      {children}
      {error && (
        <span className={styles.errorText} id={errorId}>
          {error}
        </span>
      )}
    </div>
  );
}
