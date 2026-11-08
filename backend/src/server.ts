import http from "http";
import express from "express";
import cors from "cors";
import { connectMongo } from "@infrastructure/database/ConnectMongoDB";
import { setupAppDependencies } from "@infrastructure/di/AppFactory";
import { globalErrorHandler } from "@presentation/middleware/ErrorHandlerMiddleware";

async function startServer(): Promise<void> {
    console.log("Waiting for database connection...");
    await connectMongo();

    const PORT = process.env.PORT || 3000;
    const app = express();

    // Enable CORS for frontend requests
    app.use(
        cors({
            origin: ["http://localhost:5173", "http://localhost:3000"],
            credentials: true,
        })
    );
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ extended: true, limit: "50mb" }));

    // Dependency Injection, Route Mounting, and Socket Service setup
    const socketService = setupAppDependencies(app);

    // Global Error Handler Middleware
    app.use(globalErrorHandler);

    // Create HTTP Server & Initialize Socket.io
    const server = http.createServer(app);
    socketService.init(server);

    server.listen(PORT, () => {
        console.log(`Server is running with Socket.io on port ${PORT}`);
    });
}

startServer().catch((err: unknown) => {
    console.error("Failed to start server:", err);
});
