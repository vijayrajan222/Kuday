import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { ILifestyleRepository } from "@application/interfaces/repository/ILifestyleRepository";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { ISeekerPreferenceRepository } from "@application/interfaces/repository/ISeekerPreferenceRepository";
import type { IGetUserPublicProfileUseCase, UserPublicProfileDto } from "@application/interfaces/use-case/user/IGetUserPublicProfileUseCase";
import { MatchCalculatorService } from "@domain/services/MatchCalculatorService";

export class GetUserPublicProfileUseCase implements IGetUserPublicProfileUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly lifestyleRepository: ILifestyleRepository,
        private readonly roomRepository: IRoomRepository,
        private readonly seekerPreferenceRepository: ISeekerPreferenceRepository
    ) {}

    async execute(userId: string, viewerId?: string): Promise<UserPublicProfileDto | null> {
        const user = await this.userRepository.findById(userId);
        if (!user) return null;

        const lifestyle = await this.lifestyleRepository.findByUserId(userId);
        let room = null;
        let seekerPreference = null;
        let matchPercentage = 88;

        if (user.role === 'host') {
            const rooms = await this.roomRepository.findByHostId(userId);
            room = rooms.length > 0 ? rooms[0] : null;

            if (viewerId && room) {
                try {
                    const viewerPref = await this.seekerPreferenceRepository.findByUserId(viewerId);
                    const viewerLifestyle = await this.lifestyleRepository.findByUserId(viewerId);
                    matchPercentage = MatchCalculatorService.calculateRoomMatch(
                        room,
                        lifestyle,
                        { seekerPreference: viewerPref, seekerLifestyle: viewerLifestyle }
                    );
                } catch {
                    // Ignore match calculation fallback
                }
            }
        } else if (user.role === 'seeker') {
            seekerPreference = await this.seekerPreferenceRepository.findByUserId(userId);

            if (viewerId && seekerPreference) {
                try {
                    const hostRooms = await this.roomRepository.findByHostId(viewerId);
                    const hostRoom = hostRooms.length > 0 ? hostRooms[0] : null;
                    const hostLifestyle = await this.lifestyleRepository.findByUserId(viewerId);

                    if (hostRoom) {
                        matchPercentage = MatchCalculatorService.calculateRoomMatch(
                            hostRoom,
                            hostLifestyle,
                            { seekerPreference, seekerLifestyle: lifestyle }
                        );
                    }
                } catch {
                    // Ignore match calculation fallback
                }
            }
        }

        const userDto: UserPublicProfileDto['user'] = {
            id: user.id,
            firstName: user.firstName,
            email: user.email,
            identityVerified: Boolean(user.identityVerified),
        };

        if (user.lastName) userDto.lastName = user.lastName;
        if (user.dob) userDto.dob = user.dob;
        if (user.gender) userDto.gender = user.gender;
        if (user.occupation) userDto.occupation = user.occupation;
        if (user.bio) userDto.bio = user.bio;
        if (user.role) userDto.role = user.role;
        if (user.selfieUrl) userDto.selfieUrl = user.selfieUrl;
        if (user.idCardUrl) userDto.idCardUrl = user.idCardUrl;
        if (user.identityStatus) userDto.identityStatus = user.identityStatus;

        const roomDto = room ? {
            id: room.id,
            title: room.title,
            description: room.description,
            roomType: room.roomType,
            monthlyRent: room.monthlyRent,
            location: room.location,
            capacity: room.capacity,
            availabilityNotes: room.availabilityNotes,
            amenities: room.amenities,
            images: room.images,
        } : null;

        const seekerPrefDto = seekerPreference ? {
            id: seekerPreference.id,
            preferredLocation: seekerPreference.preferredLocation,
            maxBudget: seekerPreference.maxBudget,
            roomTypePreference: seekerPreference.roomTypePreference,
            requiredAmenities: seekerPreference.requiredAmenities,
        } : null;

        return {
            user: userDto,
            lifestyle: lifestyle ? {
                smoking: lifestyle.smoking,
                drinking: lifestyle.drinking,
                sleepSchedule: lifestyle.sleepSchedule,
                diet: lifestyle.diet,
                cleanliness: lifestyle.cleanliness,
                visitorPolicy: lifestyle.visitorPolicy,
                roommateGenderPref: lifestyle.roommateGenderPref,
            } : null,
            room: roomDto,
            seekerPreference: seekerPrefDto,
            matchPercentage,
        };
    }
}
