// src/app/auth/register/page.tsx
import { registerAction } from "@/core/actions/auth";
import styles from "./register.module.css";
import Button from "@/components/ui/Buttons/Button";
import Card from "@/components/ui/Card/Card";

interface Props {
  searchParams: {
    error?: string;
    success?: string;
  };
}

export default function RegisterPage({ searchParams }: Props) {
  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h1>FinanceApp</h1>
          <p>Crea tu cuenta</p>
        </div>

        <form action={registerAction} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Nombre completo</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Juan Pérez"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              minLength={8}
              required
            />
            <small className={styles.hint}>Mínimo 8 caracteres</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              minLength={8}
              required
            />
          </div>

          {searchParams.error && (
            <div className={styles.error}>
              {decodeURIComponent(searchParams.error)}
            </div>
          )}

          {searchParams.success && (
            <div className={styles.success}>
              {decodeURIComponent(searchParams.success)}
            </div>
          )}

          <Button type="submit" variant="primary" className={styles.submitBtn}>
            Crear cuenta
          </Button>
        </form>

        <div className={styles.footer}>
          <p>
            ¿Ya tienes cuenta? <a href="/auth/login">Inicia sesión aquí</a>
          </p>
        </div>

        <div className={styles.terms}>
          <small>
            Al crear una cuenta, aceptas nuestros{" "}
            <a href="/terms">Términos de Servicio</a> y{" "}
            <a href="/privacy">Política de Privacidad</a>
          </small>
        </div>
      </Card>
    </div>
  );
}
