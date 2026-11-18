import type { IGetAgreementUseCase } from "@application/interfaces/use-case/agreement/IGetAgreementUseCase";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import { NotFoundError, UnauthorizedError } from "@application/errors/AppError";

export class GetAgreementUseCase implements IGetAgreementUseCase {
    constructor(
        private readonly agreementRepository: IAgreementRepository,
        private readonly userRepository: IUserRepository,
        private readonly roomRepository: IRoomRepository
    ) {}

    async execute(agreementId: string, callerUserId: string): Promise<AgreementResponseDto> {
        const agreement = await this.agreementRepository.findById(agreementId);
        if (!agreement) {
            throw new NotFoundError("Rental agreement not found.");
        }

        if (agreement.hostId !== callerUserId && agreement.seekerId !== callerUserId) {
            throw new UnauthorizedError("You are not authorized to view this agreement.");
        }

        const [host, seeker, room] = await Promise.all([
            this.userRepository.findById(agreement.hostId),
            this.userRepository.findById(agreement.seekerId),
            this.roomRepository.findById(agreement.roomId),
        ]);

        return {
            ...agreement,
            host: host
                ? {
                      id: host.id,
                      firstName: host.firstName,
                      lastName: host.lastName,
                      email: host.email,
                      role: host.role || "host",
                      selfieUrl: host.selfieUrl,
                      isPremium: host.isPremium,
                  }
                : undefined,
            seeker: seeker
                ? {
                      id: seeker.id,
                      firstName: seeker.firstName,
                      lastName: seeker.lastName,
                      email: seeker.email,
                      role: seeker.role || "seeker",
                      selfieUrl: seeker.selfieUrl,
                      isPremium: seeker.isPremium,
                  }
                : undefined,
            room: room
                ? {
                      id: room.id,
                      title: room.title,
                      roomType: room.roomType,
                      monthlyRent: room.monthlyRent,
                      location: room.location,
                      images: room.images || [],
                  }
                : undefined,
        };
    }
}
