import type { CallSession } from "@application/interfaces/services/ICallSessionStore";
import type { StartCallDto, StartCallInput } from "@application/dto/call/CallDto";

export type { StartCallInput, StartCallDto };

export interface IStartCallUseCase {
    execute(input: StartCallDto): Promise<CallSession>;
}
