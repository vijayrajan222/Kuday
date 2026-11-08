import type { Express } from "express";

// Repositories
import { MongoUserRepository } from "@infrastructure/repository/MongoUserRepository";
import { MongoLifestyleRepository } from "@infrastructure/repository/MongoLifestyleRepository";
import { MongoRoomRepository } from "@infrastructure/repository/MongoRoomRepository";
import { MongoSeekerPreferenceRepository } from "@infrastructure/repository/MongoSeekerPreferenceRepository";
import { MongoNotificationRepository } from "@infrastructure/repository/MongoNotificationRepository";
import { MongoOtpRepository } from "@infrastructure/repository/MongoOtpRepository";
import { MongoInterestRepository } from "@infrastructure/repository/MongoInterestRepository";

// Services
import { HashService } from "@infrastructure/services/HashingService";
import { OtpService } from "@infrastructure/services/OtpServices";
import { NodemailerMailService } from "@infrastructure/services/NodemailerService";
import { JwtService } from "@infrastructure/services/JwtServices";
import { CloudinaryService } from "@infrastructure/services/CloudinaryService";

// Auth Use Cases
import { SignUpUserUseCase } from "@application/use-case/auth/SignUpUserUseCase";
import { VerifyOptUseCase } from "@application/use-case/auth/VerifyOtpUseCase";
import { LoginUserUseCase } from "@application/use-case/auth/LoginUserUseCase";
import { GoogleAuthUseCase } from "@application/use-case/auth/GoogleAuthUseCase";
import { ForgotPasswordUseCase } from "@application/use-case/auth/ForgotPasswordUseCase";
import { VerifyResetOtpUseCase } from "@application/use-case/auth/VerifyResetOtpUseCase";
import { ResetPasswordUseCase } from "@application/use-case/auth/ResetPasswordUseCase";
import { RefreshTokenUseCase } from "@application/use-case/auth/RefreshTokenUseCase";

// User Use Cases
import { UpdateProfileUseCase } from "@application/use-case/user/UpdateProfileUseCase";
import { UpdateRoleUseCase } from "@application/use-case/user/UpdateRoleUseCase";
import { UploadIdentityUseCase } from "@application/use-case/user/UploadIdentityUseCase";
import { GetUserProfileUseCase } from "@application/use-case/user/GetUserProfileUseCase";
import { GetUserPublicProfileUseCase } from "@application/use-case/user/GetUserPublicProfileUseCase";
import { ChangePasswordUseCase } from "@application/use-case/user/ChangePasswordUseCase";

// Lifestyle Use Cases
import { CreateLifestyleUseCase } from "@application/use-case/lifestyle/CreateLifestyleUseCase";
import { GetLifestyleUseCase } from "@application/use-case/lifestyle/GetLifestyleUseCase";

// Room Use Cases
import { CreateRoomUseCase } from "@application/use-case/room/CreateRoomUseCase";
import { GetRoomsUseCase } from "@application/use-case/room/GetRoomsUseCase";

// Seeker Use Cases
import { CreateSeekerPreferenceUseCase } from "@application/use-case/seeker/CreateSeekerPreferenceUseCase";
import { GetSeekerPreferencesUseCase } from "@application/use-case/seeker/GetSeekerPreferencesUseCase";

// Notification Use Cases
import { GetNotificationsUseCase } from "@application/use-case/notification/GetNotificationsUseCase";
import { CreateNotificationUseCase } from "@application/use-case/notification/CreateNotificationUseCase";
import { MarkNotificationReadUseCase } from "@application/use-case/notification/MarkNotificationReadUseCase";

// Interest Use Cases
import { SendInterestUseCase } from "@application/use-case/interest/SendInterestUseCase";
import { UpdateInterestStatusUseCase } from "@application/use-case/interest/UpdateInterestStatusUseCase";
import { GetReceivedInterestsUseCase } from "@application/use-case/interest/GetReceivedInterestsUseCase";
import { GetSentInterestsUseCase } from "@application/use-case/interest/GetSentInterestsUseCase";

// Admin Use Cases
import { AdminLoginUseCase } from "@application/use-case/admin/AdminLoginUseCase";
import { GetAdminStatsUseCase } from "@application/use-case/admin/GetAdminStatsUseCase";
import { GetAllUsersUseCase } from "@application/use-case/admin/GetAllUsersUseCase";
import { VerifyUserIdentityUseCase } from "@application/use-case/admin/VerifyUserIdentityUseCase";
import { ToggleBlockUserUseCase } from "@application/use-case/admin/ToggleBlockUserUseCase";

