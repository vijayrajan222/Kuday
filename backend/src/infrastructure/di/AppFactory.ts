import type { Express } from "express";

// Repositories
import { MongoUserRepository } from "@infrastructure/repository/MongoUserRepository";
import { MongoLifestyleRepository } from "@infrastructure/repository/MongoLifestyleRepository";
import { MongoRoomRepository } from "@infrastructure/repository/MongoRoomRepository";
import { MongoSeekerPreferenceRepository } from "@infrastructure/repository/MongoSeekerPreferenceRepository";
import { MongoNotificationRepository } from "@infrastructure/repository/MongoNotificationRepository";
import { MongoOtpRepository } from "@infrastructure/repository/MongoOtpRepository";
import { MongoInterestRepository } from "@infrastructure/repository/MongoInterestRepository";
import { MongoMessageRepository } from "@infrastructure/repository/MongoMessageRepository";
import { MongoConversationRepository } from "@infrastructure/repository/MongoConversationRepository";
import { MongoVisitRepository } from "@infrastructure/repository/MongoVisitRepository";
import { MongoWalletRepository } from "@infrastructure/repository/MongoWalletRepository";
import { MongoWalletTransactionRepository } from "@infrastructure/repository/MongoWalletTransactionRepository";
import { MongoPlanRepository } from "@infrastructure/repository/MongoPlanRepository";
import { MongoSubscriptionRepository } from "@infrastructure/repository/MongoSubscriptionRepository";
import { MongoPaymentRepository } from "@infrastructure/repository/MongoPaymentRepository";

// Services
import { HashService } from "@infrastructure/services/HashingService";
import { OtpService } from "@infrastructure/services/OtpServices";
import { NodemailerMailService } from "@infrastructure/services/NodemailerService";
import { JwtService } from "@infrastructure/services/JwtServices";
import { CloudinaryService } from "@infrastructure/services/CloudinaryService";
import { RazorpayService } from "@infrastructure/services/RazorpayService";
import { WalletService } from "@infrastructure/services/WalletService";

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

// Visit Use Cases
import { CreateVisitUseCase } from "@application/use-case/visit/CreateVisitUseCase";
import { GetVisitsUseCase } from "@application/use-case/visit/GetVisitsUseCase";
import { UpdateVisitStatusUseCase } from "@application/use-case/visit/UpdateVisitStatusUseCase";
import { SuggestVisitUseCase } from "@application/use-case/visit/SuggestVisitUseCase";

// Admin Use Cases
import { AdminLoginUseCase } from "@application/use-case/admin/AdminLoginUseCase";
import { GetAdminStatsUseCase } from "@application/use-case/admin/GetAdminStatsUseCase";
import { GetAllUsersUseCase } from "@application/use-case/admin/GetAllUsersUseCase";
import { VerifyUserIdentityUseCase } from "@application/use-case/admin/VerifyUserIdentityUseCase";
import { ToggleBlockUserUseCase } from "@application/use-case/admin/ToggleBlockUserUseCase";

// Chat Use Cases
import { SendMessageUseCase } from "@application/use-case/chat/SendMessageUseCase";
import { GetMessagesUseCase } from "@application/use-case/chat/GetMessagesUseCase";
import { GetConversationsUseCase } from "@application/use-case/chat/GetConversationsUseCase";
import { MarkMessagesAsReadUseCase } from "@application/use-case/chat/MarkMessagesAsReadUseCase";
import { StartConversationUseCase } from "@application/use-case/chat/StartConversationUseCase";
import { GetUnreadCountUseCase } from "@application/use-case/chat/GetUnreadCountUseCase";

