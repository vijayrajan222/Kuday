import type { CallSession } from "@application/interfaces/services/ICallSessionStore";

export interface StartCallInput {
    callerId: string;
    receiverId: string;
    callType: "audio" | "video";
}

export interface IStartCallUseCase {
    execute(input: StartCallInput): Promise<CallSession>;
}
