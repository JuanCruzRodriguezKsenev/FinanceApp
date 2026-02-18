/**
 * TransactionFormWithMediator - Ejemplo de refactorización con FormMediator
 *
 * Este archivo muestra cómo el TransactionForm podría refactorizarse usando
 * el patrón Mediator con la clase FormMediator para gestionar la lógica
 * de coordinación entre campos del formulario.
 *
 * BENEFICIOS:
 * - Lógica de coordinación centralizada en el mediator
 * - Reglas declarativas más fáciles de entender
 * - Más fácil de testear
 * - Más fácil de extender con nuevas reglas
 *
 * NOTA: Este es un archivo de ejemplo. El TransactionForm actual funciona bien,
 * pero si la complejidad aumenta, considera migrar a este patrón.
 */
"use client";

import { useEffect, useState } from "react";
import { useFormMediator } from "@/lib/formMediator";
import { eventBus, EVENTS } from "@/lib/eventBus";
import type { TransactionType, Account, SavingsGoal } from "@/types";

interface Props {
  accounts: Account[];
  goals: SavingsGoal[];
  onSuccess?: () => void;
}

export default function TransactionFormWithMediator({
  accounts,
  goals,
  onSuccess,
}: Props) {
  const { mediator, getFieldProps } = useFormMediator();
  const [type, setType] = useState<TransactionType>("expense");

  // Configurar reglas del mediator al montar
  useEffect(() => {
    // Regla 1: Mostrar categoría solo para ciertos tipos
    mediator.addRule("category", {
      condition: ({ type }) =>
        type === "expense" || type === "income" || type === "saving",
      config: { visible: true, required: true },
    });

    mediator.addRule("category", {
      condition: ({ type }) =>
        type === "transfer_own_accounts" || type === "transfer_third_party",
      config: { visible: false, required: false },
    });

    // Regla 2: Mostrar cuenta destino según el tipo
    mediator.addRule("toAccount", {
      condition: ({ type }) =>
        type === "income" || type === "transfer_own_accounts",
      config: { visible: true, required: true },
    });

    mediator.addRule("toAccount", {
      condition: ({ type }) =>
        type === "expense" || type === "transfer_third_party",
      config: { visible: false, required: false },
    });

    // Regla 3: Mostrar contacto solo para transferencias a terceros
    mediator.addRule("contact", {
      condition: ({ type }) => type === "transfer_third_party",
      config: { visible: true, required: true },
    });

    mediator.addRule("contact", {
      condition: ({ type }) => type !== "transfer_third_party",
      config: { visible: false, required: false },
    });

    // Regla 4: Validación de montos según tipo
    mediator.addRule("amount", {
      condition: ({ type, amount }) => {
        if (type === "expense" && parseFloat(amount) > 100000) {
          return true;
        }
        return false;
      },
      config: {
        error: "El monto es muy alto para un gasto. ¿Estás seguro?",
      },
    });

    // Regla 5: Cuentas disponibles según flowMethod
    mediator.addRule("fromAccount", {
      condition: ({ flowMethod }) => flowMethod === "cash",
      config: {
        // Filtrar solo cuentas de efectivo
        value: accounts.filter((acc) => acc.type === "cash"),
      },
    });

    mediator.addRule("fromAccount", {
      condition: ({ flowMethod }) => flowMethod === "transfer",
      config: {
        // Incluir todas las cuentas
        value: accounts,
      },
    });
  }, [mediator, accounts]);

  // Sincronizar tipo con el mediator
  useEffect(() => {
    mediator.setFieldValue("type", type);
    mediator.applyRules();
  }, [type, mediator]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar usando el mediator
    if (!mediator.validate()) {
      return;
    }

    // Obtener todos los valores del formulario
    const formData = mediator.getAllValues();

    try {
      // Crear transacción (lógica simplificada para el ejemplo)
      console.log("Creando transacción:", formData);

      // Publicar evento
      eventBus.publish(EVENTS.TRANSACTION.CREATED, { transaction: formData });

      // Reset del formulario
      mediator.reset();

      // Callback de éxito
      onSuccess?.();
    } catch (error) {
      mediator.setFieldError("_form", "Error al crear transacción");
    }
  };

  // Obtener configuraciones de campos desde el mediator
  const categoryConfig = mediator.getFieldConfig("category");
  const toAccountConfig = mediator.getFieldConfig("toAccount");
  const contactConfig = mediator.getFieldConfig("contact");
  const fromAccountConfig = mediator.getFieldConfig("fromAccount");
  const amountConfig = mediator.getFieldConfig("amount");

  return (
    <form onSubmit={handleSubmit}>
      {/* Tipo de transacción */}
      <div>
        <label>Tipo de movimiento</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TransactionType)}
        >
          <option value="expense">💸 Gasto</option>
          <option value="income">💰 Ingreso</option>
          <option value="transfer_own_accounts">🔄 Entre mis cuentas</option>
          <option value="transfer_third_party">👤 A terceros</option>
          <option value="saving">🎯 Ahorro</option>
        </select>
      </div>

      {/* Monto */}
      <div>
        <label>Monto</label>
        <input type="number" {...getFieldProps("amount")} placeholder="0.00" />
        {amountConfig.error && (
          <span className="error">{amountConfig.error}</span>
        )}
      </div>

      {/* Categoría - Controlada por el Mediator */}
      {categoryConfig.visible && (
        <div>
          <label>Categoría {categoryConfig.required && "*"}</label>
          <select {...getFieldProps("category")}>
            <option value="">Selecciona una categoría</option>
            <option value="food">🍔 Comida</option>
            <option value="transport">🚗 Transporte</option>
            <option value="health">💊 Salud</option>
            {/* Más opciones... */}
          </select>
          {categoryConfig.error && (
            <span className="error">{categoryConfig.error}</span>
          )}
        </div>
      )}

      {/* Cuenta Origen */}
      <div>
        <label>Cuenta origen *</label>
        <select
          {...getFieldProps("fromAccount")}
          disabled={!fromAccountConfig.enabled}
        >
          <option value="">Selecciona una cuenta</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.balance} {account.currency})
            </option>
          ))}
        </select>
      </div>

      {/* Cuenta Destino - Controlada por el Mediator */}
      {toAccountConfig.visible && (
        <div>
          <label>Cuenta destino {toAccountConfig.required && "*"}</label>
          <select
            {...getFieldProps("toAccount")}
            disabled={!toAccountConfig.enabled}
          >
            <option value="">Selecciona una cuenta</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.balance} {account.currency})
              </option>
            ))}
          </select>
          {toAccountConfig.error && (
            <span className="error">{toAccountConfig.error}</span>
          )}
        </div>
      )}

      {/* Contacto - Controlado por el Mediator */}
      {contactConfig.visible && (
        <div>
          <label>Contacto {contactConfig.required && "*"}</label>
          <input
            type="text"
            {...getFieldProps("contact")}
            placeholder="Nombre del contacto"
          />
          {contactConfig.error && (
            <span className="error">{contactConfig.error}</span>
          )}
        </div>
      )}

      {/* Fecha */}
      <div>
        <label>Fecha</label>
        <input type="date" {...getFieldProps("date")} required />
      </div>

      {/* Descripción */}
      <div>
        <label>Descripción (opcional)</label>
        <input
          type="text"
          {...getFieldProps("description")}
          placeholder="Ej: Uber al trabajo"
        />
      </div>

      <button type="submit">Agregar transacción</button>
    </form>
  );
}

