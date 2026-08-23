export class Logger {
    defaultSource;
    entries = [];
    listeners = new Set();
    maxEntries = 5000;
    constructor(defaultSource = "app") {
        this.defaultSource = defaultSource;
    }
    log(level, source, message, data) {
        const entry = {
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
    debug(source, message, data) {
        return this.log("debug", source, message, data);
    }
    info(source, message, data) {
        return this.log("info", source, message, data);
    }
    warn(source, message, data) {
        return this.log("warn", source, message, data);
    }
    error(source, message, data) {
        return this.log("error", source, message, data);
    }
    success(source, message, data) {
        return this.log("success", source, message, data);
    }
    getAll() {
        return [...this.entries];
    }
    clear() {
        this.entries = [];
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    getCounts() {
        const counts = { debug: 0, info: 0, warn: 0, error: 0, success: 0 };
        for (const entry of this.entries) {
            counts[entry.level]++;
        }
        return counts;
    }
}
