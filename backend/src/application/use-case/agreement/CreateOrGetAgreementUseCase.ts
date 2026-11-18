import type { ICreateOrGetAgreementUseCase } from "@application/interfaces/use-case/agreement/ICreateOrGetAgreementUseCase";
import type { CreateAgreementRequestDto } from "@application/dto/agreement/CreateAgreementDto";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { ICheckAgreementUnlockUseCase } from "@application/interfaces/use-case/agreement/ICheckAgreementUnlockUseCase";
import type { AgreementEntity } from "@domain/entities/AgreementEntity";
import { UnauthorizedError, ValidationError } from "@application/errors/AppError";

export class CreateOrGetAgreementUseCase implements ICreateOrGetAgreementUseCase {
    constructor(
        private readonly agreementRepository: IAgreementRepository,
        private readonly userRepository: IUserRepository,
        private readonly roomRepository: IRoomRepository,
        private readonly checkUnlockUseCase: ICheckAgreementUnlockUseCase
    ) {}

    private async enrich(agreement: AgreementEntity): Promise<AgreementResponseDto> {
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

    async execute(dto: CreateAgreementRequestDto, callerUserId: string): Promise<AgreementResponseDto> {
        const { hostId, seekerId, roomId } = dto;

        // 1. Authorization check: caller must be host or seeker
        if (callerUserId !== hostId && callerUserId !== seekerId) {
            throw new UnauthorizedError("You are not authorized to create or access an agreement for this match.");
        }

        // 2. Return existing active agreement if found
        const existing = await this.agreementRepository.findActive(hostId, seekerId, roomId);
        if (existing) {
            return this.enrich(existing);
        }

        // 3. Strict unlock enforcement on backend
        const unlockStatus = await this.checkUnlockUseCase.execute(hostId, seekerId, roomId);
        if (!unlockStatus.unlocked) {
            throw new ValidationError(
                unlockStatus.reason ||
                    "Agreement creation is locked. A completed in-person visit or video call is required before creating an agreement."
            );
        }

        // 4. Fetch room to prefill terms
        const room = await this.roomRepository.findById(roomId);
        const monthlyRent = room?.monthlyRent || 10000;
        const deposit = monthlyRent * 2;

        const moveInDateObj = new Date();
        moveInDateObj.setDate(moveInDateObj.getDate() + 7);
        const moveInDate = moveInDateObj.toISOString().slice(0, 10);

        // 5. Default standardized obligations
        const hostObligations = [
            "Maintain the premises in a clean, habitable, and structurally sound condition throughout tenancy.",
            "Respect tenant privacy and provide at least 24 hours prior written notice before entering rented room, except in emergencies.",
            "Refund the full security deposit within 15 days of move-out, minus legitimate itemized deductions for damages beyond normal wear and tear.",
            "Ensure basic utility infrastructure (water, electrical supply, fittings) is fully functional upon move-in.",
        ];

        const seekerObligations = [
            "Pay the agreed monthly rent on or before the agreed payment due date each month without unauthorized delay.",
            "Adhere strictly to agreed house rules, quiet hours (10:00 PM - 7:00 AM), and guest policies.",
            "Take reasonable care of the room and furnishings, and bear financial responsibility for accidental or negligent damage.",
            "Provide the required written notice period prior to vacating, and return all keys and access devices in good order.",
        ];

        // 6. Create shared agreement document
        const created = await this.agreementRepository.create({
            hostId,
            seekerId,
            roomId,
            status: "draft",
            commonTerms: {
                rent: monthlyRent,
                deposit,
                moveInDate,
                durationMonths: 11,
                noticePeriodDays: 30,
                paymentDueDay: 5,
                utilities: "Electricity, water, and shared broadband bills split equally among occupants.",
            },
            hostObligations,
            seekerObligations,
            customClauses: [],
            payment: {
                required: false,
                amount: 0,
                status: "pending",
            },
            signatures: {},
            version: 1,
        });

        return this.enrich(created);
    }
}
