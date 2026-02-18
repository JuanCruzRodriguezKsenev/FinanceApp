"use client";

// Este es un componente boundary que solo provee el contexto del tema
// sin forzar a los children a ser client components
import { ThemeProvider as ThemeContextProvider } from "@/contexts";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeContextProvider>{children}</ThemeContextProvider>;
}
