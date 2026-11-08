export interface IMarkMessagesAsReadUseCase {
    execute(conversationId: string, userId: string): Promise<void>;
}
