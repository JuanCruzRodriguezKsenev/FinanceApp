import { useEffect, useMemo, useRef, useState } from "react";

import styles from "./Form.module.css";
import FormField from "./FormField";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectCustomProps {
  id?: string;
  name?: string;
  label?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  options: SelectOption[];
  defaultValue?: string;
  className?: string;
}

export default function SelectCustom({
  id,
  name,
  label,
  required,
  error,
  placeholder = "Seleccionar...",
  options,
  defaultValue = "",
  className = "",
}: SelectCustomProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const typeaheadRef = useRef("");
  const typeaheadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const errorId = error && name ? `${name}-error` : undefined;
  const labelId = label && name ? `${name}-label` : undefined;

  const clearTypeahead = () => {
    if (typeaheadTimeoutRef.current) {
      clearTimeout(typeaheadTimeoutRef.current);
    }
    typeaheadRef.current = "";
  };

  const setTypeahead = (nextValue: string) => {
    typeaheadRef.current = nextValue;
    if (typeaheadTimeoutRef.current) {
      clearTimeout(typeaheadTimeoutRef.current);
    }
    typeaheadTimeoutRef.current = setTimeout(() => {
      typeaheadRef.current = "";
    }, 500);
  };

  const getOptionIndex = (optionValue: string) =>
    options.findIndex((opt) => opt.value === optionValue);

  const focusOptionAtIndex = (index: number) => {
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>(
      "button[data-option]",
    );
    buttons?.[index]?.focus();
  };

  const selectByDelta = (delta: number) => {
    if (!options.length) return;
    const currentIndex = getOptionIndex(value);
    const fallbackIndex = delta > 0 ? 0 : options.length - 1;
    const nextIndex =
      currentIndex === -1
        ? fallbackIndex
        : Math.max(0, Math.min(options.length - 1, currentIndex + delta));
    setValue(options[nextIndex].value);
  };

  const handleTypeahead = (key: string, shouldFocusOption: boolean) => {
    const nextQuery = `${typeaheadRef.current}${key}`.toLowerCase();
    const matchIndex = options.findIndex((opt) =>
      opt.label.toLowerCase().startsWith(nextQuery),
    );

    if (matchIndex !== -1) {
      setTypeahead(nextQuery);
      setValue(options[matchIndex].value);
      if (shouldFocusOption) {
        focusOptionAtIndex(matchIndex);
      }
    } else {
      clearTypeahead();
    }
  };

  const handleToggle = () => setOpen((prev) => !prev);

  const handleSelect = (nextValue: string) => {
    setValue(nextValue);
    setOpen(false);
    setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const handleTriggerKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (open) {
        const currentIndex = getOptionIndex(value);
        const fallbackIndex =
          event.key === "ArrowDown" ? 0 : options.length - 1;
        const nextIndex =
          currentIndex === -1
            ? fallbackIndex
            : Math.max(
                0,
                Math.min(
                  options.length - 1,
                  currentIndex + (event.key === "ArrowDown" ? 1 : -1),
                ),
              );
        focusOptionAtIndex(nextIndex);
      } else {
        selectByDelta(event.key === "ArrowDown" ? 1 : -1);
      }
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((prev) => !prev);
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      if (!options.length) return;
      setValue(
        event.key === "Home"
          ? options[0].value
          : options[options.length - 1].value,
      );
      return;
    }

    if (
      event.key.length === 1 &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      handleTypeahead(event.key, open);
    }
  };

  const handleOptionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (!listRef.current) return;
    const buttons = Array.from(
      listRef.current.querySelectorAll<HTMLButtonElement>(
        "button[data-option]",
      ),
    );
    const currentIndex = buttons.indexOf(event.currentTarget);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      buttons[Math.min(currentIndex + 1, buttons.length - 1)]?.focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      buttons[Math.max(currentIndex - 1, 0)]?.focus();
    }

    if (event.key === "Home") {
      event.preventDefault();
      buttons[0]?.focus();
    }

    if (event.key === "End") {
      event.preventDefault();
      buttons[buttons.length - 1]?.focus();
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.currentTarget.click();
    }

    if (
      event.key.length === 1 &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      handleTypeahead(event.key, true);
    }
  };

  useEffect(() => {
    if (!open) return;
    const selectedIndex = getOptionIndex(value);
    if (selectedIndex >= 0) {
      focusOptionAtIndex(selectedIndex);
      return;
    }
    if (options.length) {
      focusOptionAtIndex(0);
    }
  }, [open, value, options]);

  return (
    <FormField
      id={id}
      label={label}
      required={required}
      error={error}
      errorId={errorId}
      className={className}
    >
      <div ref={wrapperRef} className={styles.customSelectWrapper}>
        {name && <input type="hidden" name={name} value={value} />}
        <button
          id={id}
          type="button"
          ref={triggerRef}
          className={`${styles.customSelectTrigger} ${error ? styles.customSelectTriggerError : ""}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={labelId}
          aria-describedby={errorId}
          onClick={handleToggle}
          onKeyDown={handleTriggerKeyDown}
        >
          <span
            className={`${styles.customSelectValue} ${!selectedOption ? styles.customSelectPlaceholder : ""}`}
          >
            {selectedOption?.label ?? placeholder}
          </span>
          <svg
            className={`${styles.customSelectChevron} ${open ? styles.customSelectChevronOpen : ""}`}
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
        </button>

        {open && (
          <ul
            ref={listRef}
            className={styles.customSelectList}
            role="listbox"
            aria-labelledby={labelId}
          >
            {options.map((opt) => (
              <li key={opt.value} className={styles.customSelectItem}>
                <button
                  type="button"
                  data-option
                  role="option"
                  aria-selected={value === opt.value}
                  className={`${styles.customSelectOption} ${value === opt.value ? styles.customSelectOptionSelected : ""}`}
                  onClick={() => handleSelect(opt.value)}
                  onKeyDown={handleOptionKeyDown}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </FormField>
  );
}