// Payment & Subscription Use Cases
import { CreateOrderUseCase } from "@application/use-case/payment/CreateOrderUseCase";
import { CreateTopUpOrderUseCase } from "@application/use-case/payment/CreateTopUpOrderUseCase";
import { VerifyPaymentUseCase } from "@application/use-case/payment/VerifyPaymentUseCase";
import { GetPlansUseCase } from "@application/use-case/payment/GetPlansUseCase";
import { ActivateSubscriptionUseCase } from "@application/use-case/subscription/ActivateSubscriptionUseCase";
import { HandleWebhookUseCase } from "@application/use-case/payment/HandleWebhookUseCase";
import { CancelSubscriptionUseCase } from "@application/use-case/subscription/CancelSubscriptionUseCase";
import { RetryRefundUseCase } from "@application/use-case/subscription/RetryRefundUseCase";
import { GetActiveSubscriptionUseCase } from "@application/use-case/subscription/GetActiveSubscriptionUseCase";
import { GetWalletUseCase } from "@application/use-case/wallet/GetWalletUseCase";
import { PremiumHookService } from "@application/services/PremiumHookService";

// Socket Service
import { SocketService } from "@infrastructure/socket/SocketService";

// Controllers
import { AuthController } from "@presentation/controller/AuthController";
import { UserController } from "@presentation/controller/UserController";
import { LifestyleController } from "@presentation/controller/LifestyleController";
import { RoomController } from "@presentation/controller/RoomController";
import { SeekerPreferenceController } from "@presentation/controller/SeekerPreferenceController";
import { NotificationController } from "@presentation/controller/NotificationController";
import { AdminController } from "@presentation/controller/AdminController";
import { InterestController } from "@presentation/controller/InterestController";
import { ChatController } from "@presentation/controller/ChatController";
import { VisitController } from "@presentation/controller/VisitController";
import { PaymentController } from "@presentation/controller/PaymentController";

// Routers
import { createAuthRouter } from "@presentation/router/AuthRouter";
import { createUserRouter } from "@presentation/router/UserRouter";
import { createLifestyleRouter } from "@presentation/router/LifestyleRouter";
import { createRoomRouter } from "@presentation/router/RoomRouter";
import { createSeekerPreferenceRouter } from "@presentation/router/SeekerPreferenceRouter";
import { createNotificationRouter } from "@presentation/router/NotificationRouter";
import { createAdminRouter } from "@presentation/router/AdminRouter";
import { createInterestRouter } from "@presentation/router/InterestRouter";
import { createChatRouter } from "@presentation/router/ChatRouter";
import { createVisitRouter } from "@presentation/router/VisitRouter";
import { createPaymentRouter } from "@presentation/router/PaymentRouter";
import { createAuthMiddleware } from "@presentation/middleware/AuthMiddleware";

