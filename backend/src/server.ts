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
import { UpdateRoleUseCase } from "./application/use-case/user/UpdateRoleUseCase.js";
import { CreateLifestyleUseCase } from "./application/use-case/lifestyle/CreateLifestyleUseCase.js";
import { GetLifestyleUseCase } from "./application/use-case/lifestyle/GetLifestyleUseCase.js";
import { CloudinaryService } from "./infrastructure/services/CloudinaryService.js";
import { UploadIdentityUseCase } from "./application/use-case/user/UploadIdentityUseCase.js";

import { MongoRoomRepository } from "./infrastructure/repository/MongoRoomRepository.js";
import { CreateRoomUseCase } from "./application/use-case/room/CreateRoomUseCase.js";
import { GetRoomsUseCase } from "./application/use-case/room/GetRoomsUseCase.js";
import { RoomController } from "./presentation/controller/RoomController.js";
import { createRoomRouter } from "./presentation/router/RoomRouter.js";

import { MongoSeekerPreferenceRepository } from "./infrastructure/repository/MongoSeekerPreferenceRepository.js";
import { CreateSeekerPreferenceUseCase } from "./application/use-case/seeker/CreateSeekerPreferenceUseCase.js";
import { GetSeekerPreferencesUseCase } from "./application/use-case/seeker/GetSeekerPreferencesUseCase.js";
import { SeekerPreferenceController } from "./presentation/controller/SeekerPreferenceController.js";
import { createSeekerPreferenceRouter } from "./presentation/router/SeekerPreferenceRouter.js";

import { MongoNotificationRepository } from "./infrastructure/repository/MongoNotificationRepository.js";
import { GetNotificationsUseCase } from "./application/use-case/notification/GetNotificationsUseCase.js";
import { CreateNotificationUseCase } from "./application/use-case/notification/CreateNotificationUseCase.js";
import { MarkNotificationReadUseCase } from "./application/use-case/notification/MarkNotificationReadUseCase.js";
import { NotificationController } from "./presentation/controller/NotificationController.js";
import { createNotificationRouter } from "./presentation/router/NotificationRouter.js";

import { UserController } from "./presentation/controller/UserController.js";
import { LifestyleController } from "./presentation/controller/LifestyleController.js";
import { createUserRouter } from "./presentation/router/UserRouter.js";
import { createLifestyleRouter } from "./presentation/router/LifestyleRouter.js";

import { AdminLoginUseCase } from "./application/use-case/admin/AdminLoginUseCase.js";
import { GetAdminStatsUseCase } from "./application/use-case/admin/GetAdminStatsUseCase.js";
import { GetAllUsersUseCase } from "./application/use-case/admin/GetAllUsersUseCase.js";
import { VerifyUserIdentityUseCase } from "./application/use-case/admin/VerifyUserIdentityUseCase.js";
import { ToggleBlockUserUseCase } from "./application/use-case/admin/ToggleBlockUserUseCase.js";
import { AdminController } from "./presentation/controller/AdminController.js";
import { createAdminRouter } from "./presentation/router/AdminRouter.js";
import { globalErrorHandler } from "./presentation/middleware/ErrorHandlerMiddleware.js";

async function startServer() {
    console.log("waiting for the connection...");
    await connectMongo();

    const PORT = process.env.PORT || 3000;
    const app = express();

    // Enable CORS for frontend requests
    app.use(
        cors({
            origin: ["http://localhost:5173", "http://localhost:3000"], // Allows React/Vite dev server
            credentials: true,
        })
    );
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ extended: true, limit: "50mb" }));
    console.log("this is the server");

    //--------------------------------------------------------------------
    // Dependency Injection & Wiring
    const userrepo = new MongoUserRepository();
    const lifestylerepo = new MongoLifestyleRepository();
    const roomrepo = new MongoRoomRepository();
    const seekerrepo = new MongoSeekerPreferenceRepository();
    const notificationrepo = new MongoNotificationRepository();

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

    const updateProfileUseCase = new UpdateProfileUseCase(userrepo, cloudinaryService);
    const updateRoleUseCase = new UpdateRoleUseCase(userrepo, roomrepo, seekerrepo);
    const createLifestyleUseCase = new CreateLifestyleUseCase(lifestylerepo, userrepo);
    const getLifestyleUseCase = new GetLifestyleUseCase(lifestylerepo);
    const uploadIdentityUseCase = new UploadIdentityUseCase(userrepo, cloudinaryService, notificationrepo);

    const createRoomUseCase = new CreateRoomUseCase(roomrepo, userrepo, cloudinaryService);
    const getRoomsUseCase = new GetRoomsUseCase(roomrepo, userrepo, lifestylerepo, seekerrepo);

    const createSeekerPreferenceUseCase = new CreateSeekerPreferenceUseCase(seekerrepo, userrepo);
    const getSeekerPreferencesUseCase = new GetSeekerPreferencesUseCase(seekerrepo, userrepo, lifestylerepo, roomrepo);

    const getNotificationsUseCase = new GetNotificationsUseCase(notificationrepo);
    const createNotificationUseCase = new CreateNotificationUseCase(notificationrepo);
    const markNotificationReadUseCase = new MarkNotificationReadUseCase(notificationrepo);

    // Admin Use Cases
    const adminLoginUseCase = new AdminLoginUseCase(userrepo, hasher, jwtService);
    const getAdminStatsUseCase = new GetAdminStatsUseCase(userrepo, roomrepo);
    const getAllUsersUseCase = new GetAllUsersUseCase(userrepo);
    const verifyUserIdentityUseCase = new VerifyUserIdentityUseCase(userrepo, notificationrepo);
    const toggleBlockUserUseCase = new ToggleBlockUserUseCase(userrepo);

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

    const userController = new UserController(
        updateProfileUseCase,
        uploadIdentityUseCase,
        updateRoleUseCase,
        userrepo
    );
    const lifestyleController = new LifestyleController(
        createLifestyleUseCase,
        getLifestyleUseCase
    );
    const roomController = new RoomController(createRoomUseCase, getRoomsUseCase);
    const seekerController = new SeekerPreferenceController(
        createSeekerPreferenceUseCase,
        getSeekerPreferencesUseCase
    );
    const notificationController = new NotificationController(
        getNotificationsUseCase,
        createNotificationUseCase,
        markNotificationReadUseCase
    );
    const adminController = new AdminController(
        adminLoginUseCase,
        getAdminStatsUseCase,
        getAllUsersUseCase,
        verifyUserIdentityUseCase,
        toggleBlockUserUseCase
    );

    const authRouter = createAuthRouter(authcontroller);
    const userRouter = createUserRouter(userController);
    const lifestyleRouter = createLifestyleRouter(lifestyleController);
    const roomRouter = createRoomRouter(roomController);
    const seekerRouter = createSeekerPreferenceRouter(seekerController);
    const notificationRouter = createNotificationRouter(notificationController);
    const adminRouter = createAdminRouter(adminController);

    app.use("/auth", authRouter);
    app.use("/users", userRouter);
    app.use("/lifestyles", lifestyleRouter);
    app.use("/rooms", roomRouter);
    app.use("/seeker-preferences", seekerRouter);
    app.use("/notifications", notificationRouter);
    app.use("/admin", adminRouter);

    // Global Error Handler Middleware
    app.use(globalErrorHandler);

    //--------------------------------------------------------------------

    app.listen(PORT, () => console.log("server is running on port 3000"));
}

startServer().catch((err) => {
    console.log(err);
});