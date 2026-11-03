import type { Express } from "express";

// Repositories
import { MongoUserRepository } from "../repository/MongoUserRepository.js";
import { MongoLifestyleRepository } from "../repository/MongoLifestyleRepository.js";
import { MongoRoomRepository } from "../repository/MongoRoomRepository.js";
import { MongoSeekerPreferenceRepository } from "../repository/MongoSeekerPreferenceRepository.js";
import { MongoNotificationRepository } from "../repository/MongoNotificationRepository.js";
import { MongoOtpRepository } from "../repository/MongoOtpRepository.js";

// Services
import { HashService } from "../services/HashingService.js";
import { OtpService } from "../services/OtpServices.js";
import { NodemailerMailService } from "../services/NodemailerService.js";
import { JwtService } from "../services/JwtServices.js";
import { CloudinaryService } from "../services/CloudinaryService.js";

// Auth Use Cases
import { SignUpUserUseCase } from "../../application/use-case/auth/SignUpUserUseCase.js";
import { VerifyOptUseCase } from "../../application/use-case/auth/VerifyOtpUseCase.js";
import { LoginUserUseCase } from "../../application/use-case/auth/LoginUserUseCase.js";
import { GoogleAuthUseCase } from "../../application/use-case/auth/GoogleAuthUseCase.js";
import { ForgotPasswordUseCase } from "../../application/use-case/auth/ForgotPasswordUseCase.js";
import { VerifyResetOtpUseCase } from "../../application/use-case/auth/VerifyResetOtpUseCase.js";
import { ResetPasswordUseCase } from "../../application/use-case/auth/ResetPasswordUseCase.js";
import { RefreshTokenUseCase } from "../../application/use-case/auth/RefreshTokenUseCase.js";

// User Use Cases
import { UpdateProfileUseCase } from "../../application/use-case/user/UpdateProfileUseCase.js";
import { UpdateRoleUseCase } from "../../application/use-case/user/UpdateRoleUseCase.js";
import { UploadIdentityUseCase } from "../../application/use-case/user/UploadIdentityUseCase.js";
import { GetUserProfileUseCase } from "../../application/use-case/user/GetUserProfileUseCase.js";

// Lifestyle Use Cases
import { CreateLifestyleUseCase } from "../../application/use-case/lifestyle/CreateLifestyleUseCase.js";
import { GetLifestyleUseCase } from "../../application/use-case/lifestyle/GetLifestyleUseCase.js";

// Room Use Cases
import { CreateRoomUseCase } from "../../application/use-case/room/CreateRoomUseCase.js";
import { GetRoomsUseCase } from "../../application/use-case/room/GetRoomsUseCase.js";

// Seeker Use Cases
import { CreateSeekerPreferenceUseCase } from "../../application/use-case/seeker/CreateSeekerPreferenceUseCase.js";
import { GetSeekerPreferencesUseCase } from "../../application/use-case/seeker/GetSeekerPreferencesUseCase.js";

// Notification Use Cases
import { GetNotificationsUseCase } from "../../application/use-case/notification/GetNotificationsUseCase.js";
import { CreateNotificationUseCase } from "../../application/use-case/notification/CreateNotificationUseCase.js";
import { MarkNotificationReadUseCase } from "../../application/use-case/notification/MarkNotificationReadUseCase.js";

// Admin Use Cases
import { AdminLoginUseCase } from "../../application/use-case/admin/AdminLoginUseCase.js";
import { GetAdminStatsUseCase } from "../../application/use-case/admin/GetAdminStatsUseCase.js";
import { GetAllUsersUseCase } from "../../application/use-case/admin/GetAllUsersUseCase.js";
import { VerifyUserIdentityUseCase } from "../../application/use-case/admin/VerifyUserIdentityUseCase.js";
import { ToggleBlockUserUseCase } from "../../application/use-case/admin/ToggleBlockUserUseCase.js";

// Controllers
import { AuthController } from "../../presentation/controller/AuthController.js";
import { UserController } from "../../presentation/controller/UserController.js";
import { LifestyleController } from "../../presentation/controller/LifestyleController.js";
import { RoomController } from "../../presentation/controller/RoomController.js";
import { SeekerPreferenceController } from "../../presentation/controller/SeekerPreferenceController.js";
import { NotificationController } from "../../presentation/controller/NotificationController.js";
import { AdminController } from "../../presentation/controller/AdminController.js";

