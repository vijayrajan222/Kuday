export interface ILogger {
    info(message: string, meta?: unknown): void;
    warn(message: string, meta?: unknown): void;
    error(message: string, error?: unknown): void;
    debug(message: string, meta?: unknown): void;
}

export class Logger implements ILogger {
    private static instance: Logger;

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    info(message: string, meta?: unknown): void {
        const timestamp = new Date().toISOString();
        console.log(`[INFO] [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : "");
    }

    warn(message: string, meta?: unknown): void {
        const timestamp = new Date().toISOString();
        console.warn(`[WARN] [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : "");
    }

    error(message: string, error?: unknown): void {
        const timestamp = new Date().toISOString();
        console.error(`[ERROR] [${timestamp}] ${message}`, error || "");
    }

    debug(message: string, meta?: unknown): void {
        const timestamp = new Date().toISOString();
        console.debug(`[DEBUG] [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : "");
    }
}

export const logger = Logger.getInstance();
