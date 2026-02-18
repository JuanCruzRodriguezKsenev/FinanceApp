/**
 * EventBus - Patrón Observer para comunicación desacoplada entre componentes
 *
 * Permite que componentes se comuniquen sin conocerse directamente.
 * Útil para notificar cambios que afectan a múltiples partes de la aplicación.
 *
 * @example
 * ```tsx
 * // Publicar evento
 * eventBus.publish('transaction:created', newTransaction);
 *
 * // Suscribirse a evento
 * const unsubscribe = eventBus.subscribe('transaction:created', (data) => {
 *   console.log('Nueva transacción:', data);
 * });
 *
 * // Limpiar suscripción
 * unsubscribe();
 * ```
 *
 * Diagrama de funcionamiento:
 * ```
 * ┌─────────────────────────────────────────────┐
 * │           EventBus (Subject)                │
 * │  • Mantiene Map<event, callbacks[]>         │
 * │  • publish() notifica a todos los observers │
 * └──────────┬────────────┬────────────┬────────┘
 *            │            │            │
 *            ▼            ▼            ▼
 *     ┌──────────┐  ┌──────────┐  ┌──────────┐
 *     │Observer 1│  │Observer 2│  │Observer 3│
 *     │(Table)   │  │(Summary) │  │(Dialog)  │
 *     └──────────┘  └──────────┘  └──────────┘
 * ```
 */
import { logger } from "@/lib/logger";

type EventCallback = (data?: any) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  /**
   * Suscribirse a un evento
   * @param event - Nombre del evento (ej: 'transaction:created')
   * @param callback - Función a ejecutar cuando ocurra el evento
   * @returns Función para desuscribirse
   */
  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const callbacks = this.events.get(event)!;
    callbacks.push(callback);

    // Retorna función para desuscribirse
    return () => this.unsubscribe(event, callback);
  }

  /**
   * Desuscribirse de un evento
   * @param event - Nombre del evento
   * @param callback - Callback a remover
   */
  unsubscribe(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Publicar un evento (notificar a todos los observers)
   * @param event - Nombre del evento
   * @param data - Datos a pasar a los callbacks
   */
  publish(event: string, data?: any): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`Failed to execute event callback '${event}'`, error as Error, { event });
        }
      });
    }
  }

  /**
   * Limpiar todas las suscripciones de un evento
   * @param event - Nombre del evento
   */
  clearEvent(event: string): void {
    this.events.delete(event);
  }

  /**
   * Limpiar todas las suscripciones
   */
  clearAll(): void {
    this.events.clear();
  }

  /**
   * Obtener cantidad de observers para un evento
   * @param event - Nombre del evento
   * @returns Cantidad de observers
   */
  getObserverCount(event: string): number {
    return this.events.get(event)?.length || 0;
  }
}

// Singleton para uso global
export const eventBus = new EventBus();

// Tipos de eventos de la aplicación
export const EVENTS = {
  TRANSACTION: {
    CREATED: "transaction:created",
    UPDATED: "transaction:updated",
    DELETED: "transaction:deleted",
  },
  ACCOUNT: {
    CREATED: "account:created",
    UPDATED: "account:updated",
    DELETED: "account:deleted",
  },
  THEME: {
    CHANGED: "theme:changed",
  },
  FILTER: {
    APPLIED: "filter:applied",
    CLEARED: "filter:cleared",
  },
} as const;
