/* src/core/actions/auth.ts */
"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { users } from "@/db/schema/identity";
import { signIn, signOut } from "@/lib/auth";
import { logger } from "@/lib/logger";
import {
  type AppError,
  authorizationError,
  databaseError,
  err,
  ok,
  type Result,
  validationError,
} from "@/lib/result";

export async function loginActionResult(
  formData: FormData,
): Promise<Result<void, AppError>> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return err(validationError("form", "Todos los campos son requeridos"));
  }

  if (!email.includes("@")) {
    return err(validationError("email", "Email inválido"));
  }

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return err(authorizationError("auth"));
    }

    return ok(undefined);
  } catch (error) {
    logger.error("Login failed", error as Error, { email });
    return err(databaseError("select", "Error al iniciar sesión"));
  }
}

export async function loginAction(formData: FormData) {
  const result = await loginActionResult(formData);
  if (result.isErr()) {
    const message =
      result.error.type === "VALIDATION"
        ? result.error.message
        : "Email o contraseña incorrectos";
    redirect(`/auth/login?error=${encodeURIComponent(message)}`);
  }

  redirect("/dashboard");
}

export async function registerActionResult(
  formData: FormData,
): Promise<Result<void, AppError>> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !confirmPassword || !name) {
    return err(validationError("form", "Todos los campos son requeridos"));
  }

  if (!email.includes("@") || !email.includes(".")) {
    return err(validationError("email", "Email inválido"));
  }

  if (password.length < 8) {
    return err(
      validationError(
        "password",
        "La contraseña debe tener al menos 8 caracteres",
      ),
    );
  }

  if (password !== confirmPassword) {
    return err(validationError("password", "Las contraseñas no coinciden"));
  }

  if (name.length < 2) {
    return err(
      validationError("name", "El nombre debe tener al menos 2 caracteres"),
    );
  }

  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0) {
      return err(validationError("email", "Este email ya está registrado"));
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      email,
      name,
      passwordHash,
    });

    return ok(undefined);
  } catch (error) {
    logger.error("Registration failed", error as Error, { email, name });
    return err(databaseError("insert", "Error al crear la cuenta"));
  }
}

export async function registerAction(formData: FormData) {
  const result = await registerActionResult(formData);
  if (result.isErr()) {
    const message =
      result.error.type === "VALIDATION"
        ? result.error.message
        : "Error al crear la cuenta. Intenta de nuevo";
    redirect(`/auth/register?error=${encodeURIComponent(message)}`);
  }

  redirect(
    "/auth/login?success=Cuenta creada exitosamente. Por favor inicia sesión",
  );
}

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/auth/login");
}
