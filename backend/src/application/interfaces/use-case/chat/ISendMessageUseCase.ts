import type { SendMessageDto, SendMessageResponseDto } from "@application/dto/chat/ChatDto";

export interface ISendMessageUseCase {
    execute(dto: SendMessageDto): Promise<SendMessageResponseDto>;
}
