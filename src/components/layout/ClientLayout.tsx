"use client";

import { AppNavbar } from "@/components/layout/AppNavbar";
import { ThemeProvider } from "@/contexts";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="app-layout">
        <AppNavbar />
        <main className="app-main">{children}</main>
      </div>
    </ThemeProvider>
  );
}
