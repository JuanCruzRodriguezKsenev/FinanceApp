import styles from "./NavbarDivider.module.css";

interface NavbarDividerProps {
  vertical?: boolean;
  className?: string;
}

export function NavbarDivider({
  vertical = false,
  className = "",
}: NavbarDividerProps) {
  return (
    <div
      className={`${styles.divider} ${vertical ? styles.vertical : styles.horizontal} ${className}`}
      role="presentation"
    />
  );
}
