export interface ILogger {
    info(message: string, meta?: unknown): void;
    warn(message: string, meta?: unknown): void;
    error(message: string, error?: unknown): void;
    debug(message: string, meta?: unknown): void;
}
