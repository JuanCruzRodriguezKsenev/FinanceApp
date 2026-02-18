// Script para prevenir flash de tema incorrecto durante la hidratación
(function () {
  try {
    const stored = localStorage.getItem("finance-app-theme");
    const theme = stored || "system";

    let resolvedTheme = theme;
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      resolvedTheme = mediaQuery.matches ? "dark" : "light";
    }

    document.documentElement.classList.add(resolvedTheme);
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  } catch (e) {
    // Si hay algún error, no hacer nada
  }
})();
