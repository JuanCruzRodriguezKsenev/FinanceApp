import styles from "./PaymentCard.module.css";

interface Props {
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  holder: string;
}

export default function PaymentCardContent({
  last4,
  expiryMonth,
  expiryYear,
  holder,
}: Props) {
  const formattedExpiry = `${expiryMonth.toString().padStart(2, "0")}/${expiryYear
    .toString()
    .slice(-2)}`;

  return (
    <>
      <div className={styles.chipRow}>
        <svg className={styles.chip} viewBox="0 0 50 35" aria-hidden="true">
          <defs>
            <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
          <rect width="50" height="35" rx="5" fill="url(#chipGrad)" />
          <path
            d="M15 0 V35 M35 0 V35 M0 12 H15 M35 12 H50 M0 23 H15 M35 23 H50"
            fill="none"
            stroke="#000"
            strokeWidth="1.5"
            strokeOpacity="0.35"
          />
          <rect
            x="18"
            y="10"
            width="14"
            height="15"
            rx="2"
            fill="none"
            stroke="#000"
            strokeWidth="1.5"
            strokeOpacity="0.35"
          />
        </svg>

        <svg
          className={styles.contactless}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            d="M8.5 14.5C9.6 13.4 10.25 11.8 10.25 10C10.25 8.2 9.6 6.6 8.5 5.5M12 18C14.2 15.8 15.5 12.8 15.5 9.5C15.5 6.2 14.2 3.2 12 1M15.5 21.5C18.8 18.2 20.75 13.8 20.75 9C20.75 4.2 18.8 -0.2 15.5 -3.5"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className={styles.numberRow}>
        <span>••••</span> <span>••••</span> <span>••••</span>
        <span>{last4}</span>
      </div>

      <div className={styles.dateRow}>
        <div className={styles.validThruLabel}>
          VALID
          <br />
          THRU
        </div>
        <div className={styles.dateValue}>{formattedExpiry}</div>
      </div>

      <div className={styles.nameLogoRow}>
        <div className={styles.nameGroup}>
          <span className={styles.cardHolderLabel}>Holder</span>
          <span className={styles.cardHolder}>{holder.toUpperCase()}</span>
        </div>
        <svg
          className={styles.networkLogo}
          viewBox="0 0 50 30"
          aria-hidden="true"
        >
          <circle cx="15" cy="15" r="15" fill="#eb001b" fillOpacity="0.8" />
          <circle cx="35" cy="15" r="15" fill="#f79e1b" fillOpacity="0.8" />
        </svg>
      </div>
    </>
  );
}