// Controllers
import { AuthController } from "@presentation/controller/AuthController";
import { UserController } from "@presentation/controller/UserController";
import { LifestyleController } from "@presentation/controller/LifestyleController";
import { RoomController } from "@presentation/controller/RoomController";
import { SeekerPreferenceController } from "@presentation/controller/SeekerPreferenceController";
import { NotificationController } from "@presentation/controller/NotificationController";
import { AdminController } from "@presentation/controller/AdminController";
import { InterestController } from "@presentation/controller/InterestController";

// Routers
import { createAuthRouter } from "@presentation/router/AuthRouter";
import { createUserRouter } from "@presentation/router/UserRouter";
import { createLifestyleRouter } from "@presentation/router/LifestyleRouter";
import { createRoomRouter } from "@presentation/router/RoomRouter";
import { createSeekerPreferenceRouter } from "@presentation/router/SeekerPreferenceRouter";
import { createNotificationRouter } from "@presentation/router/NotificationRouter";
import { createAdminRouter } from "@presentation/router/AdminRouter";
import { createInterestRouter } from "@presentation/router/InterestRouter";

export function setupAppDependencies(app: Express): void {
    // 1. Repositories
    const userrepo = new MongoUserRepository();
    const lifestylerepo = new MongoLifestyleRepository();
    const roomrepo = new MongoRoomRepository();
    const seekerrepo = new MongoSeekerPreferenceRepository();
    const notificationrepo = new MongoNotificationRepository();
    const otprepo = new MongoOtpRepository();
    const interestrepo = new MongoInterestRepository();

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
    const getUserPublicProfileUseCase = new GetUserPublicProfileUseCase(
        userrepo,
        lifestylerepo,
        roomrepo,
        seekerrepo
    );
    const changePasswordUseCase = new ChangePasswordUseCase(userrepo, hasher);

    const createLifestyleUseCase = new CreateLifestyleUseCase(lifestylerepo, userrepo);
    const getLifestyleUseCase = new GetLifestyleUseCase(lifestylerepo);

    const createRoomUseCase = new CreateRoomUseCase(roomrepo, userrepo, cloudinaryService);
    const getRoomsUseCase = new GetRoomsUseCase(roomrepo, userrepo, lifestylerepo, seekerrepo);

    const createSeekerPreferenceUseCase = new CreateSeekerPreferenceUseCase(seekerrepo, userrepo);
    const getSeekerPreferencesUseCase = new GetSeekerPreferencesUseCase(seekerrepo, userrepo, lifestylerepo, roomrepo);

    const getNotificationsUseCase = new GetNotificationsUseCase(notificationrepo);
    const createNotificationUseCase = new CreateNotificationUseCase(notificationrepo);
    const markNotificationReadUseCase = new MarkNotificationReadUseCase(notificationrepo);

    const sendInterestUseCase = new SendInterestUseCase(interestrepo, userrepo, notificationrepo);
    const updateInterestStatusUseCase = new UpdateInterestStatusUseCase(interestrepo, userrepo, notificationrepo);
    const getReceivedInterestsUseCase = new GetReceivedInterestsUseCase(interestrepo, userrepo);
    const getSentInterestsUseCase = new GetSentInterestsUseCase(interestrepo, userrepo);

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
        getUserProfileUseCase,
        changePasswordUseCase,
        getUserPublicProfileUseCase
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

    const interestController = new InterestController(
        sendInterestUseCase,
        updateInterestStatusUseCase,
        getReceivedInterestsUseCase,
        getSentInterestsUseCase
    );

    // 5. Routers & Route Mounting
    app.use("/auth", createAuthRouter(authController));
    app.use("/users", createUserRouter(userController)); 
    app.use("/lifestyles", createLifestyleRouter(lifestyleController));
    app.use("/rooms", createRoomRouter(roomController));
    app.use("/seeker-preferences", createSeekerPreferenceRouter(seekerController));
    app.use("/notifications", createNotificationRouter(notificationController));
    app.use("/admin", createAdminRouter(adminController));
    app.use("/interests", createInterestRouter(interestController));
}

// is there any other place where the router mounting takes place 
