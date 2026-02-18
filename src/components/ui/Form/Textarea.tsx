import { TextareaHTMLAttributes, forwardRef } from "react";
import styles from "./Form.module.css";
import FormField from "./FormField";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", rows = 3, ...props }, ref) => {
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
        <textarea
          ref={ref}
          rows={rows}
          className={`${styles.control} ${error ? styles.errorControl : ""}`}
          style={{ resize: "vertical", minHeight: "80px" }}
          aria-invalid={!!error}
          aria-describedby={errorId}
          {...props}
        />
      </FormField>
    );
  },
);

Textarea.displayName = "Textarea";
export default Textarea;
