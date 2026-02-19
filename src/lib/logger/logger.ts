import { LogEntry, LoggerConfig,LogLevel } from "./types";

export class Logger {
  private readonly config: LoggerConfig;
  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.config.level];
  }

  private sanitize(data: any): any {
    if (!data || typeof data !== "object") {
      return data;
    }

    const sensitive = this.config.sensitiveFields || [
      "password",
      "token",
      "secret",
      "apiKey",
      "api_key",
      "creditCard",
      "credit_card",
      "ssn",
      "cvv",
    ];

    const result: any = Array.isArray(data) ? [] : {};

    for (const key in data) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitive.some((field) =>
        lowerKey.includes(field.toLowerCase()),
      );

      if (isSensitive) {
        result[key] = "[REDACTED]";
      } else if (typeof data[key] === "object" && data[key] !== null) {
        result[key] = this.sanitize(data[key]);
      } else {
        result[key] = data[key];
      }
    }

    return result;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error,
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: context ? this.sanitize(context) : undefined,
      error,
    };

    for (const transport of this.config.transports) {
      transport.log(entry);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log("error", message, context, error);
  }
}
