// src/components/transactions/TransactionForm.tsx
"use client";

import { memo, useEffect, useRef, useTransition } from "react";
import { createTransactionWithAutoDetection } from "@/features/transactions/actions";
import Button from "@/components/ui/Buttons/Button";
import { useMessage } from "@/hooks/useMessage";
import { getCategorySelectOptions } from "@/constants/transactionLabels";
import { eventBus, EVENTS } from "@/lib/eventBus";
import { useTransactionForm } from "../hooks/useTransactionForm";
import type { AppError } from "@/lib/result";
import styles from "./TransactionForm.module.css";
import type {
  Account,
  SavingsGoal,
  BankAccount,
  DigitalWallet,
  Contact,
  TransactionType,
} from "@/types";

interface Props {
  accounts: Account[];
  goals: SavingsGoal[];
  bankAccounts?: BankAccount[];
  digitalWallets?: DigitalWallet[];
  contacts?: Contact[];
  onSuccess?: () => void;
  showHeader?: boolean;
  variant?: "page" | "dialog";
}

const CURRENCY_OPTIONS = [
  { value: "ARS", label: "ARS" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
] as const;

const CURRENCY_DESCRIPTIONS: Record<string, string> = {
  ARS: "Pesos argentinos",
  USD: "Dolar estadounidense",
  EUR: "Euro",
};

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

/**
 * Formatea un número con separadores de miles (puntos)
 * Ejemplo: "1234567.89" -> "1.234.567,89"
 */
function formatNumberWithThousands(value: string): string {
  if (!value) return "";

  // Separar parte entera y decimal
  const parts = value.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Agregar separadores de miles (puntos)
  const withThousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  // Si hay decimales, agregarlos con coma
  if (decimalPart !== undefined) {
    return `${withThousands},${decimalPart}`;
  }

  return withThousands;
}

function TransactionForm({
  accounts,
  goals,
  bankAccounts = [],
  digitalWallets = [],
  contacts = [],
  onSuccess,
  showHeader = true,
  variant = "page",
}: Props) {
  const [isPending, startTransition] = useTransition();
  const currencyRef = useRef<HTMLDivElement | null>(null);
  const rubroRef = useRef<HTMLDivElement | null>(null);
  const categoriaRef = useRef<HTMLDivElement | null>(null);
  const { state, actions } = useTransactionForm();
  const { type, flowMethod, dropdowns, searches, form } = state;
  const {
    setType,
    setFlowMethod,
    setDropdownOpen,
    closeDropdowns,
    setSearch,
    setFormField,
    resetAll,
  } = actions;
  const { message, showSuccess, showError, clear } = useMessage();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      const clickedCurrency =
        currencyRef.current && currencyRef.current.contains(targetNode);
      const clickedRubro =
        rubroRef.current && rubroRef.current.contains(targetNode);
      const clickedCategoria =
        categoriaRef.current && categoriaRef.current.contains(targetNode);

      if (!clickedCurrency && !clickedRubro && !clickedCategoria) {
        closeDropdowns();
        return;
      }

      if (!clickedCurrency) {
        setDropdownOpen("currency", false);
      }
      if (!clickedRubro) {
        setDropdownOpen("rubro", false);
      }
      if (!clickedCategoria) {
        setDropdownOpen("categoria", false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resolveSourceInfo = () => {
    if (form.fromAccountId) {
      const account = accounts.find((acc) => acc.id === form.fromAccountId);
      return account
        ? {
            label: account.name,
            balance: account.balance,
            currency: account.currency,
          }
        : null;
    }
    if (form.fromBankAccountId) {
      const account = bankAccounts.find(
        (acc) => acc.id === form.fromBankAccountId,
      );
      return account
        ? {
            label: `${account.accountName} (${account.bank})`,
            balance: account.balance,
            currency: account.currency,
          }
        : null;
    }
    if (form.fromWalletId) {
      const wallet = digitalWallets.find((w) => w.id === form.fromWalletId);
      return wallet
        ? {
            label: `${wallet.walletName} (${wallet.provider})`,
            balance: wallet.balance,
            currency: wallet.currency,
          }
        : null;
    }
    return null;
  };

  const resolveTargetInfo = () => {
    if (form.toAccountId) {
      const account = accounts.find((acc) => acc.id === form.toAccountId);
      return account
        ? { label: account.name, currency: account.currency }
        : null;
    }
    if (form.toBankAccountId) {
      const account = bankAccounts.find(
        (acc) => acc.id === form.toBankAccountId,
      );
      return account
        ? {
            label: `${account.accountName} (${account.bank})`,
            currency: account.currency,
          }
        : null;
    }
    if (form.toWalletId) {
      const wallet = digitalWallets.find((w) => w.id === form.toWalletId);
      return wallet
        ? {
            label: `${wallet.walletName} (${wallet.provider})`,
            currency: wallet.currency,
          }
        : null;
    }
    return null;
  };

  const parsedAmount = Number.parseFloat(form.amount);
  const hasAmount =
    form.amount.trim().length > 0 && !Number.isNaN(parsedAmount);
  const isOutflow = type === "expense" || flowMethod === "transfer";
  const sourceInfo = resolveSourceInfo();
  const targetInfo = resolveTargetInfo();
  const isSourceCurrencyMismatch =
    sourceInfo?.currency && form.currency
      ? sourceInfo.currency !== form.currency
      : false;
  const isTargetCurrencyMismatch =
    targetInfo?.currency && form.currency
      ? targetInfo.currency !== form.currency
      : false;
  const sourceBalance = sourceInfo
    ? Number.parseFloat(sourceInfo.balance || "0")
    : 0;
  const hasInsufficientFunds =
    Boolean(sourceInfo) &&
    isOutflow &&
    hasAmount &&
    parsedAmount > sourceBalance;
  const formattedSourceBalance = sourceInfo
    ? new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: sourceInfo.currency || form.currency || "ARS",
      }).format(sourceBalance)
    : "";
  const fundsWarning = hasInsufficientFunds
    ? `Fondos insuficientes en ${sourceInfo?.label}. Saldo disponible: ${formattedSourceBalance}.`
    : "";

  const rubroOptions = getCategorySelectOptions(type);
  const categoriaOptions = getCategorySelectOptions(type);
  const rubroLabel =
    rubroOptions.find((option) => option.value === form.category)?.label ||
    form.category;
  const categoriaLabel =
    categoriaOptions.find((option) => option.value === form.categoryDetail)
      ?.label || form.categoryDetail;

  const handleSubmit = async () => {
    clear();
    startTransition(async () => {
      const amount = parseFloat(form.amount);
      if (!form.amount || Number.isNaN(amount)) {
        showError("Ingresa un monto valido");
        return;
      }

      if (isSourceCurrencyMismatch) {
        showError(
          `La moneda seleccionada no coincide con la cuenta origen (${sourceInfo?.label}).`,
        );
        return;
      }

      if (isTargetCurrencyMismatch) {
        showError(
          `La moneda seleccionada no coincide con la cuenta destino (${targetInfo?.label}).`,
        );
        return;
      }

      const baseDescription = form.description.trim();
      const description =
        baseDescription || categoriaLabel || rubroLabel || "Movimiento";
      const date = new Date(form.date);
      const paymentMethod = flowMethod === "cash" ? "cash" : "bank_transfer";
      const currency = form.currency || "ARS";
      const fromAccountId = form.fromAccountId || undefined;
      const toAccountId = form.toAccountId || undefined;
      const fromBankAccountId = form.fromBankAccountId || undefined;
      const toBankAccountId = form.toBankAccountId || undefined;
      const fromWalletId = form.fromWalletId || undefined;
      const toWalletId = form.toWalletId || undefined;
      const contactId = form.contactId || undefined;
      const category = form.category || undefined;
      const transactionType =
        flowMethod === "transfer" ? undefined : (type as TransactionType);

      const result = await createTransactionWithAutoDetection({
        amount,
        currency,
        description,
        date,
        paymentMethod,
        fromAccountId,
        toAccountId,
        fromBankAccountId,
        toBankAccountId,
        fromWalletId,
        toWalletId,
        contactId,
        category: category as any,
        type: transactionType,
      });

      if (result.isErr()) {
        showError(resolveAppErrorMessage(result.error));
      } else {
        showSuccess("Transaccion creada correctamente");

        // Notificar a otros componentes a través del EventBus (Observer Pattern)
        eventBus.publish(EVENTS.TRANSACTION.CREATED, {
          transaction: result.value,
          type,
          amount,
          currency,
        });

        onSuccess?.();
        resetAll();
      }
    });
  };

  return (
    <div
      className={`${styles.container} ${
        variant === "dialog" ? styles.containerDialog : ""
      }`}
    >
      {showHeader && (
        <div className={styles.header}>
          <h2>Nueva transaccion</h2>
          <p>Registro rapido de ingresos y gastos.</p>
        </div>
      )}

      <form
        id="transaction-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className={styles.form}
      >
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Tipo de movimiento</h3>
          <div
            className={`${styles.segmented} ${styles.segmentedType}`}
            data-active={type}
          >
            <span className={styles.segmentIndicator} />
            <button
              type="button"
              className={`${styles.segmentButton} ${
                type === "expense" ? styles.segmentButtonActive : ""
              }`}
              aria-pressed={type === "expense"}
              onClick={() => setType("expense")}
            >
              Gasto
            </button>
            <button
              type="button"
              className={`${styles.segmentButton} ${
                type === "income" ? styles.segmentButtonActive : ""
              }`}
              aria-pressed={type === "income"}
              onClick={() => setType("income")}
            >
              Ingreso
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Metodo</h3>
          <div
            className={`${styles.segmented} ${styles.segmentedFlow}`}
            data-active={flowMethod}
          >
            <span className={styles.segmentIndicator} />
            <button
              type="button"
              className={`${styles.segmentButton} ${
                flowMethod === "cash" ? styles.segmentButtonActive : ""
              }`}
              aria-pressed={flowMethod === "cash"}
              onClick={() => setFlowMethod("cash")}
            >
              Efectivo
            </button>
            <button
              type="button"
              className={`${styles.segmentButton} ${
                flowMethod === "transfer" ? styles.segmentButtonActive : ""
              }`}
              aria-pressed={flowMethod === "transfer"}
              onClick={() => setFlowMethod("transfer")}
            >
              Transferencia
            </button>
          </div>
        </div>

        <div className={`${styles.sectionGrid} ${styles.amountRow}`}>
          <div className={styles.formGroup}>
            <label htmlFor="amount">Monto</label>
            <input
              id="amount"
              name="amount"
              type="text"
              inputMode="decimal"
              placeholder="0"
              required
              className={styles.amountInput}
              value={formatNumberWithThousands(form.amount)}
              onChange={(e) => {
                const value = e.target.value;
                // Permitir solo números, puntos y comas
                const cleaned = value.replace(/[^0-9.,]/g, "");
                // Remover puntos de miles para almacenar solo el número
                const withoutThousands = cleaned.replace(/\./g, "");
                // Reemplazar coma por punto para el decimal
                const normalized = withoutThousands.replace(",", ".");

                setFormField("amount", normalized);
              }}
              onWheel={(e) => e.currentTarget.blur()}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="currency">Moneda</label>
            <div className={styles.currencyField} ref={currencyRef}>
              <button
                id="currency"
                type="button"
                className={styles.currencyTrigger}
                aria-haspopup="listbox"
                aria-expanded={dropdowns.currencyOpen}
                onClick={() =>
                  setDropdownOpen("currency", !dropdowns.currencyOpen)
                }
              >
                <span className={styles.currencyCode}>{form.currency}</span>
                <span className={styles.currencyChevron}>▾</span>
              </button>
              {dropdowns.currencyOpen && (
                <div
                  className={styles.currencyMenu}
                  role="listbox"
                  style={{
                    top: currencyRef.current
                      ? `${currencyRef.current.getBoundingClientRect().bottom + 8}px`
                      : undefined,
                    left: currencyRef.current
                      ? `${currencyRef.current.getBoundingClientRect().left}px`
                      : undefined,
                  }}
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={option.value === form.currency}
                      className={`${styles.currencyOption} ${
                        option.value === form.currency
                          ? styles.currencyOptionActive
                          : ""
                      }`}
                      onClick={() => {
                        setFormField("currency", option.value);
                        setDropdownOpen("currency", false);
                      }}
                    >
                      <span className={styles.currencyOptionCode}>
                        {option.value}
                      </span>
                      <span className={styles.currencyOptionText}>
                        {CURRENCY_DESCRIPTIONS[option.value]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Desde / Hasta</h3>
          <div className={styles.formGrid}>
            {(type === "expense" || flowMethod === "transfer") &&
              accounts.length > 0 && (
                <div className={styles.formGroup}>
                  <label htmlFor="fromAccountId">Desde (Cuenta)</label>
                  <select
                    id="fromAccountId"
                    name="fromAccountId"
                    value={form.fromAccountId}
                    onChange={(e) =>
                      setFormField("fromAccountId", e.target.value)
                    }
                  >
                    <option value="">Seleccionar...</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

            {(type === "income" || flowMethod === "transfer") &&
              accounts.length > 0 && (
                <div className={styles.formGroup}>
                  <label htmlFor="toAccountId">Hasta (Cuenta)</label>
                  <select
                    id="toAccountId"
                    name="toAccountId"
                    value={form.toAccountId}
                    onChange={(e) =>
                      setFormField("toAccountId", e.target.value)
                    }
                  >
                    <option value="">Seleccionar...</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

            {(type === "expense" || flowMethod === "transfer") &&
              bankAccounts.length > 0 && (
                <div className={styles.formGroup}>
                  <label htmlFor="fromBankAccountId">Desde (Banco)</label>
                  <select
                    id="fromBankAccountId"
                    name="fromBankAccountId"
                    value={form.fromBankAccountId}
                    onChange={(e) =>
                      setFormField("fromBankAccountId", e.target.value)
                    }
                  >
                    <option value="">Seleccionar...</option>
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} ({acc.bank})
                      </option>
                    ))}
                  </select>
                </div>
              )}

            {(type === "income" || flowMethod === "transfer") &&
              bankAccounts.length > 0 && (
                <div className={styles.formGroup}>
                  <label htmlFor="toBankAccountId">Hasta (Banco)</label>
                  <select
                    id="toBankAccountId"
                    name="toBankAccountId"
                    value={form.toBankAccountId}
                    onChange={(e) =>
                      setFormField("toBankAccountId", e.target.value)
                    }
                  >
                    <option value="">Seleccionar...</option>
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} ({acc.bank})
                      </option>
                    ))}
                  </select>
                </div>
              )}

            {(type === "expense" || flowMethod === "transfer") &&
              digitalWallets.length > 0 && (
                <div className={styles.formGroup}>
                  <label htmlFor="fromWalletId">Desde (Billetera)</label>
                  <select
                    id="fromWalletId"
                    name="fromWalletId"
                    value={form.fromWalletId}
                    onChange={(e) =>
                      setFormField("fromWalletId", e.target.value)
                    }
                  >
                    <option value="">Seleccionar...</option>
                    {digitalWallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.walletName} ({w.provider})
                      </option>
                    ))}
                  </select>
                </div>
              )}

            {(type === "income" || flowMethod === "transfer") &&
              digitalWallets.length > 0 && (
                <div className={styles.formGroup}>
                  <label htmlFor="toWalletId">Hasta (Billetera)</label>
                  <select
                    id="toWalletId"
                    name="toWalletId"
                    value={form.toWalletId}
                    onChange={(e) => setFormField("toWalletId", e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    {digitalWallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.walletName} ({w.provider})
                      </option>
                    ))}
                  </select>
                </div>
              )}

            {flowMethod === "transfer" && contacts.length > 0 && (
              <div className={styles.formGroup}>
                <label htmlFor="contactId">Contacto (Tercero)</label>
                <select
                  id="contactId"
                  name="contactId"
                  value={form.contactId}
                  onChange={(e) => setFormField("contactId", e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.email ? `(${c.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {accounts.length === 0 &&
            bankAccounts.length === 0 &&
            digitalWallets.length === 0 && (
              <p className={styles.emptyHint}>
                No hay cuentas, bancos o billeteras disponibles.
              </p>
            )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Rubro y categoria</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="rubroSelect">Rubro</label>
              <div className={styles.currencyField} ref={rubroRef}>
                <button
                  id="rubroSelect"
                  type="button"
                  className={styles.currencyTrigger}
                  aria-haspopup="listbox"
                  aria-expanded={dropdowns.rubroOpen}
                  onClick={() => setDropdownOpen("rubro", !dropdowns.rubroOpen)}
                  style={{ minWidth: "100%", justifyContent: "space-between" }}
                >
                  <span
                    className={styles.currencyCode}
                    style={{
                      textTransform: "none",
                      fontSize: "var(--font-size-base)",
                      letterSpacing: "normal",
                    }}
                  >
                    {rubroLabel || "Seleccionar..."}
                  </span>
                  <span className={styles.currencyChevron}>▾</span>
                </button>
                {dropdowns.rubroOpen && (
                  <div
                    className={styles.currencyMenu}
                    role="listbox"
                    style={{
                      top: rubroRef.current
                        ? `${rubroRef.current.getBoundingClientRect().bottom + 8}px`
                        : undefined,
                      left: rubroRef.current
                        ? `${rubroRef.current.getBoundingClientRect().left}px`
                        : undefined,
                      minWidth: rubroRef.current
                        ? `${rubroRef.current.getBoundingClientRect().width}px`
                        : "16rem",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Buscar rubro..."
                      value={searches.rubro}
                      onChange={(e) => setSearch("rubro", e.target.value)}
                      className={styles.searchInput}
                      autoFocus
                    />
                    {rubroOptions
                      .filter((option) =>
                        option.label
                          .toLowerCase()
                          .includes(searches.rubro.toLowerCase()),
                      )
                      .map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={option.value === form.category}
                          className={`${styles.currencyOption} ${
                            option.value === form.category
                              ? styles.currencyOptionActive
                              : ""
                          }`}
                          onClick={() => {
                            setFormField("category", option.value);
                            setDropdownOpen("rubro", false);
                            setSearch("rubro", "");
                          }}
                        >
                          <span className={styles.currencyOptionText}>
                            {option.label}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="categoriaSelect">Categoria</label>
              <div className={styles.currencyField} ref={categoriaRef}>
                <button
                  id="categoriaSelect"
                  type="button"
                  className={styles.currencyTrigger}
                  aria-haspopup="listbox"
                  aria-expanded={dropdowns.categoriaOpen}
                  onClick={() =>
                    setDropdownOpen("categoria", !dropdowns.categoriaOpen)
                  }
                  style={{ minWidth: "100%", justifyContent: "space-between" }}
                >
                  <span
                    className={styles.currencyCode}
                    style={{
                      textTransform: "none",
                      fontSize: "var(--font-size-base)",
                      letterSpacing: "normal",
                    }}
                  >
                    {categoriaLabel || "Seleccionar..."}
                  </span>
                  <span className={styles.currencyChevron}>▾</span>
                </button>
                {dropdowns.categoriaOpen && (
                  <div
                    className={styles.currencyMenu}
                    role="listbox"
                    style={{
                      top: categoriaRef.current
                        ? `${categoriaRef.current.getBoundingClientRect().bottom + 8}px`
                        : undefined,
                      left: categoriaRef.current
                        ? `${categoriaRef.current.getBoundingClientRect().left}px`
                        : undefined,
                      minWidth: categoriaRef.current
                        ? `${categoriaRef.current.getBoundingClientRect().width}px`
                        : "16rem",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Buscar categoria..."
                      value={searches.categoria}
                      onChange={(e) => setSearch("categoria", e.target.value)}
                      className={styles.searchInput}
                      autoFocus
                    />
                    {categoriaOptions
                      .filter((option) =>
                        option.label
                          .toLowerCase()
                          .includes(searches.categoria.toLowerCase()),
                      )
                      .map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={option.value === form.categoryDetail}
                          className={`${styles.currencyOption} ${
                            option.value === form.categoryDetail
                              ? styles.currencyOptionActive
                              : ""
                          }`}
                          onClick={() => {
                            setFormField("categoryDetail", option.value);
                            setDropdownOpen("categoria", false);
                            setSearch("categoria", "");
                          }}
                        >
                          <span className={styles.currencyOptionText}>
                            {option.label}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formStack}>
            <div className={styles.formGroup}>
              <label htmlFor="date">Fecha</label>
              <input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={(e) => setFormField("date", e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Detalle (opcional)</label>
              <input
                id="description"
                name="description"
                type="text"
                placeholder="Ej: Uber al trabajo"
                value={form.description}
                onChange={(e) => setFormField("description", e.target.value)}
              />
            </div>
          </div>
        </div>

        {fundsWarning && (
          <div className={`${styles.message} ${styles.warning}`}>
            {fundsWarning}
          </div>
        )}

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          isLoading={isPending}
          disabled={isPending}
          className={styles.submitButton}
        >
          {isPending ? "Guardando..." : "Agregar transaccion"}
        </Button>
      </form>
    </div>
  );
}

export default memo(TransactionForm);
