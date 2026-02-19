// src/components/auth/LogoutButton.tsx
"use client";

import { useState, useTransition } from "react";

import Button from "@/components/ui/Buttons/Button";
import { logger } from "@/lib/logger";
import { logoutAction } from "@/shared/lib/auth/actions";

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await logoutAction();
      } catch (error) {
        // Ignore NEXT_REDIRECT errors - they're expected
        if (error instanceof Error && error.message === "NEXT_REDIRECT") {
          return;
        }
        logger.error("Logout failed", error as Error);
      }
    });
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={isPending}
      isLoading={isPending}
    >
      {isPending ? "Cerrando sesión..." : "Cerrar sesión"}
    </Button>
  );
}
