import type { AgreementEntity } from "@domain/entities/AgreementEntity";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";

export async function enrichAgreement(
    agreement: AgreementEntity,
    userRepository: IUserRepository,
    roomRepository: IRoomRepository
): Promise<AgreementResponseDto> {
    const [host, seeker, room] = await Promise.all([
        userRepository.findById(agreement.hostId),
        userRepository.findById(agreement.seekerId),
        roomRepository.findById(agreement.roomId),
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
