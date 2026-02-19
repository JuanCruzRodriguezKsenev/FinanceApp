/**
 * FormMediator - Patrón Mediator para coordinar formularios complejos
 *
 * Centraliza la lógica de interacción entre campos de formulario,
 * evitando que los campos se comuniquen directamente entre sí.
 *
 * @example
 * ```tsx
 * const mediator = new FormMediator();
 *
 * // Configurar campo
 * mediator.setFieldConfig('email', {
 *   visible: true,
 *   enabled: true,
 *   required: true
 * });
 *
 * // Coordinar cambios
 * mediator.onTypeChange('transfer', () => {
 *   mediator.setFieldConfig('fromAccount', { visible: true, required: true });
 *   mediator.setFieldConfig('toAccount', { visible: true, required: true });
 *   mediator.setFieldConfig('category', { visible: false });
 * });
 * ```
 *
 * Diagrama del Mediator:
 * ```
 *              ┌────────────────────────────┐
 *              │   FormMediator             │
 *              │  • Mantiene FieldConfigs   │
 *              │  • Coordina validaciones   │
 *              │  • Notifica cambios        │
 *              └────┬───────┬───────┬───────┘
 *                   │       │       │
 *        ┌──────────┴───┐   │   ┌───┴──────────┐
 *        │              │   │   │              │
 *        ▼              ▼   ▼   ▼              ▼
 *   ┌─────────┐   ┌─────────────┐   ┌──────────────┐
 *   │  Field  │   │   Field     │   │    Field     │
 *   │    A    │   │     B       │   │      C       │
 *   │(Colle-  │   │ (Colleague) │   │ (Colleague)  │
 *   │ague)    │   └─────────────┘   └──────────────┘
 *   └─────────┘
 *
 * Los campos NO se comunican entre sí directamente
 * TODO pasa por el Mediator
 * ```
 */
/**
 * Hook de React para usar FormMediator
 */
import { useCallback,useEffect, useState } from "react";

import { logger } from "@/lib/logger";

export interface FieldConfig {
  visible: boolean;
  enabled: boolean;
  required: boolean;
  value: any;
  error?: string;
  touched?: boolean;
}

export interface FieldRule {
  condition: (formState: Record<string, any>) => boolean;
  config: Partial<FieldConfig>;
}

type ListenerCallback = () => void;

export class FormMediator {
  private fields: Map<string, FieldConfig> = new Map();
  private listeners: Set<ListenerCallback> = new Set();
  private rules: Map<string, FieldRule[]> = new Map();

  /**
   * Configurar un campo
   * @param fieldName - Nombre del campo
   * @param config - Configuración parcial del campo
   */
  setFieldConfig(fieldName: string, config: Partial<FieldConfig>): void {
    const current = this.fields.get(fieldName) || this.getDefaultConfig();
    this.fields.set(fieldName, { ...current, ...config });
    this.notifyListeners();
  }

  /**
   * Obtener configuración de un campo
   * @param fieldName - Nombre del campo
   * @returns Configuración del campo
   */
  getFieldConfig(fieldName: string): FieldConfig {
    return this.fields.get(fieldName) || this.getDefaultConfig();
  }

  /**
   * Establecer valor de un campo
   * @param fieldName - Nombre del campo
   * @param value - Nuevo valor
   */
  setFieldValue(fieldName: string, value: any): void {
    const config = this.getFieldConfig(fieldName);
    this.setFieldConfig(fieldName, { ...config, value, touched: true });
    this.applyRules();
  }

  /**
   * Obtener valor de un campo
   * @param fieldName - Nombre del campo
   * @returns Valor del campo
   */
  getFieldValue(fieldName: string): any {
    return this.getFieldConfig(fieldName).value;
  }

  /**
   * Obtener todos los valores del formulario
   * @returns Objeto con todos los valores
   */
  getAllValues(): Record<string, any> {
    const values: Record<string, any> = {};
    this.fields.forEach((config, fieldName) => {
      values[fieldName] = config.value;
    });
    return values;
  }

  /**
   * Establecer error en un campo
   * @param fieldName - Nombre del campo
   * @param error - Mensaje de error
   */
  setFieldError(fieldName: string, error: string): void {
    const config = this.getFieldConfig(fieldName);
    this.setFieldConfig(fieldName, { ...config, error });
  }

  /**
   * Limpiar error de un campo
   * @param fieldName - Nombre del campo
   */
  clearFieldError(fieldName: string): void {
    const config = this.getFieldConfig(fieldName);
    this.setFieldConfig(fieldName, { ...config, error: undefined });
  }

  /**
   * Agregar regla de coordinación entre campos
   * @param fieldName - Campo que será afectado
   * @param rule - Regla de coordinación
   */
  addRule(fieldName: string, rule: FieldRule): void {
    if (!this.rules.has(fieldName)) {
      this.rules.set(fieldName, []);
    }
    this.rules.get(fieldName)!.push(rule);
  }

  /**
   * Aplicar todas las reglas de coordinación
   */
  applyRules(): void {
    const formState = this.getAllValues();

    this.rules.forEach((rules, fieldName) => {
      rules.forEach((rule) => {
        if (rule.condition(formState)) {
          this.setFieldConfig(fieldName, rule.config);
        }
      });
    });
  }

  /**
   * Validar todos los campos
   * @returns true si el formulario es válido
   */
  validate(): boolean {
    let isValid = true;

    this.fields.forEach((config, fieldName) => {
      if (config.required && config.visible && !config.value) {
        this.setFieldError(fieldName, "Este campo es requerido");
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Resetear el formulario
   */
  reset(): void {
    this.fields.forEach((_, fieldName) => {
      this.setFieldConfig(fieldName, this.getDefaultConfig());
    });
    this.notifyListeners();
  }

  /**
   * Suscribirse a cambios del formulario
   * @param callback - Función a ejecutar cuando cambie el formulario
   * @returns Función para desuscribirse
   */
  subscribe(callback: ListenerCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notificar a todos los listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        logger.error("Failed to notify FormMediator listener", error as Error);
      }
    });
  }

  /**
   * Obtener configuración por defecto
   */
  private getDefaultConfig(): FieldConfig {
    return {
      visible: true,
      enabled: true,
      required: false,
      value: null,
      touched: false,
    };
  }
}

export function useFormMediator() {
  const [mediator] = useState(() => new FormMediator());
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = mediator.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, [mediator]);

  const getFieldProps = useCallback(
    (fieldName: string) => {
      const config = mediator.getFieldConfig(fieldName);
      return {
        value: config.value,
        onChange: (value: any) => mediator.setFieldValue(fieldName, value),
        required: config.required,
        disabled: !config.enabled,
        error: config.error,
        visible: config.visible,
      };
    },
    [mediator],
  );

  return {
    mediator,
    getFieldProps,
  };
}
