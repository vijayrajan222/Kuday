import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "node:dns";

try {
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4", "1.0.0.1"]);
} catch {
    // fallback to system resolver
}

dotenv.config();

const MONGO_URI: string = String(process.env.MONGO_URI);

export async function connectMongo(): Promise<void> {
    let retries = 3;
    while (retries > 0) {
        try {
            console.log("connecting to ", MONGO_URI);
            await mongoose.connect(MONGO_URI);
            console.log("we conected with mongodb");
            return;
        } catch (error: unknown) {
            retries--;
            console.log(`Connection attempt failed (${retries} retries left):`, error);
            if (retries === 0) {
                console.log("Failed to connect with mongodb after retries, exiting.");
                process.exit(1);
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }
}
