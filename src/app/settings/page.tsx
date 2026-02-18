"use client";

import { useTheme } from "@/contexts";
import styles from "./settings.module.css";

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themeOptions = [
    {
      value: "light" as const,
      label: "Claro",
      description: "Tema claro en todo momento",
      icon: "☀️",
    },
    {
      value: "dark" as const,
      label: "Oscuro",
      description: "Tema oscuro en todo momento",
      icon: "🌙",
    },
    {
      value: "system" as const,
      label: "Sistema",
      description: "Sigue la preferencia de tu sistema",
      icon: "💻",
    },
  ];

  return (
    <div className={styles.settings}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Configuración</h1>
          <p>Personaliza tu experiencia en FinanceApp</p>
        </div>
      </header>

      <main className={styles.main}>
        {/* Sección de Apariencia */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Apariencia</h2>
            <p className={styles.sectionDescription}>
              Personaliza cómo se ve la aplicación
            </p>
          </div>

          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>Tema de color</label>
            <div className={styles.themeOptions}>
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`${styles.themeOption} ${
                    theme === option.value ? styles.themeOptionActive : ""
                  }`}
                >
                  <span className={styles.themeIcon}>{option.icon}</span>
                  <div className={styles.themeContent}>
                    <span className={styles.themeLabel}>{option.label}</span>
                    <span className={styles.themeDescription}>
                      {option.description}
                    </span>
                  </div>
                  {theme === option.value && (
                    <span className={styles.checkmark}>✓</span>
                  )}
                </button>
              ))}
            </div>
            <p className={styles.settingHint}>
              Tema actual:{" "}
              <strong>{resolvedTheme === "light" ? "Claro" : "Oscuro"}</strong>
            </p>
          </div>
        </section>

        {/* Sección de Paleta de Colores (preparada para futuro) */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Paleta de colores</h2>
            <p className={styles.sectionDescription}>
              Personaliza los colores principales de la aplicación
            </p>
          </div>

          <div className={styles.settingGroup}>
            <div className={styles.comingSoon}>
              <span className={styles.comingSoonIcon}>🎨</span>
              <p className={styles.comingSoonText}>Próximamente</p>
              <p className={styles.comingSoonDescription}>
                Pronto podrás personalizar los colores de la aplicación
              </p>
            </div>
          </div>
        </section>

        {/* Sección de Preferencias (preparada para futuro) */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Preferencias</h2>
            <p className={styles.sectionDescription}>
              Configura el comportamiento de la aplicación
            </p>
          </div>

          <div className={styles.settingGroup}>
            <div className={styles.comingSoon}>
              <span className={styles.comingSoonIcon}>⚙️</span>
              <p className={styles.comingSoonText}>Próximamente</p>
              <p className={styles.comingSoonDescription}>
                Formato de moneda, idioma, notificaciones y más
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
