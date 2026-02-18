"use client";

import { ThemeProvider } from "@/contexts";
import { AppNavbar } from "@/components/layout/AppNavbar";

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
