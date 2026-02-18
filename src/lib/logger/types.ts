export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: Error;
}

export interface Transport {
  log(entry: LogEntry): void;
}

export interface LoggerConfig {
  level: LogLevel;
  transports: Transport[];
  sensitiveFields?: string[];
}