// Routers
import { createAuthRouter } from "../../presentation/router/AuthRouter.js";
import { createUserRouter } from "../../presentation/router/UserRouter.js";
import { createLifestyleRouter } from "../../presentation/router/LifestyleRouter.js";
import { createRoomRouter } from "../../presentation/router/RoomRouter.js";
import { createSeekerPreferenceRouter } from "../../presentation/router/SeekerPreferenceRouter.js";
import { createNotificationRouter } from "../../presentation/router/NotificationRouter.js";
import { createAdminRouter } from "../../presentation/router/AdminRouter.js";

export function setupAppDependencies(app: Express): void {
    // 1. Repositories
    const userrepo = new MongoUserRepository();
    const lifestylerepo = new MongoLifestyleRepository();
    const roomrepo = new MongoRoomRepository();
    const seekerrepo = new MongoSeekerPreferenceRepository();
    const notificationrepo = new MongoNotificationRepository();
    const otprepo = new MongoOtpRepository();

    // 2. Infrastructure Services
    const hasher = new HashService();
    const otpservice = new OtpService();
    const mailer = new NodemailerMailService();
    const jwtService = new JwtService();
    const cloudinaryService = new CloudinaryService();

    // 3. Application Use Cases
    const signUpUsecase = new SignUpUserUseCase(userrepo, hasher, otprepo, otpservice, mailer);
    const verifyOtpUseCase = new VerifyOptUseCase(userrepo, otprepo, jwtService);
    const loginUseCase = new LoginUserUseCase(userrepo, hasher, jwtService);
    const googleAuthUseCase = new GoogleAuthUseCase(userrepo, jwtService);
    const forgotPasswordUseCase = new ForgotPasswordUseCase(userrepo, otpservice, otprepo, mailer);
    const verifyResetOtpUseCase = new VerifyResetOtpUseCase(userrepo, otprepo, jwtService);
    const resetPasswordUseCase = new ResetPasswordUseCase(userrepo, hasher);
    const refreshTokenUseCase = new RefreshTokenUseCase(userrepo, jwtService);

    const updateProfileUseCase = new UpdateProfileUseCase(userrepo, cloudinaryService);
    const updateRoleUseCase = new UpdateRoleUseCase(userrepo, roomrepo, seekerrepo);
    const uploadIdentityUseCase = new UploadIdentityUseCase(userrepo, cloudinaryService, notificationrepo);
    const getUserProfileUseCase = new GetUserProfileUseCase(userrepo);

    const createLifestyleUseCase = new CreateLifestyleUseCase(lifestylerepo, userrepo);
    const getLifestyleUseCase = new GetLifestyleUseCase(lifestylerepo);

    const createRoomUseCase = new CreateRoomUseCase(roomrepo, userrepo, cloudinaryService);
    const getRoomsUseCase = new GetRoomsUseCase(roomrepo, userrepo, lifestylerepo, seekerrepo);

    const createSeekerPreferenceUseCase = new CreateSeekerPreferenceUseCase(seekerrepo, userrepo);
    const getSeekerPreferencesUseCase = new GetSeekerPreferencesUseCase(seekerrepo, userrepo, lifestylerepo, roomrepo);

    const getNotificationsUseCase = new GetNotificationsUseCase(notificationrepo);
    const createNotificationUseCase = new CreateNotificationUseCase(notificationrepo);
    const markNotificationReadUseCase = new MarkNotificationReadUseCase(notificationrepo);

    const adminLoginUseCase = new AdminLoginUseCase(userrepo, hasher, jwtService);
    const getAdminStatsUseCase = new GetAdminStatsUseCase(userrepo, roomrepo);
    const getAllUsersUseCase = new GetAllUsersUseCase(userrepo);
    const verifyUserIdentityUseCase = new VerifyUserIdentityUseCase(userrepo, notificationrepo);
    const toggleBlockUserUseCase = new ToggleBlockUserUseCase(userrepo);

    // 4. Controllers
    const authController = new AuthController(
        signUpUsecase,
        verifyOtpUseCase,
        loginUseCase,
        googleAuthUseCase,
        forgotPasswordUseCase,
        verifyResetOtpUseCase,
        resetPasswordUseCase,
        jwtService,
        refreshTokenUseCase
    );

    const userController = new UserController(
        updateProfileUseCase,
        uploadIdentityUseCase,
        updateRoleUseCase,
        getUserProfileUseCase
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

    // 5. Routers & Route Mounting
    app.use("/auth", createAuthRouter(authController));
    app.use("/users", createUserRouter(userController)); 
    app.use("/lifestyles", createLifestyleRouter(lifestyleController));
    app.use("/rooms", createRoomRouter(roomController));
    app.use("/seeker-preferences", createSeekerPreferenceRouter(seekerController));
    app.use("/notifications", createNotificationRouter(notificationController));
    app.use("/admin", createAdminRouter(adminController));
}

// is there any other place where the router mounting takes place 
