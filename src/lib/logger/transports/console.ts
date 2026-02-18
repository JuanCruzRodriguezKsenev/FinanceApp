import { Transport, LogEntry } from "../types";

export class ConsoleTransport implements Transport {
  log(entry: LogEntry): void {
    const emoji = {
      debug: "🔍",
      info: "ℹ️",
      warn: "⚠️",
      error: "❌",
    }[entry.level];

    const timestamp = entry.timestamp.toISOString();
    const message = `${emoji} [${timestamp}] ${entry.message}`;

    const logMethod = entry.level === "debug" ? "log" : entry.level;

    if (entry.context && Object.keys(entry.context).length > 0) {
      console[logMethod](message, entry.context);
    } else {
      console[logMethod](message);
    }

    if (entry.error) {
      console.error("Error details:", entry.error);
      if (entry.error.stack) {
        console.error("Stack trace:", entry.error.stack);
      }
    }
  }
}
