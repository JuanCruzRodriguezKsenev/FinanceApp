// src/components/transactions/TransactionForm.tsx
"use client";

import { memo, useEffect, useRef, useState, useTransition } from "react";
import { createTransactionWithAutoDetection } from "@/core/actions/enhanced-transactions";
import Button from "@/components/ui/Buttons/Button";
import { useMessage } from "@/hooks/useMessage";
import { getCategorySelectOptions } from "@/constants/transactionLabels";
import { eventBus, EVENTS } from "@/lib/eventBus";
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
  const [type, setType] = useState<TransactionType>("expense");
  const [flowMethod, setFlowMethod] = useState<"cash" | "transfer">("cash");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [rubroOpen, setRubroOpen] = useState(false);
  const [categoriaOpen, setCategoriaOpen] = useState(false);
  const [rubroSearch, setRubroSearch] = useState("");
  const [categoriaSearch, setCategoriaSearch] = useState("");
  const currencyRef = useRef<HTMLDivElement | null>(null);
  const rubroRef = useRef<HTMLDivElement | null>(null);
  const categoriaRef = useRef<HTMLDivElement | null>(null);
  const [formState, setFormState] = useState({
    amount: "",
    currency: "ARS",
    date: new Date().toISOString().split("T")[0],
    description: "",
    categoryDetail: "",
    fromAccountId: "",
    toAccountId: "",
    fromBankAccountId: "",
    toBankAccountId: "",
    fromWalletId: "",
    toWalletId: "",
    contactId: "",
    category: "",
  });
  const { message, showSuccess, showError, clear } = useMessage();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        currencyRef.current &&
        !currencyRef.current.contains(event.target as Node)
      ) {
        setCurrencyOpen(false);
      }
      if (
        rubroRef.current &&
        !rubroRef.current.contains(event.target as Node)
      ) {
        setRubroOpen(false);
      }
      if (
        categoriaRef.current &&
        !categoriaRef.current.contains(event.target as Node)
      ) {
        setCategoriaOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resolveSourceInfo = () => {
    if (formState.fromAccountId) {
      const account = accounts.find(
        (acc) => acc.id === formState.fromAccountId,
      );
      return account
        ? {
            label: account.name,
            balance: account.balance,
            currency: account.currency,
          }
        : null;
    }
    if (formState.fromBankAccountId) {
      const account = bankAccounts.find(
        (acc) => acc.id === formState.fromBankAccountId,
      );
      return account
        ? {
            label: `${account.accountName} (${account.bank})`,
            balance: account.balance,
            currency: account.currency,
          }
        : null;
    }
    if (formState.fromWalletId) {
      const wallet = digitalWallets.find(
        (w) => w.id === formState.fromWalletId,
      );
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
    if (formState.toAccountId) {
      const account = accounts.find((acc) => acc.id === formState.toAccountId);
      return account
        ? { label: account.name, currency: account.currency }
        : null;
    }
    if (formState.toBankAccountId) {
      const account = bankAccounts.find(
        (acc) => acc.id === formState.toBankAccountId,
      );
      return account
        ? {
            label: `${account.accountName} (${account.bank})`,
            currency: account.currency,
          }
        : null;
    }
    if (formState.toWalletId) {
      const wallet = digitalWallets.find((w) => w.id === formState.toWalletId);
      return wallet
        ? {
            label: `${wallet.walletName} (${wallet.provider})`,
            currency: wallet.currency,
          }
        : null;
    }
    return null;
  };

  const parsedAmount = Number.parseFloat(formState.amount);
  const hasAmount =
    formState.amount.trim().length > 0 && !Number.isNaN(parsedAmount);
  const isOutflow = type === "expense" || flowMethod === "transfer";
  const sourceInfo = resolveSourceInfo();
  const targetInfo = resolveTargetInfo();
  const isSourceCurrencyMismatch =
    sourceInfo?.currency && formState.currency
      ? sourceInfo.currency !== formState.currency
      : false;
  const isTargetCurrencyMismatch =
    targetInfo?.currency && formState.currency
      ? targetInfo.currency !== formState.currency
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
        currency: sourceInfo.currency || formState.currency || "ARS",
      }).format(sourceBalance)
    : "";
  const fundsWarning = hasInsufficientFunds
    ? `Fondos insuficientes en ${sourceInfo?.label}. Saldo disponible: ${formattedSourceBalance}.`
    : "";

  const rubroOptions = getCategorySelectOptions(type);
  const categoriaOptions = getCategorySelectOptions(type);
  const rubroLabel =
    rubroOptions.find((option) => option.value === formState.category)?.label ||
    formState.category;
  const categoriaLabel =
    categoriaOptions.find((option) => option.value === formState.categoryDetail)
      ?.label || formState.categoryDetail;

  const handleSubmit = async () => {
    clear();
    startTransition(async () => {
      const amount = parseFloat(formState.amount);
      if (!formState.amount || Number.isNaN(amount)) {
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

      const baseDescription = formState.description.trim();
      const description =
        baseDescription || categoriaLabel || rubroLabel || "Movimiento";
      const date = new Date(formState.date);
      const paymentMethod = flowMethod === "cash" ? "cash" : "bank_transfer";
      const currency = formState.currency || "ARS";
      const fromAccountId = formState.fromAccountId || undefined;
      const toAccountId = formState.toAccountId || undefined;
      const fromBankAccountId = formState.fromBankAccountId || undefined;
      const toBankAccountId = formState.toBankAccountId || undefined;
      const fromWalletId = formState.fromWalletId || undefined;
      const toWalletId = formState.toWalletId || undefined;
      const contactId = formState.contactId || undefined;
      const category = formState.category || undefined;
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

      if (!result.success) {
        showError(result.error || "Error al crear la transaccion");
      } else {
        showSuccess("Transaccion creada correctamente");
        
        // Notificar a otros componentes a través del EventBus (Observer Pattern)
        eventBus.publish(EVENTS.TRANSACTION.CREATED, {
          transaction: result.data,
          type,
          amount,
          currency,
        });
        
        onSuccess?.();
        setFormState({
          amount: "",
          currency: "ARS",
          date: new Date().toISOString().split("T")[0],
          description: "",
          categoryDetail: "",
          fromAccountId: "",
          toAccountId: "",
          fromBankAccountId: "",
          toBankAccountId: "",
          fromWalletId: "",
          toWalletId: "",
          contactId: "",
          category: "",
        });
        setType("expense");
        setFlowMethod("cash");
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
              value={formatNumberWithThousands(formState.amount)}
              onChange={(e) => {
                const value = e.target.value;
                // Permitir solo números, puntos y comas
                const cleaned = value.replace(/[^0-9.,]/g, "");
                // Remover puntos de miles para almacenar solo el número
                const withoutThousands = cleaned.replace(/\./g, "");
                // Reemplazar coma por punto para el decimal
                const normalized = withoutThousands.replace(",", ".");

                setFormState((prev) => ({
                  ...prev,
                  amount: normalized,
                }));
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
                aria-expanded={currencyOpen}
                onClick={() => setCurrencyOpen((prev) => !prev)}
              >
                <span className={styles.currencyCode}>
                  {formState.currency}
                </span>
                <span className={styles.currencyChevron}>▾</span>
              </button>
              {currencyOpen && (
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
                      aria-selected={option.value === formState.currency}
                      className={`${styles.currencyOption} ${
                        option.value === formState.currency
                          ? styles.currencyOptionActive
                          : ""
                      }`}
                      onClick={() => {
                        setFormState((prev) => ({
                          ...prev,
                          currency: option.value,
                        }));
                        setCurrencyOpen(false);
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
                    value={formState.fromAccountId}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        fromAccountId: e.target.value,
                      }))
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
                    value={formState.toAccountId}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        toAccountId: e.target.value,
                      }))
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
                    value={formState.fromBankAccountId}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        fromBankAccountId: e.target.value,
                      }))
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
                    value={formState.toBankAccountId}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        toBankAccountId: e.target.value,
                      }))
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
                    value={formState.fromWalletId}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        fromWalletId: e.target.value,
                      }))
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
                    value={formState.toWalletId}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        toWalletId: e.target.value,
                      }))
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

            {flowMethod === "transfer" && contacts.length > 0 && (
              <div className={styles.formGroup}>
                <label htmlFor="contactId">Contacto (Tercero)</label>
                <select
                  id="contactId"
                  name="contactId"
                  value={formState.contactId}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      contactId: e.target.value,
                    }))
                  }
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
                  aria-expanded={rubroOpen}
                  onClick={() => setRubroOpen((prev) => !prev)}
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
                {rubroOpen && (
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
                      value={rubroSearch}
                      onChange={(e) => setRubroSearch(e.target.value)}
                      className={styles.searchInput}
                      autoFocus
                    />
                    {rubroOptions
                      .filter((option) =>
                        option.label
                          .toLowerCase()
                          .includes(rubroSearch.toLowerCase()),
                      )
                      .map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={option.value === formState.category}
                          className={`${styles.currencyOption} ${
                            option.value === formState.category
                              ? styles.currencyOptionActive
                              : ""
                          }`}
                          onClick={() => {
                            setFormState((prev) => ({
                              ...prev,
                              category: option.value,
                            }));
                            setRubroOpen(false);
                            setRubroSearch("");
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
                  aria-expanded={categoriaOpen}
                  onClick={() => setCategoriaOpen((prev) => !prev)}
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
                {categoriaOpen && (
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
                      value={categoriaSearch}
                      onChange={(e) => setCategoriaSearch(e.target.value)}
                      className={styles.searchInput}
                      autoFocus
                    />
                    {categoriaOptions
                      .filter((option) =>
                        option.label
                          .toLowerCase()
                          .includes(categoriaSearch.toLowerCase()),
                      )
                      .map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={
                            option.value === formState.categoryDetail
                          }
                          className={`${styles.currencyOption} ${
                            option.value === formState.categoryDetail
                              ? styles.currencyOptionActive
                              : ""
                          }`}
                          onClick={() => {
                            setFormState((prev) => ({
                              ...prev,
                              categoryDetail: option.value,
                            }));
                            setCategoriaOpen(false);
                            setCategoriaSearch("");
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
                value={formState.date}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
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
                value={formState.description}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
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
