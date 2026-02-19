import {
  ChangeEvent,
  FocusEvent,
  forwardRef,
  InputHTMLAttributes,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import styles from "./Form.module.css";
import FormField from "./FormField";

export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
  enabled?: boolean;
}

interface PasswordInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> {
  label?: string;
  error?: string;
  rules: PasswordRule[];
  showRequirements?: "always" | "focus" | "filled" | "never";
  validationMessage?: string;
  showToggle?: boolean;
  toggleLabels?: {
    show: string;
    hide: string;
  };
  onValidityChange?: (
    isValid: boolean,
    results: Record<string, boolean>,
  ) => void;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      label,
      error,
      rules,
      showRequirements = "focus",
      validationMessage = "La contrasena no cumple los requisitos.",
      showToggle = true,
      toggleLabels = { show: "Mostrar", hide: "Ocultar" },
      onValidityChange,
      className = "",
      defaultValue,
      value,
      onChange,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const [internalValue, setInternalValue] = useState(
      (value ?? defaultValue ?? "").toString(),
    );
    const currentValue = value !== undefined ? value.toString() : internalValue;

    const errorId = error && props.id ? `${props.id}-error` : undefined;
    const requirementsId = props.id ? `${props.id}-requirements` : undefined;

    const safeRules = Array.isArray(rules) ? rules : [];
    const activeRules = safeRules.filter((rule) => rule.enabled !== false);
    const results = activeRules.reduce<Record<string, boolean>>((acc, rule) => {
      try {
        acc[rule.id] = rule.test(currentValue);
      } catch {
        acc[rule.id] = false;
      }
      return acc;
    }, {});

    const isValid = activeRules.length
      ? Object.values(results).every(Boolean)
      : true;

    const shouldShowRequirements =
      showRequirements === "always" ||
      (showRequirements === "focus" && isFocused) ||
      (showRequirements === "filled" && currentValue.length > 0);

    const requirementsRefId = shouldShowRequirements
      ? requirementsId
      : undefined;
    const describedBy =
      [errorId, requirementsRefId].filter(Boolean).join(" ") || undefined;

    useEffect(() => {
      onValidityChange?.(isValid, results);
    }, [isValid, results, onValidityChange]);

    useEffect(() => {
      const input = inputRef.current;
      if (!input) return;
      if (!activeRules.length || currentValue.length === 0) {
        input.setCustomValidity("");
        return;
      }
      input.setCustomValidity(isValid ? "" : validationMessage);
    }, [isValid, activeRules.length, currentValue, validationMessage]);

    useImperativeHandle(ref, () => inputRef.current!);

    const handleInput = (
      event: ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>,
    ) => {
      const target = event.currentTarget;
      onChange?.(event as ChangeEvent<HTMLInputElement>);
      if (value === undefined) {
        setInternalValue(target.value);
      }
    };

    const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(event);
    };

    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(event);
    };

    const handleToggle = () => {
      setRevealed((prev) => !prev);
    };

    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value.toString());
      }
    }, [value]);

    return (
      <FormField
        id={props.id}
        label={label}
        required={props.required}
        error={error}
        errorId={errorId}
        className={className}
      >
        <div className={styles.passwordWrapper}>
          <input
            ref={inputRef}
            type={revealed ? "text" : "password"}
            className={`${styles.control} ${error ? styles.errorControl : ""} ${
              showToggle ? styles.passwordHasToggle : ""
            }`}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            {...props}
            value={currentValue}
            onChange={handleInput}
            onInput={handleInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          {showToggle && (
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={handleToggle}
              aria-label={revealed ? toggleLabels.hide : toggleLabels.show}
              aria-pressed={revealed}
              data-state={revealed ? "hide" : "show"}
            >
              <span
                className={`${styles.passwordToggleLabel} ${styles.passwordToggleLabelShow}`}
              >
                {toggleLabels.show}
              </span>
              <span
                className={`${styles.passwordToggleLabel} ${styles.passwordToggleLabelHide}`}
              >
                {toggleLabels.hide}
              </span>
            </button>
          )}
        </div>

        {activeRules.length > 0 && shouldShowRequirements && (
          <ul
            className={styles.requirements}
            id={requirementsRefId}
            aria-live="polite"
            aria-atomic="true"
          >
            {activeRules.map((rule) => (
              <li
                key={rule.id}
                className={`${styles.requirement} ${
                  results[rule.id] ? styles.requirementMet : ""
                }`}
              >
                <span className={styles.requirementIcon} aria-hidden="true" />
                <span>{rule.label}</span>
              </li>
            ))}
          </ul>
        )}
      </FormField>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
export default PasswordInput;
