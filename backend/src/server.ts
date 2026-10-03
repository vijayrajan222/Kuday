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

import { MongoLifestyleRepository } from "./infrastructure/repository/MongoLifestyleRepository.js";
import { UpdateProfileUseCase } from "./application/use-case/user/UpdateProfileUseCase.js";
import { CreateLifestyleUseCase } from "./application/use-case/lifestyle/CreateLifestyleUseCase.js";
import { CloudinaryService } from "./infrastructure/services/CloudinaryService.js";
import { UploadIdentityUseCase } from "./application/use-case/user/UploadIdentityUseCase.js";
import { UserController } from "./presentation/controller/UserController.js";
import { LifestyleController } from "./presentation/controller/LifestyleController.js";
import { createUserRouter } from "./presentation/router/UserRouter.js";
import { createLifestyleRouter } from "./presentation/router/LifestyleRouter.js";

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
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ extended: true, limit: "50mb" }))
    console.log("this is the server")
    
    //--------------------------------------------------------------------
    // Dependency Injection & Wiring
    const userrepo = new MongoUserRepository();
    const lifestylerepo = new MongoLifestyleRepository();
    const hasher = new HashService();
    const otprepo = new MongoOtpRepository();
    const otpservice = new OtpService();
    const mailer = new NodemailerMailService();
    const jwtService = new JwtService();
    const cloudinaryService = new CloudinaryService();

    const googleAuthUseCase = new GoogleAuthUseCase(userrepo, jwtService);
    const signUpUsecase = new SignUpUserUseCase(userrepo, hasher, otprepo, otpservice, mailer);
    const verifyOtpUseCase = new VerifyOptUseCase(userrepo, otprepo, jwtService);
    const loginUseCase = new LoginUserUseCase(userrepo, hasher, jwtService);

    const forgotPasswordUseCase = new ForgotPasswordUseCase(userrepo, otpservice, otprepo, mailer);
    const verifyResetOtpUseCase = new VerifyResetOtpUseCase(userrepo, otprepo, jwtService);
    const resetPasswordUseCase = new ResetPasswordUseCase(userrepo, hasher);

    const updateProfileUseCase = new UpdateProfileUseCase(userrepo);
    const createLifestyleUseCase = new CreateLifestyleUseCase(lifestylerepo, userrepo);
    const uploadIdentityUseCase = new UploadIdentityUseCase(userrepo, cloudinaryService);

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

    const userController = new UserController(updateProfileUseCase, uploadIdentityUseCase, userrepo);
    const lifestyleController = new LifestyleController(createLifestyleUseCase);

    const authRouter = createAuthRouter(authcontroller);
    const userRouter = createUserRouter(userController);
    const lifestyleRouter = createLifestyleRouter(lifestyleController);

    app.use("/auth", authRouter);
    app.use("/users", userRouter);
    app.use("/lifestyles", lifestyleRouter);
    
    //--------------------------------------------------------------------

    app.listen(PORT, () =>
        console.log("server is running on port 3000")
    )
}
startServer().catch((err) => {
    console.log(err)
})