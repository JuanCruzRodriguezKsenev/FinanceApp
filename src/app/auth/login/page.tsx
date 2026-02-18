// src/app/auth/login/page.tsx
"use client";

import { FormEvent, useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMessage } from "@/hooks/useMessage";
import styles from "./login.module.css";
import Button from "@/components/ui/Buttons/Button";
import Card from "@/components/ui/Card/Card";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const { message, setMessage } = useMessage();

  // Initialize error from URL params
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setMessage({ type: "error", text: error });
    }
  }, [searchParams, setMessage]);

  const handleCredentialsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setMessage({ type: "error", text: "Email o contraseña incorrectos" });
      } else if (result?.ok) {
        router.push("/dashboard");
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: "Ocurrió un error. Intenta de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { redirectTo: "/dashboard" });
    } catch (err) {
      setMessage({ type: "error", text: "Error al iniciar sesión con Google" });
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h1>FinanceApp</h1>
          <p>Accede a tu cuenta</p>
        </div>

        {/* OAuth Buttons */}
        <div className={styles.oauthSection}>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className={styles.googleBtn}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar con Google
          </button>
        </div>

        <div className={styles.divider}>
          <span>o</span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleCredentialsSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          {message?.type === "error" && (
            <div className={styles.error}>{message.text}</div>
          )}

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={isLoading}
            className={styles.submitBtn}
          >
            {isLoading ? "Cargando..." : "Iniciar sesión"}
          </Button>
        </form>

        <div className={styles.footer}>
          <p>
            ¿No tienes cuenta? <a href="/auth/register">Regístrate aquí</a>
          </p>
          <p>
            <a href="/auth/forgot-password">¿Olvidaste tu contraseña?</a>
          </p>
        </div>
      </Card>
    </div>
  );
}
