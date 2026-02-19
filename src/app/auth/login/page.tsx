// src/app/auth/login/page.tsx
import { Suspense } from "react";

import LoginForm from "./LoginForm";

import styles from "./login.module.css";

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <Suspense fallback={<div>Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
