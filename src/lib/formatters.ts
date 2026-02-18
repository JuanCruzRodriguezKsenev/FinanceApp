/**
 * Formatadores centralizados para números, fechas, monedas
 * Evita repetición de Intl.* en múltiples componentes
 */

// Configuración de locale
const LOCALE = "es-ES";
const CURRENCY = "EUR";

// Formatadores singleton (reutilizan misma instancia)
const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat(LOCALE, {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/**
 * Objeto con todos los formatadores
 */
export const formatters = {
  /**
   * Formatea número como moneda EUR
   * @example formatters.currency(100) → "100,00 €"
   */
  currency: (amount: number | string): string => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return currencyFormatter.format(num);
  },

  /**
   * Formatea número simple
   * @example formatters.number(1234.5) → "1.234,50"
   */
  number: (value: number | string): string => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return numberFormatter.format(num);
  },

  /**
   * Formatea como porcentaje
   * @example formatters.percent(0.25) → "25 %"
   */
  percent: (value: number | string): string => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return percentFormatter.format(num);
  },

  /**
   * Formatea fecha (sin hora)
   * @example formatters.date(new Date()) → "13 feb 2026"
   */
  date: (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return dateFormatter.format(d);
  },

  /**
   * Formatea fecha y hora
   * @example formatters.dateTime(new Date()) → "13 feb 2026, 14:30"
   */
  dateTime: (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return dateTimeFormatter.format(d);
  },

  /**
   * Formatea solo la hora
   * @example formatters.time(new Date()) → "14:30:00"
   */
  time: (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return timeFormatter.format(d);
  },

  /**
   * Formatea diferencia de fecha en palabras
   * @example formatters.relativeDate(new Date(Date.now() - 86400000)) → "hace 1 día"
   */
  relativeDate: (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSecs < 60) return "Hace unos segundos";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
    if (diffWeeks < 4)
      return `Hace ${diffWeeks} semana${diffWeeks > 1 ? "s" : ""}`;
    if (diffMonths < 12)
      return `Hace ${diffMonths} mes${diffMonths > 1 ? "es" : ""}`;
    return `Hace ${diffYears} año${diffYears > 1 ? "s" : ""}`;
  },

  /**
   * Trunca texto a longitud máxima con ellipsis
   * @example formatters.truncate("texto muy largo", 10) → "texto muy..."
   */
  truncate: (text: string, maxLength: number = 50): string => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  },

  /**
   * Formatea número como cantidad compacta (1.5k, 2.3m, etc)
   * @example formatters.compact(1500) → "1.5 k"
   */
  compact: (value: number): string => {
    const units = ["", "k", "M", "G", "T"];
    let index = 0;
    let num = Math.abs(value);

    while (num >= 1000 && index < units.length - 1) {
      num /= 1000;
      index++;
    }

    return `${value < 0 ? "-" : ""}${numberFormatter.format(num)} ${units[index]}`.trim();
  },
};

/**
 * Alias cortos para métodos más usados
 */
export const fmt = {
  currency: formatters.currency,
  number: formatters.number,
  percent: formatters.percent,
  date: formatters.date,
  dateTime: formatters.dateTime,
  time: formatters.time,
  relative: formatters.relativeDate,
  truncate: formatters.truncate,
  compact: formatters.compact,
};
