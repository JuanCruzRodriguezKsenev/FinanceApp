"use client";

import { useState } from "react";
import Dialog from "@/components/ui/Dialog/Dialog";
import Form from "@/components/ui/Form/Form";
import Button from "@/components/ui/Buttons/Button";

export default function UITestPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const handleFormSubmit = async (formData: FormData) => {
    const data = Object.fromEntries(formData.entries());
    console.log("Form submitted:", data);
    setFormData(data);
    // No cerrar el dialog automáticamente para poder ver el resultado
  };

  const handleCancelForm = () => {
    setDialogOpen(false);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>UI Test - Componentes Genéricos</h1>
      <p>
        Página para probar y trabajar con los componentes UI sin CSS adicional
      </p>

      <div style={{ marginTop: "2rem" }}>
        <Button onClick={() => setDialogOpen(true)}>
          Abrir Dialog con Form
        </Button>
      </div>

      {formData && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            border: "1px solid #ccc",
          }}
        >
          <h3>Datos enviados:</h3>
          <pre>{JSON.stringify(formData, null, 2)}</pre>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Formulario de Prueba"
      >
        <Form
          action={handleFormSubmit}
          onCancel={handleCancelForm}
          submitLabel="Enviar"
          cancelLabel="Cancelar"
        >
          <Form.Input
            id="nombre"
            name="nombre"
            label="Nombre"
            placeholder="Ingresa tu nombre"
            required
          />

          <Form.Input
            id="email"
            name="email"
            label="Email"
            type="email"
            placeholder="ejemplo@mail.com"
            required
          />

          <Form.PasswordInput
            id="password"
            name="password"
            label="Contraseña"
            placeholder="Ingresa una contraseña"
            required
            rules={[
              {
                id: "min",
                label: "Minimo 8 caracteres",
                test: (value) => value.length >= 8,
              },
              {
                id: "upperLower",
                label: "Mayuscula y minuscula",
                test: (value) => /[A-Z]/.test(value) && /[a-z]/.test(value),
              },
              {
                id: "number",
                label: "Numero",
                test: (value) => /\d/.test(value),
              },
              {
                id: "symbol",
                label: "Simbolo especial",
                test: (value) => /[^A-Za-z0-9]/.test(value),
              },
            ]}
            onValidityChange={(isValid) => {
              console.log("Password valid:", isValid);
            }}
          />

          <Form.Input
            id="monto"
            name="monto"
            label="Monto"
            type="number"
            placeholder="0.00"
            defaultValue="0"
            startIcon="$"
            step="0.01"
            disableNumberControls
          />

          <Form.Select
            id="categoria"
            name="categoria"
            label="Categoría"
            required
          >
            <option value="">Seleccionar...</option>
            <option value="alimentacion">Alimentación</option>
            <option value="transporte">Transporte</option>
            <option value="entretenimiento">Entretenimiento</option>
            <option value="salud">Salud</option>
          </Form.Select>

          <Form.SelectCustom
            id="categoria-custom"
            name="categoriaCustom"
            label="Categoría (Custom)"
            required
            options={[
              { label: "Alimentación", value: "alimentacion" },
              { label: "Transporte", value: "transporte" },
              { label: "Entretenimiento", value: "entretenimiento" },
              { label: "Salud", value: "salud" },
            ]}
          />

          <Form.Textarea
            id="descripcion"
            name="descripcion"
            label="Descripción"
            placeholder="Escribe una descripción..."
            rows={4}
          />

          <Form.RadioGroup
            label="Tipo de transacción"
            name="tipo"
            required
            defaultValue="egreso"
            options={[
              {
                label: "Ingreso",
                value: "ingreso",
                color: "var(--color-success)",
              },
              {
                label: "Egreso",
                value: "egreso",
                color: "var(--color-danger)",
              },
              {
                label: "Transferencia",
                value: "transferencia",
                color: "var(--color-primary)",
              },
            ]}
          />

          <Form.Checkbox
            id="notificar"
            name="notificar"
            label="Recibir notificaciones"
            description="Te enviaremos un email cuando se procese la transacción"
          />

          <Form.Checkbox
            id="terminos"
            name="terminos"
            label="Acepto los términos y condiciones"
            required
          />
        </Form>
      </Dialog>
    </div>
  );
}
