/**
 * Hook para manejar estado y reset de formularios
 * Reemplaza boilerplate de manejo de state y reset en múltiples componentes
 */

import { useState, useCallback } from "react";

export interface UseFormReturn<T> {
  data: T;
  setData: (data: T) => void;
  setField: <K extends keyof T>(field: K, value: T[K]) => void;
  updateFields: (updates: Partial<T>) => void;
  reset: () => void;
  resetField: <K extends keyof T>(field: K) => void;
  isDirty: boolean;
}

/**
 * Hook para manejar estado de formulario con reset
 * Reduce boilerplate de setState y reset en formularios
 *
 * @param initialData - Estado inicial del formulario
 * @return Objeto con data, setters y métodos de reset
 *
 * @example
 * const form = useForm({
 *   name: '',
 *   email: '',
 *   password: '',
 * });
 *
 * // En handlers:
 * form.setField('name', 'Juan');
 * form.updateFields({ name: 'Juan', email: 'juan@example.com' });
 * form.reset(); // Vuelve a estado inicial
 */
export function useForm<T extends Record<string, any>>(
  initialData: T,
): UseFormReturn<T> {
  const [data, setData] = useState<T>(initialData);

  const setField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const updateFields = useCallback((updates: Partial<T>) => {
    setData((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
  }, [initialData]);

  const resetField = useCallback(
    <K extends keyof T>(field: K) => {
      setData((prev) => ({
        ...prev,
        [field]: initialData[field],
      }));
    },
    [initialData],
  );

  const isDirty = JSON.stringify(data) !== JSON.stringify(initialData);

  return {
    data,
    setData,
    setField,
    updateFields,
    reset,
    resetField,
    isDirty,
  };
}

/**
 * Hook para manejar cambios de input en formularios
 * Con soporte para diferentes tipos de input
 */
export function useFormInput(initialValue: string = "") {
  const [value, setValue] = useState(initialValue);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { value, type, checked } = e.target as HTMLInputElement;
      setValue(type === "checkbox" ? String(checked) : value);
    },
    [],
  );

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  const setValue_manual = useCallback((val: string) => {
    setValue(val);
  }, []);

  return {
    value,
    setValue: setValue_manual,
    handleChange,
    reset,
    bind: { value, onChange: handleChange },
  };
}

/**
 * Hook para manejar múltiples inputs simultáneamente
 */
export function useFormInputs<T extends Record<string, string>>(
  initialValues: T,
): UseFormReturn<T> & {
  handleInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
} {
  const form = useForm(initialValues);

  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value, type, checked } = e.target as HTMLInputElement;
      const fieldValue = type === "checkbox" ? String(checked) : value;
      form.setField(name as keyof T, fieldValue as T[keyof T]);
    },
    [form],
  );

  return {
    ...form,
    handleInputChange,
  };
}

/**
 * Hook para validación simple de formularios
 */
export interface ValidationRule<T> {
  validate: (value: any) => boolean;
  message: string;
}

export type ValidationRules<T> = Partial<Record<keyof T, ValidationRule<T>[]>>;

export function useFormValidation<T extends Record<string, any>>(
  data: T,
  rules: ValidationRules<T>,
) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};

    for (const field in rules) {
      const fieldRules = rules[field as keyof T];
      if (!fieldRules) continue;

      for (const rule of fieldRules) {
        if (!rule.validate(data[field])) {
          newErrors[field as keyof T] = rule.message;
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data, rules]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validate,
    clearErrors,
    clearFieldError,
    isValid: Object.keys(errors).length === 0,
  };
}
