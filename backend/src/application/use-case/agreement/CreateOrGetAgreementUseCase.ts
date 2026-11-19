import type { ICreateOrGetAgreementUseCase } from "@application/interfaces/use-case/agreement/ICreateOrGetAgreementUseCase";
import type { CreateAgreementRequestDto } from "@application/dto/agreement/CreateAgreementDto";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { IInterestRepository } from "@application/interfaces/repository/IInterestRepository";
import type { AgreementEntity } from "@domain/entities/AgreementEntity";
import { UnauthorizedError, ValidationError } from "@application/errors/AppError";

export class CreateOrGetAgreementUseCase implements ICreateOrGetAgreementUseCase {
    constructor(
        private readonly agreementRepository: IAgreementRepository,
        private readonly userRepository: IUserRepository,
        private readonly roomRepository: IRoomRepository,
        private readonly interestRepository: IInterestRepository
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
        let { hostId, seekerId, roomId } = dto;

        // 1. Authorization check: caller must be host or seeker
        if (callerUserId !== hostId && callerUserId !== seekerId) {
            throw new UnauthorizedError("You are not authorized to create or access an agreement for this match.");
        }

        // Auto-resolve roomId if not provided or empty
        if (!roomId) {
            const hostRooms = await this.roomRepository.findByHostId(hostId);
            if (hostRooms.length > 0 && hostRooms[0]) {
                roomId = hostRooms[0].id;
            } else {
                const seekerRooms = await this.roomRepository.findByHostId(seekerId);
                if (seekerRooms.length > 0 && seekerRooms[0]) {
                    roomId = seekerRooms[0].id;
                    // Invert host and seeker
                    const temp = hostId;
                    hostId = seekerId;
                    seekerId = temp;
                }
            }
        }

        // If roomId is provided, verify whether room.hostId matches hostId; normalize if inverted
        let room = roomId ? await this.roomRepository.findById(roomId) : null;
        if (room && room.hostId) {
            if (hostId !== room.hostId && seekerId === room.hostId) {
                hostId = room.hostId;
                seekerId = dto.hostId;
            }
        }

        // 2. Return existing active agreement if found
        let existing = roomId ? await this.agreementRepository.findActive(hostId, seekerId, roomId) : null;
        if (!existing) {
            const userAgreements = await this.agreementRepository.findByUser(seekerId);
            existing = userAgreements.find((a) => a.hostId === hostId && a.status !== "cancelled" && a.status !== "ended") || null;
        }
        if (existing) {
            return this.enrich(existing);
        }

        // 2b. Prevent creating agreement if seeker already has a completed active agreement
        const userAgreements = await this.agreementRepository.findByUser(seekerId);
        const hasCompletedAgreement = userAgreements.some(
            (a) => a.status === "completed" && a.seekerId === seekerId
        );
        if (hasCompletedAgreement) {
            throw new ValidationError("This seeker already has an active finalized rental agreement.");
        }

        // 3. Match Enforcement only (no visit completion required)
        const matched = await this.interestRepository.findAcceptedBetween(hostId, seekerId);
        if (!matched || matched.status !== "accepted") {
            throw new ValidationError("An active match connection between host and seeker is required to proceed with an agreement.");
        }

        // 4. Fetch room to prefill terms (if not already fetched)
        if (!room && roomId) {
            room = await this.roomRepository.findById(roomId);
        }
        if (!room) {
            throw new ValidationError("Could not locate a room listing for this match. Please ensure a room is listed.");
        }
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
            editLock: {
                userId: null,
                expiresAt: null,
            },
            revision: 1,
            pendingWith: null,
            lastSubmittedBy: null,
            acceptedBy: [],
            acceptanceTimestamps: {
                host: null,
                seeker: null,
            },
            payment: {
                required: false,
                amount: 0,
                status: "pending",
            },
            version: 1,
        });

        return this.enrich(created);
    }
}
