import type { MessageEntity } from "@domain/entities/MessageEntity";
import type { LogCallDto, LogCallInput } from "@application/dto/call/CallDto";

export type { LogCallInput, LogCallDto };

export interface ILogCallUseCase {
    execute(input: LogCallDto): Promise<MessageEntity>;
}
