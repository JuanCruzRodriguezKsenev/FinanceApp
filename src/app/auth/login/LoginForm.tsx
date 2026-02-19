"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";

import Button from "@/components/ui/Buttons/Button";
import Card from "@/components/ui/Card/Card";
import { useMessage } from "@/hooks/useMessage";

import styles from "./login.module.css";

export default function LoginForm() {
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
        setMessage({ type: "error", text: result.error });
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        setMessage({ type: "success", text: "Acceso exitoso" });
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
        return;
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error en el servidor" });
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setMessage(null);
    setIsLoading(true);
    try {
      await signIn("google", { redirect: false });
      // Redirect will happen via NextAuth callback
    } catch (err) {
      setMessage({ type: "error", text: "Error al iniciar sesión con Google" });
      setIsLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setMessage(null);
    setIsLoading(true);
    try {
      await signIn("github", { redirect: false });
      // Redirect will happen via NextAuth callback
    } catch (err) {
      setMessage({ type: "error", text: "Error al iniciar sesión con GitHub" });
      setIsLoading(false);
    }
  };

  return (
    <Card className={styles.loginCard}>
      <div className={styles.container}>
        <h1 className={styles.title}>Acceso</h1>

        {message && (
          <div
            className={`${styles.message} ${styles[message.type]}`}
            role="alert"
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleCredentialsSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              disabled={isLoading}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Tu contraseña"
              disabled={isLoading}
              required
              className={styles.input}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? "Accediendo..." : "Acceder"}
          </Button>
        </form>

        <div className={styles.divider}>O</div>

        <div className={styles.socialButtons}>
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className={styles.socialButton}
            variant="secondary"
          >
            Google
          </Button>
          <Button
            type="button"
            onClick={handleGithubSignIn}
            disabled={isLoading}
            className={styles.socialButton}
            variant="secondary"
          >
            GitHub
          </Button>
        </div>
      </div>
    </Card>
  );
}
