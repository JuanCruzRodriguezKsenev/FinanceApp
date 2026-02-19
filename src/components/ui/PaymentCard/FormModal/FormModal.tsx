"use client";

import { FormEvent,useEffect, useState } from "react";

import Dialog from "@/components/ui/Dialog/Dialog";
import { CreditCardData, DebitCardData,PaymentCard } from "@/types";

// Asegúrate de que este archivo exista en la misma carpeta
import styles from "./FormModal.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  editingCard?: CreditCardData | DebitCardData | null;
}

const EMPTY_FORM = {
  bank: "",
  holder: "",
  last4: "",
  expiryMonth: "",
  expiryYear: "",
  type: "debit",
  limit: "",
  consumed: "",
  closingDate: "",
};

export default function CardFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingCard,
}: Props) {
  const [formData, setFormData] = useState(EMPTY_FORM);

  // 1. Cargar datos al abrir el modal o cambiar la tarjeta
  useEffect(() => {
    if (isOpen) {
      if (editingCard) {
        setFormData({
          bank: editingCard.bank,
          holder: editingCard.holder,
          last4: editingCard.last4,
          expiryMonth: editingCard.expiryMonth.toString(),
          expiryYear: editingCard.expiryYear.toString(),
          type: editingCard.type,
          // Si es crédito, cargamos sus datos, si no, strings vacíos
          limit:
            editingCard.type === "credit" ? editingCard.limit.toString() : "",
          consumed:
            editingCard.type === "credit"
              ? editingCard.consumed.toString()
              : "",
          closingDate:
            editingCard.type === "credit" ? editingCard.closingDate : "",
        });
      } else {
        setFormData(EMPTY_FORM);
      }
    }
  }, [isOpen, editingCard]);

  // 2. Manejar cambios en los inputs
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 3. Enviar el formulario
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Datos base comunes para ambas tarjetas
    const baseData = {
      bank: formData.bank,
      holder: formData.holder,
      last4: formData.last4,
      expiryMonth: parseInt(formData.expiryMonth) || 12,
      expiryYear: parseInt(formData.expiryYear) || 2025,
    };

    let payload;

    if (formData.type === "credit") {
      payload = {
        ...baseData,
        type: "credit",
        limit: parseFloat(formData.limit) || 0,
        // Lógica de Consumo:
        // Si editamos una de crédito, mantenemos su consumo actual.
        // Si creamos nueva o cambiamos de débito a crédito, empieza en 0.
        consumed:
          editingCard && editingCard.type === "credit"
            ? editingCard.consumed
            : 0,
        closingDate: formData.closingDate,
      };
    } else {
      payload = {
        ...baseData,
        type: "debit",
      };
    }

    onSubmit(payload);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={editingCard ? "Edit Card" : "Add New Card"}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* --- TIPO DE TARJETA --- */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Card Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className={styles.select}
            disabled={!!editingCard} // Bloqueamos cambio de tipo al editar para simplificar lógica
          >
            <option value="debit">Debit Card</option>
            <option value="credit">Credit Card</option>
          </select>
        </div>

        {/* --- BANCO --- */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Bank Name</label>
          <input
            name="bank"
            value={formData.bank}
            onChange={handleInputChange}
            className={styles.input}
            placeholder="e.g. Santander"
            required
          />
        </div>

        {/* --- TITULAR --- */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Card Holder</label>
          <input
            name="holder"
            value={formData.holder}
            onChange={handleInputChange}
            className={styles.input}
            placeholder="NAME ON CARD"
            required
          />
        </div>

        {/* --- ÚLTIMOS 4 DÍGITOS --- */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Last 4 Digits</label>
          <input
            name="last4"
            value={formData.last4}
            onChange={handleInputChange}
            className={styles.input}
            placeholder="1234"
            maxLength={4}
            required
          />
        </div>

        {/* --- FECHA DE VENCIMIENTO (En fila) --- */}
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Month</label>
            <input
              name="expiryMonth"
              type="number"
              value={formData.expiryMonth}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="MM"
              min="1"
              max="12"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Year</label>
            <input
              name="expiryYear"
              type="number"
              value={formData.expiryYear}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="YYYY"
              required
            />
          </div>
        </div>

        {/* --- CAMPOS EXCLUSIVOS DE CRÉDITO --- */}
        {formData.type === "credit" && (
          <>
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Total Limit</label>
                <input
                  name="limit"
                  type="number"
                  value={formData.limit}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="$ 0"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Closing Date</label>
              {/* CAMBIO IMPORTANTE: type="date" para manejo correcto de fechas */}
              <input
                type="date"
                name="closingDate"
                value={formData.closingDate}
                onChange={handleInputChange}
                className={styles.input}
                required
              />
            </div>
          </>
        )}

        <button type="submit" className={styles.submitButton}>
          {editingCard ? "Save Changes" : "Create Card"}
        </button>
      </form>
    </Dialog>
  );
}
