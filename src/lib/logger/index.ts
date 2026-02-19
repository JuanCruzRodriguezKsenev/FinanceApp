import { Logger } from "./logger";
import { ConsoleTransport } from "./transports/console";

const logger = new Logger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transports: [new ConsoleTransport()],
  sensitiveFields: [
    "password",
    "token",
    "secret",
    "apiKey",
    "api_key",
    "creditCard",
    "credit_card",
  ],
});

export { logger };
export { Logger } from "./logger";
export * from "./types";
