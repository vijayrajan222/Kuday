import type { ISeekerPreferenceRepository } from "../../interfaces/repository/ISeekerPreferenceRepository.js";
import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { ILifestyleRepository } from "../../interfaces/repository/ILifestyleRepository.js";
import type { IRoomRepository } from "../../interfaces/repository/IRoomRepository.js";
import type { SeekerPreferenceWithUserDto, SeekerProfileDto } from "../../dto/seeker/GetSeekerResponseDto.js";
import type { IGetSeekerPreferencesUseCase } from "../../interfaces/use-case/seeker/IGetSeekerPreferencesUseCase.js";
import { MatchCalculatorService } from "../../../domain/services/MatchCalculatorService.js";

export class GetSeekerPreferencesUseCase implements IGetSeekerPreferencesUseCase {
    constructor(
        private seekerPreferenceRepository: ISeekerPreferenceRepository,
        private userRepository: IUserRepository,
        private lifestyleRepository: ILifestyleRepository,
        private roomRepository: IRoomRepository
    ) {}

    async execute(hostUserId?: string): Promise<SeekerPreferenceWithUserDto[]> {
        const allPreferences = await this.seekerPreferenceRepository.findAll();

        let hostRoom = null;
        let hostLifestyle = null;

        if (hostUserId) {
            try {
                const rooms = await this.roomRepository.findByHostId(hostUserId);
                hostRoom = rooms.length > 0 ? rooms[0] : null;
                hostLifestyle = await this.lifestyleRepository.findByUserId(hostUserId);
            } catch {
                // Ignore
            }
        }

        const enrichedSeekers: SeekerPreferenceWithUserDto[] = [];

        for (const pref of allPreferences) {
            const seekerUser = await this.userRepository.findById(pref.userId);

            // STRICT FILTER RULE: Only show seeker listings created by ADMIN-VERIFIED seekers who are currently in 'seeker' role
            if (!seekerUser || !seekerUser.identityVerified || seekerUser.role !== 'seeker') {
                continue;
            }

            const seekerLifestyle = await this.lifestyleRepository.findByUserId(pref.userId);

            let matchPercentage = 85;
            if (hostRoom) {
                matchPercentage = MatchCalculatorService.calculateRoomMatch(
                    hostRoom,
                    hostLifestyle,
                    { seekerPreference: pref, seekerLifestyle }
                );
            }

            const seekerProfile: SeekerProfileDto = {
                id: seekerUser.id,
                firstName: seekerUser.firstName,
                email: seekerUser.email,
                identityVerified: Boolean(seekerUser.identityVerified),
            };

            if (seekerUser.lastName) seekerProfile.lastName = seekerUser.lastName;
            if (seekerUser.gender) seekerProfile.gender = seekerUser.gender;
            if (seekerUser.occupation) seekerProfile.occupation = seekerUser.occupation;
            if (seekerUser.bio) seekerProfile.bio = seekerUser.bio;
            if (seekerUser.selfieUrl) seekerProfile.selfieUrl = seekerUser.selfieUrl;
            if (seekerUser.idCardUrl) seekerProfile.idCardUrl = seekerUser.idCardUrl;
            if (seekerUser.identityStatus) seekerProfile.identityStatus = seekerUser.identityStatus;
            if (seekerLifestyle) seekerProfile.lifestyle = seekerLifestyle;

            const seekerDto: SeekerPreferenceWithUserDto = {
                id: pref.id,
                userId: pref.userId,
                preferredLocation: pref.preferredLocation,
                maxBudget: pref.maxBudget,
                roomTypePreference: pref.roomTypePreference,
                requiredAmenities: pref.requiredAmenities,
                seeker: seekerProfile,
                matchPercentage,
            };

            if (pref.createdAt) seekerDto.createdAt = pref.createdAt;
            if (pref.updatedAt) seekerDto.updatedAt = pref.updatedAt;

            enrichedSeekers.push(seekerDto);
        }

        return enrichedSeekers.sort((a, b) => b.matchPercentage - a.matchPercentage);
    }
}
