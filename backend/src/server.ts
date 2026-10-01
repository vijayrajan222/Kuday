import { connectMongo } from "./infrastructure/database/ConnectMongoDB.js";
import express from "express";
import { createAuthRouter } from "./presentation/router/AuthRouter.js";
import { AuthController } from "./presentation/controller/AuthController.js";
import { SignUpUserUseCase } from "./application/use-case/auth/SignUpUserUseCase.js";
import { MongoUserRepository } from "./infrastructure/repository/MongoUserRepository.js";
import { HashService } from "./infrastructure/services/HashingService.js";
import { MongoOtpRepository } from "./infrastructure/repository/MongoOtpRepository.js";
import { OtpService } from "./infrastructure/services/OtpServices.js";
import { NodemailerMailService } from "./infrastructure/services/NodemailerService.js";
import { VerifyOptUseCase } from "./application/use-case/auth/VerifyOtpUseCase.js";
import { LoginUserUseCase } from "./application/use-case/auth/LoginUserUseCase.js";

import cors from "cors";
import { JwtService } from "./infrastructure/services/JwtServices.js";
import { GoogleAuthUseCase } from "./application/use-case/auth/GoogleAuthUseCase.js";
import { ForgotPasswordUseCase } from "./application/use-case/auth/ForgotPasswordUseCase.js";
import { VerifyResetOtpUseCase } from "./application/use-case/auth/VerifyResetOtpUseCase.js";
import { ResetPasswordUseCase } from "./application/use-case/auth/ResetPasswordUseCase.js";


async function startServer() {
    console.log("waiting for the connection...")
    await connectMongo()
    
    let PORT = process.env.PORT || 3000
    let app = express()
    // Enable CORS for frontend requests
    app.use(cors({
        origin: ["http://localhost:5173", "http://localhost:3000"], // Allows React/Vite dev server
        credentials: true,
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }))
    console.log("this is the server")
    
    
    //--------------------------------------------------------------------
    // this is where we do wireup everything together and do dependency injection
    const userrepo = new MongoUserRepository();
    const hasher = new HashService();
    const otprepo = new MongoOtpRepository();
    const otpservice = new OtpService();
    const mailer = new NodemailerMailService();
    const jwtService = new JwtService();

    const googleAuthUseCase = new GoogleAuthUseCase(userrepo, jwtService);
    const signUpUsecase = new SignUpUserUseCase(userrepo, hasher, otprepo, otpservice, mailer);
    const verifyOtpUseCase = new VerifyOptUseCase(userrepo, otprepo, jwtService);
    const loginUseCase = new LoginUserUseCase(userrepo, hasher, jwtService);

    const forgotPasswordUseCase = new ForgotPasswordUseCase(userrepo, otpservice, otprepo, mailer);
    const verifyResetOtpUseCase = new VerifyResetOtpUseCase(userrepo, otprepo, jwtService);
    const resetPasswordUseCase = new ResetPasswordUseCase(userrepo, hasher);

    const authcontroller = new AuthController(
        signUpUsecase,
        verifyOtpUseCase,
        loginUseCase,
        googleAuthUseCase,
        forgotPasswordUseCase,
        verifyResetOtpUseCase,
        resetPasswordUseCase,
        jwtService
    );

    const authRouter = createAuthRouter(authcontroller);
    app.use("/auth", authRouter);
    
    //--------------------------------------------------------------------

    app.listen(PORT, () =>
        console.log("server is running on port 3000")
    )
}
startServer().catch((err) => {
    console.log(err)
})