export function setupAppDependencies(app: Express): SocketService {
    // 1. Repositories
    const userrepo = new MongoUserRepository();
    const lifestylerepo = new MongoLifestyleRepository();
    const roomrepo = new MongoRoomRepository();
    const seekerrepo = new MongoSeekerPreferenceRepository();
    const notificationrepo = new MongoNotificationRepository();
    const otprepo = new MongoOtpRepository();
    const interestrepo = new MongoInterestRepository();
    const messagerepo = new MongoMessageRepository();
    const conversationrepo = new MongoConversationRepository();
    const visitrepo = new MongoVisitRepository();
    const walletrepo = new MongoWalletRepository();
    const walletTxRepo = new MongoWalletTransactionRepository();
    const planrepo = new MongoPlanRepository();
    const subscriptionrepo = new MongoSubscriptionRepository();
    const paymentrepo = new MongoPaymentRepository();

    // 2. Infrastructure Services
    const hasher = new HashService();
    const otpservice = new OtpService();
    const mailer = new NodemailerMailService();
    const jwtService = new JwtService();
    const cloudinaryService = new CloudinaryService();
    const razorpayService = new RazorpayService();
    const walletService = new WalletService(walletrepo, walletTxRepo);

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

    // Chat Use Cases
    const sendMessageUseCase = new SendMessageUseCase(messagerepo, conversationrepo, notificationrepo, userrepo);
    const getMessagesUseCase = new GetMessagesUseCase(messagerepo, conversationrepo);
    const getConversationsUseCase = new GetConversationsUseCase(conversationrepo, messagerepo, userrepo);
    const markMessagesAsReadUseCase = new MarkMessagesAsReadUseCase(messagerepo);
    const startConversationUseCase = new StartConversationUseCase(conversationrepo, userrepo);
    const getUnreadCountUseCase = new GetUnreadCountUseCase(messagerepo);

    const socketService = new SocketService(sendMessageUseCase, markMessagesAsReadUseCase);

    // Visit Use Cases
    const createVisitUseCase = new CreateVisitUseCase(
        visitrepo,
        userrepo,
        notificationrepo,
        sendMessageUseCase,
        socketService
    );
    const getVisitsUseCase = new GetVisitsUseCase(visitrepo, userrepo, roomrepo);
    const updateVisitStatusUseCase = new UpdateVisitStatusUseCase(
        visitrepo,
        userrepo,
        notificationrepo,
        sendMessageUseCase,
        socketService
    );
    const suggestVisitUseCase = new SuggestVisitUseCase(
        visitrepo,
        userrepo,
        notificationrepo,
        sendMessageUseCase,
        socketService
    );

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

    const chatController = new ChatController(
        sendMessageUseCase,
        getMessagesUseCase,
        getConversationsUseCase,
        markMessagesAsReadUseCase,
        startConversationUseCase,
        getUnreadCountUseCase,
        socketService
    );

    const visitController = new VisitController(
        createVisitUseCase,
        getVisitsUseCase,
        updateVisitStatusUseCase,
        suggestVisitUseCase
    );

    // Payment & Subscription Use Cases
    const activateSubscriptionUseCase = new ActivateSubscriptionUseCase(
        paymentrepo,
        planrepo,
        subscriptionrepo,
        userrepo,
        walletService
    );

    const createOrderUseCase = new CreateOrderUseCase(
        paymentrepo,
        planrepo,
        subscriptionrepo,
        userrepo,
        razorpayService
    );
    const createTopUpOrderUseCase = new CreateTopUpOrderUseCase(
        paymentrepo,
        userrepo,
        razorpayService
    );
    const verifyPaymentUseCase = new VerifyPaymentUseCase(
        paymentrepo,
        razorpayService,
        activateSubscriptionUseCase,
        walletService
    );
    const getPlansUseCase = new GetPlansUseCase(planrepo);
    const handleWebhookUseCase = new HandleWebhookUseCase(
        paymentrepo,
        subscriptionrepo,
        razorpayService,
        activateSubscriptionUseCase,
        walletService
    );
    const cancelSubscriptionUseCase = new CancelSubscriptionUseCase(
        subscriptionrepo,
        planrepo,
        paymentrepo,
        userrepo,
        walletService
    );
    const retryRefundUseCase = new RetryRefundUseCase(
        subscriptionrepo,
        walletService
    );
    const getActiveSubscriptionUseCase = new GetActiveSubscriptionUseCase(
        subscriptionrepo,
        planrepo,
        paymentrepo
    );
    const getWalletUseCase = new GetWalletUseCase(walletService);
    const premiumHookService = new PremiumHookService(userrepo, subscriptionrepo);

    const paymentController = new PaymentController(
        createOrderUseCase,
        verifyPaymentUseCase,
        getPlansUseCase,
        razorpayService,
        handleWebhookUseCase,
        cancelSubscriptionUseCase,
        retryRefundUseCase,
        getActiveSubscriptionUseCase,
        getWalletUseCase,
        activateSubscriptionUseCase,
        createTopUpOrderUseCase
    );

    const authMiddleware = createAuthMiddleware(jwtService, userrepo);

    // 5. Routers & Route Mounting
    app.use("/auth", createAuthRouter(authController));
    app.use("/users", createUserRouter(userController)); 
    app.use("/lifestyles", createLifestyleRouter(lifestyleController));
    app.use("/rooms", createRoomRouter(roomController));
    app.use("/seeker-preferences", createSeekerPreferenceRouter(seekerController));
    app.use("/notifications", createNotificationRouter(notificationController));
    app.use("/admin", createAdminRouter(adminController));
    app.use("/interests", createInterestRouter(interestController));
    app.use("/chat", createChatRouter(chatController));
    app.use("/visits", createVisitRouter(visitController));
    app.use("/payment", createPaymentRouter(paymentController, authMiddleware));

    return socketService;
}

// is there any other place where the router mounting takes place 
