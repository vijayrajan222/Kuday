import type { GetUnreadCountDto } from "@application/dto/chat/ChatDto";

export type { GetUnreadCountDto };

export interface IGetUnreadCountUseCase {
    execute(dto: GetUnreadCountDto): Promise<number>;
    execute(userId: string): Promise<number>;
    execute(dtoOrUserId: GetUnreadCountDto | string): Promise<number>;
}
