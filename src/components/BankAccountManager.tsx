/**
 * Componente para gestionar cuentas bancarias
 */

"use client";

import { useState, useEffect } from "react";
import {
  createBankAccount,
  getBankAccounts,
  deleteBankAccount,
} from "@/core/actions/bank-accounts";
import { useFormInputs } from "@/hooks/useForm";
import { useMessage } from "@/hooks/useMessage";
import {
  BANK_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
  CURRENCY_OPTIONS,
} from "@/constants/selectOptions";
import type { BankAccount } from "@/types";
import type { AppError } from "@/lib/result";
import styles from "./BankAccountManager.module.css";

const INITIAL_FORM_DATA = {
  accountName: "",
  bank: "bbva" as const,
  accountType: "savings" as const,
  accountNumber: "",
  cbu: "",
  alias: "",
  currency: "ARS" as const,
  balance: "0",
  ownerName: "",
  ownerDocument: "",
  notes: "",
};

export function BankAccountManager() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const form = useFormInputs(INITIAL_FORM_DATA);
  const { message, showSuccess, showError, clear } = useMessage();

  const resolveAppErrorMessage = (error: AppError): string => {
    switch (error.type) {
      case "VALIDATION":
        return error.message;
      case "UNAUTHORIZED":
        return "No autenticado";
      case "NOT_FOUND":
        return "Recurso no encontrado";
      case "DATABASE":
        return error.message;
      case "NETWORK":
        return error.message;
      default:
        return "Error inesperado";
    }
  };

  // Cargar cuentas al montar el componente
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    const result = await getBankAccounts();
    if (result.isOk()) {
      setAccounts(result.value);
    } else {
      showError(resolveAppErrorMessage(result.error));
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clear();

    const result = await createBankAccount({
      ...form.data,
      ownerDocument: form.data.ownerDocument || undefined,
      notes: form.data.notes || undefined,
    });

    if (result.isOk()) {
      showSuccess("Cuenta bancaria creada exitosamente");
      form.reset();
      setShowForm(false);
      await loadAccounts();
    } else {
      showError(resolveAppErrorMessage(result.error));
    }

    setLoading(false);
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta cuenta?")) return;

    setLoading(true);
    const result = await deleteBankAccount(accountId);

    if (result.isOk()) {
      await loadAccounts();
    } else {
      showError(resolveAppErrorMessage(result.error));
    }

    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Mis Cuentas Bancarias</h2>
        <button
          className={styles.addButton}
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
        >
          {showForm ? "Cancelar" : "+ Agregar Cuenta"}
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Nombre de la Cuenta *</label>
              <input
                type="text"
                name="accountName"
                value={form.data.accountName}
                onChange={form.handleInputChange}
                placeholder="Ej: Mi Caja de Ahorro Santander"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Banco *</label>
              <select
                name="bank"
                value={form.data.bank}
                onChange={form.handleInputChange}
                required
              >
                {BANK_OPTIONS.map((bank) => (
                  <option key={bank.value} value={bank.value}>
                    {bank.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Tipo de Cuenta *</label>
              <select
                name="accountType"
                value={form.data.accountType}
                onChange={form.handleInputChange}
                required
              >
                {ACCOUNT_TYPE_OPTIONS.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Número de Cuenta *</label>
              <input
                type="text"
                name="accountNumber"
                value={form.data.accountNumber}
                onChange={form.handleInputChange}
                placeholder="Ej: 1234567890"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>CBU</label>
              <input
                type="text"
                name="cbu"
                value={form.data.cbu}
                onChange={form.handleInputChange}
                placeholder="Ej: 0720123456789012345678"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Alias</label>
              <input
                type="text"
                name="alias"
                value={form.data.alias}
                onChange={form.handleInputChange}
                placeholder="Ej: pepe.rodriguez"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Moneda</label>
              <select
                name="currency"
                value={form.data.currency}
                onChange={form.handleInputChange}
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Saldo Inicial</label>
              <input
                type="number"
                name="balance"
                value={form.data.balance}
                onChange={form.handleInputChange}
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Nombre del Titular *</label>
              <input
                type="text"
                name="ownerName"
                value={form.data.ownerName}
                onChange={form.handleInputChange}
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>DNI/CUIT</label>
              <input
                type="text"
                name="ownerDocument"
                value={form.data.ownerDocument}
                onChange={form.handleInputChange}
                placeholder="Ej: 12345678"
              />
            </div>

            <div className={styles.formGroup + " " + styles.fullWidth}>
              <label>Notas</label>
              <textarea
                name="notes"
                value={form.data.notes}
                onChange={form.handleInputChange}
                placeholder="Notas personales..."
                rows={3}
              />
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar Cuenta"}
          </button>
        </form>
      )}

      {loading && <p className={styles.loading}>Cargando...</p>}

      {accounts.length === 0 && !showForm && (
        <p className={styles.empty}>No tienes cuentas bancarias agregadas</p>
      )}

      <div className={styles.accountsList}>
        {accounts.map((account) => (
          <div key={account.id} className={styles.accountCard}>
            <div className={styles.accountHeader}>
              <h3>{account.accountName}</h3>
              <span className={styles.bank}>{account.bank}</span>
            </div>

            <div className={styles.accountDetails}>
              <p>
                <strong>Tipo:</strong> {account.accountType}
              </p>
              <p>
                <strong>Número:</strong> {account.accountNumber}
              </p>
              {account.cbu && (
                <p>
                  <strong>CBU:</strong> {account.cbu}
                </p>
              )}
              {account.alias && (
                <p>
                  <strong>Alias:</strong> {account.alias}
                </p>
              )}
              <p>
                <strong>Titular:</strong> {account.ownerName}
              </p>
              <p className={styles.balance}>
                <strong>Saldo:</strong> {account.currency}{" "}
                {parseFloat(account.balance).toFixed(2)}
              </p>
            </div>

            <button
              className={styles.deleteButton}
              onClick={() => handleDelete(account.id)}
              disabled={loading}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
