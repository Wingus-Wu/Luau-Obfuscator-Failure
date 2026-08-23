export type LogLevel = "debug" | "info" | "warn" | "error" | "success";

export interface LogEntry {
  level: LogLevel;
  source: string;
  message: string;
  timestamp: number;
  data?: unknown;
}

export class Logger {
  private entries: LogEntry[] = [];
  private listeners: Set<(entry: LogEntry) => void> = new Set();
  private maxEntries = 5000;

  constructor(private defaultSource = "app") {}

  log(level: LogLevel, source: string, message: string, data?: unknown) {
    const entry: LogEntry = {
      level,
      source: source || this.defaultSource,
      message,
      timestamp: Date.now(),
      data,
    };
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
    for (const listener of this.listeners) {
      listener(entry);
    }
    return entry;
  }

  debug(source: string, message: string, data?: unknown) {
    return this.log("debug", source, message, data);
  }

  info(source: string, message: string, data?: unknown) {
    return this.log("info", source, message, data);
  }

  warn(source: string, message: string, data?: unknown) {
    return this.log("warn", source, message, data);
  }

  error(source: string, message: string, data?: unknown) {
    return this.log("error", source, message, data);
  }

  success(source: string, message: string, data?: unknown) {
    return this.log("success", source, message, data);
  }

  getAll() {
    return [...this.entries];
  }

  clear() {
    this.entries = [];
  }

  subscribe(listener: (entry: LogEntry) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getCounts() {
    const counts = { debug: 0, info: 0, warn: 0, error: 0, success: 0 } as Record<LogLevel, number>;
    for (const entry of this.entries) {
      counts[entry.level]++;
    }
    return counts;
  }
}
