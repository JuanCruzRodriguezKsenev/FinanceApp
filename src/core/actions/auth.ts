/* src/core/actions/auth.ts */
"use server";

import { signIn, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema/identity";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/auth/login?error=Todos los campos son requeridos");
  }

  if (!email.includes("@")) {
    redirect("/auth/login?error=Email inválido");
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: true,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    console.error("Login error:", error);
    redirect("/auth/login?error=Email o contraseña incorrectos");
  }
}

export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const name = formData.get("name") as string;

  // Validaciones
  if (!email || !password || !confirmPassword || !name) {
    redirect("/auth/register?error=Todos los campos son requeridos");
  }

  if (!email.includes("@") || !email.includes(".")) {
    redirect("/auth/register?error=Email inválido");
  }

  if (password.length < 8) {
    redirect(
      "/auth/register?error=La contraseña debe tener al menos 8 caracteres",
    );
  }

  if (password !== confirmPassword) {
    redirect("/auth/register?error=Las contraseñas no coinciden");
  }

  if (name.length < 2) {
    redirect("/auth/register?error=El nombre debe tener al menos 2 caracteres");
  }

  try {
    // Verificar si el usuario ya existe
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0) {
      redirect("/auth/register?error=Este email ya está registrado");
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    await db.insert(users).values({
      email,
      name,
      passwordHash,
    });

    // Redirigir al login con mensaje de éxito
    redirect(
      "/auth/login?success=Cuenta creada exitosamente. Por favor inicia sesión",
    );
  } catch (error) {
    console.error("Register error:", error);
    redirect("/auth/register?error=Error al crear la cuenta. Intenta de nuevo");
  }
}

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/auth/login");
}
