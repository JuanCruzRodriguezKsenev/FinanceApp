/**
 * Hook para manejar mensajes de forma consistente en toda la app
 * Reemplaza el patrón repetido de useState + setMessage en múltiples componentes
 */

import { useState } from "react";

export type MessageType = "success" | "error" | "warning" | "info";

export interface Message {
  type: MessageType;
  text: string;
}

export interface UseMessageReturn {
  message: Message | null;
  showSuccess: (text: string) => void;
  showError: (text: string) => void;
  showWarning: (text: string) => void;
  showInfo: (text: string) => void;
  setMessage: (message: Message | null) => void;
  clear: () => void;
}

/**
 * Hook para manejar mensajes de estado (success, error, warning, info)
 * Reduce código repetitivo en formularios y componentes asíncronos
 *
 * @example
 * const { message, showSuccess, showError, clear } = useMessage();
 *
 * const handleSubmit = async (data) => {
 *   clear();
 *   const result = await someAction(data);
 *   if (!result.success) {
 *     showError(result.error || 'Algo salió mal');
 *   } else {
 *     showSuccess('¡Operación exitosa!');
 *   }
 * };
 */
export function useMessage(): UseMessageReturn {
  const [message, setMessage] = useState<Message | null>(null);

  const showSuccess = (text: string) => {
    setMessage({ type: "success", text });
  };

  const showError = (text: string) => {
    setMessage({ type: "error", text });
  };

  const showWarning = (text: string) => {
    setMessage({ type: "warning", text });
  };

  const showInfo = (text: string) => {
    setMessage({ type: "info", text });
  };

  const clear = () => {
    setMessage(null);
  };

  return {
    message,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    setMessage,
    clear,
  };
}

/**
 * Hook para auto-limpiar mensajes después de un delay
 */
export function useMessageWithTimeout(
  timeoutMs: number = 5000,
): UseMessageReturn & {
  showSuccessAuto: (text: string) => void;
  showErrorAuto: (text: string) => void;
  showWarningAuto: (text: string) => void;
  showInfoAuto: (text: string) => void;
} {
  const base = useMessage();
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const createAutoHide = (fn: (text: string) => void) => (text: string) => {
    fn(text);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const newTimeoutId = setTimeout(() => {
      base.clear();
    }, timeoutMs);
    setTimeoutId(newTimeoutId);
  };

  return {
    ...base,
    showSuccessAuto: createAutoHide(base.showSuccess),
    showErrorAuto: createAutoHide(base.showError),
    showWarningAuto: createAutoHide(base.showWarning),
    showInfoAuto: createAutoHide(base.showInfo),
  };
}
