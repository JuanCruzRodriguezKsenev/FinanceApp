"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarNav,
  NavbarItem,
  NavbarDivider,
} from "@/components/ui/Navbar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import styles from "./AppNavbar.module.css";

export function AppNavbar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) setIsMobileOpen(false);
  }, [isMobile]);

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          className={styles.mobileMenuButton}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      )}

      <Navbar
        position="left"
        direction="column"
        padding="large"
        sticky={true}
        className={`${styles.appNavbar} ${isMobileOpen ? styles.mobileOpen : ""}`}
      >
        {/* Brand/Logo */}
        <NavbarBrand href="/" className={styles.brand}>
          <span className={styles.brandIcon}>💰</span>
          <span className={styles.brandText}>FinanceApp</span>
        </NavbarBrand>

        <NavbarDivider vertical />

        {/* Navegación Principal */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Principal</h3>
          <NavbarNav align="start" gap="small" className={styles.navList}>
            <NavbarItem href="/" active={pathname === "/"}>
              🏠 Home
            </NavbarItem>
            <NavbarItem href="/dashboard" active={isActive("/dashboard")}>
              📊 Dashboard
            </NavbarItem>
            <NavbarItem href="/transactions" active={isActive("/transactions")}>
              💳 Transactions
            </NavbarItem>
          </NavbarNav>
        </div>

        <NavbarDivider vertical />

        {/* Autenticación */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Auth</h3>
          <NavbarNav align="start" gap="small" className={styles.navList}>
            <NavbarItem href="/auth/login" active={isActive("/auth/login")}>
              🔐 Login
            </NavbarItem>
            <NavbarItem
              href="/auth/register"
              active={isActive("/auth/register")}
            >
              ✍️ Register
            </NavbarItem>
          </NavbarNav>
        </div>

        <NavbarDivider vertical />

        {/* Development Tools */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Dev Tools</h3>
          <NavbarNav align="start" gap="small" className={styles.navList}>
            <NavbarItem href="/ui-test" active={isActive("/ui-test")}>
              🧪 UI Test
            </NavbarItem>
          </NavbarNav>
        </div>

        <NavbarDivider vertical />

        {/* Espaciador */}
        <div style={{ marginTop: "auto" }} />

        <NavbarDivider vertical />

        {/* Footer */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Usuario</h3>
          <NavbarNav align="start" gap="small" className={styles.navList}>
            <NavbarItem href="/profile">👤 Perfil</NavbarItem>
            <NavbarItem href="/settings">⚙️ Settings</NavbarItem>
          </NavbarNav>
        </div>

        {/* Theme Toggle */}
        <div className={styles.themeToggleContainer}>
          <ThemeToggle variant="full" />
        </div>
      </Navbar>

      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
