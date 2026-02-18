// src/components/auth/LogoutButton.tsx
"use client";

import { signOut } from "next-auth/react";
import Button from "@/components/ui/Buttons/Button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={isLoading}
      isLoading={isLoading}
    >
      {isLoading ? "Cerrando sesión..." : "Cerrar sesión"}
    </Button>
  );
}
