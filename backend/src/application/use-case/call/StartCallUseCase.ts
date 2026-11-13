import type { IInterestRepository } from "@application/interfaces/repository/IInterestRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { ISubscriptionRepository } from "@application/interfaces/repository/ISubscriptionRepository";
import type { ICallSessionStore, CallSession } from "@application/interfaces/services/ICallSessionStore";
import type {
    IStartCallUseCase,
    StartCallInput,
} from "@application/interfaces/use-case/call/IStartCallUseCase";
import { ForbiddenError, ConflictError, ValidationError, NotFoundError } from "@application/errors/AppError";
import crypto from "crypto";

export type { StartCallInput };

export class StartCallUseCase implements IStartCallUseCase {
    constructor(
        private interestRepository: IInterestRepository,
        private callSessionStore: ICallSessionStore,
        private userRepository: IUserRepository,
        private subscriptionRepository: ISubscriptionRepository
    ) {}

    async execute(input: StartCallInput): Promise<CallSession> {
        const { callerId, receiverId, callType } = input;

        if (!callerId || !receiverId) {
            throw new ValidationError("Caller and receiver IDs are required");
        }

        if (callerId === receiverId) {
            throw new ValidationError("Cannot initiate a call with yourself");
        }

        // 1. Connection check: Only users with accepted connection request can call
        const acceptedConn = await this.interestRepository.findAcceptedBetween(callerId, receiverId);
        if (!acceptedConn) {
            throw new ForbiddenError("Calls are only allowed between users with an accepted connection request");
        }

        // 2. Reject if either user is already on a call
        if (this.callSessionStore.isUserInCall(callerId)) {
            throw new ConflictError("You are already active on another call");
        }

        if (this.callSessionStore.isUserInCall(receiverId)) {
            throw new ConflictError("The user is currently busy on another call");
        }

        // 3. Premium Host check: A call is allowed only if the host in the conversation has an active, non-expired premium subscription, whether the host is the caller or the receiver.
        const [caller, receiver] = await Promise.all([
            this.userRepository.findById(callerId),
            this.userRepository.findById(receiverId),
        ]);

        if (!caller || !receiver) {
            throw new NotFoundError("User not found");
        }

        const callerIsHost = caller.role === "host";
        const receiverIsHost = receiver.role === "host";

        if (!callerIsHost && !receiverIsHost) {
            throw new ForbiddenError("Calls are available only for premium hosts");
        }

        let isPremium = false;
        let hostId: string | undefined;

        if (callerIsHost && (await this.subscriptionRepository.isHostPremium(caller.id))) {
            isPremium = true;
            hostId = caller.id;
        } else if (receiverIsHost && (await this.subscriptionRepository.isHostPremium(receiver.id))) {
            isPremium = true;
            hostId = receiver.id;
        }

        if (!isPremium) {
            throw new ForbiddenError("Calls are available only for premium hosts");
        }

        const callerName = `${caller.firstName || ""} ${caller.lastName || ""}`.trim() || caller.email;

        const callId = `call_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
        const session: CallSession = {
            callId,
            id: callId,
            callerId,
            callerName,
            receiverId,
            ...(hostId ? { hostId } : {}),
            callType,
            status: "ringing",
            startedAt: new Date(),
        };

        this.callSessionStore.createSession(session);
        return session;
    }
}
