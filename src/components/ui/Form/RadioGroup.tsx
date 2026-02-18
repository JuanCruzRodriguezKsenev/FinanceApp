// src/components/ui/Form/RadioGroup.tsx
import styles from "./Form.module.css";

interface RadioOption {
  value: string | number;
  label: string;
  color?: string;
}

interface RadioGroupProps {
  id?: string;
  name: string;
  options: RadioOption[];
  defaultValue?: string | number;
  label?: string;
  required?: boolean;
  error?: string;
}

export default function RadioGroup({
  id,
  name,
  options,
  defaultValue,
  label,
  required,
  error,
}: RadioGroupProps) {
  const labelId = label ? `${name}-label` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <fieldset className={styles.radioField} id={id}>
      {label && (
        <legend className={styles.label} id={labelId}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </legend>
      )}
      <div
        className={`${styles.radioTrack} ${error ? styles.radioTrackError : ""}`}
        role="group"
        aria-labelledby={labelId}
        aria-describedby={errorId}
        aria-invalid={!!error}
      >
        {options.map((opt) => (
          <label
            key={opt.value}
            className={styles.radioOption}
            style={
              opt.color
                ? ({ "--radio-option-color": opt.color } as React.CSSProperties)
                : undefined
            }
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              defaultChecked={defaultValue === opt.value}
              required={required}
              aria-label={opt.label}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <span className={styles.errorText} id={errorId}>
          {error}
        </span>
      )}
    </fieldset>
  );
}