/**
 * COMPARACIÓN: TransactionForm actual vs con FormMediator
 *
 * === ACTUAL (Manual) ===
 *
 * const handleTypeChange = (newType) => {
 *   setType(newType);
 *
 *   // Lógica dispersa en múltiples lugares
 *   if (newType === 'transfer_own_accounts') {
 *     setShowCategory(false);
 *     setShowToAccount(true);
 *     setShowContact(false);
 *     setFlowMethod('transfer');
 *   } else if (newType === 'expense') {
 *     setShowCategory(true);
 *     setShowToAccount(false);
 *     setShowContact(false);
 *   }
 *   // ... más lógica
 * };
 *
 * === CON MEDIATOR (Declarativo) ===
 *
 * mediator.addRule('category', {
 *   condition: ({ type }) => type === 'expense',
 *   config: { visible: true, required: true }
 * });
 *
 * mediator.addRule('toAccount', {
 *   condition: ({ type }) => type === 'transfer_own_accounts',
 *   config: { visible: true, required: true }
 * });
 *
 * // Las reglas se aplican automáticamente cuando cambia el tipo
 * mediator.setFieldValue('type', 'expense');
 * mediator.applyRules(); // Todas las reglas se ejecutan
 *
 *
 * VENTAJAS DEL MEDIATOR:
 *
 * 1. ✅ Reglas declarativas más fáciles de leer
 * 2. ✅ Lógica centralizada en un solo lugar
 * 3. ✅ Más fácil de testear (testear reglas individualmente)
 * 4. ✅ Más fácil de extender (agregar nuevas reglas)
 * 5. ✅ Menos propenso a bugs (no hay que sincronizar múltiples estados)
 * 6. ✅ Mejor separación de concerns
 *
 *
 * CUÁNDO USAR EL MEDIATOR:
 *
 * - Formularios con > 10 campos interdependientes
 * - Validaciones complejas que dependen de múltiples campos
 * - Cuando la lógica de coordinación se vuelve difícil de seguir
 * - Cuando necesitas validaciones dinámicas basadas en el estado
 * - Cuando quieres testear la lógica de formulario aisladamente
 */
