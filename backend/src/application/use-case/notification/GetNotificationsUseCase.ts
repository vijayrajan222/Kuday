import type { INotificationRepository } from "@application/interfaces/repository/INotificationRepository";
import type { IGetNotificationsUseCase } from "@application/interfaces/use-case/notification/IGetNotificationsUseCase";
import type { GetNotificationsDto, GetNotificationsOutputDto } from "@application/dto/notification/CreateNotificationDto";

export class GetNotificationsUseCase implements IGetNotificationsUseCase {
    constructor(private notificationRepository: INotificationRepository) {}

    async execute(dtoOrUserId: GetNotificationsDto | string): Promise<GetNotificationsOutputDto> {
        const userId = typeof dtoOrUserId === "object" ? dtoOrUserId.userId : dtoOrUserId;
        return this.notificationRepository.findByUserId(userId);
    }
}
