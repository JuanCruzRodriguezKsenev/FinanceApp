/* src/db/index.ts */
import { neonConfig,Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as financeSchema from "./schema/finance";
import * as identitySchema from "./schema/identity";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no definida en .env");
}

// Configurar WebSocket para desarrollo local
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const schema = {
  ...identitySchema,
  ...financeSchema,
};

export const db = drizzle(pool, { schema });

// Exportar las tablas
export { accounts, savingsGoals, transactions } from "./schema/finance";
export {
  accounts as accountsTable,
  sessions,
  users,
  verificationTokens,
} from "./schema/identity";

export type TransactionCategory =
  // Gastos
  | "food"
  | "transportation" // Changed from "transport"
  | "entertainment"
  | "health"
  | "shopping"
  | "bills"
  | "rent"
  | "utilities"
  // Ingresos
  | "salary"
  | "freelance"
  | "bonus"
  | "investment_return"
  // Ahorro/Transferencias
  | "emergency_fund"
  | "vacation"
  | "house"
  | "car"
  | "education"
  | "retirement"
  // Otros
  | "other";
