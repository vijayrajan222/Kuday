import type { IRoomRepository } from "../../interfaces/repository/IRoomRepository.js";
import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { ILifestyleRepository } from "../../interfaces/repository/ILifestyleRepository.js";
import type { ISeekerPreferenceRepository } from "../../interfaces/repository/ISeekerPreferenceRepository.js";
import type { RoomWithHostDto, HostProfileDto } from "../../dto/room/GetRoomResponseDto.js";
import type { IGetRoomsUseCase } from "../../interfaces/use-case/room/IGetRoomsUseCase.js";
import { MatchCalculatorService } from "../../../domain/services/MatchCalculatorService.js";

export class GetRoomsUseCase implements IGetRoomsUseCase {
    constructor(
        private roomRepository: IRoomRepository,
        private userRepository: IUserRepository,
        private lifestyleRepository: ILifestyleRepository,
        private seekerPreferenceRepository: ISeekerPreferenceRepository
    ) {}

    async execute(seekerUserId?: string): Promise<RoomWithHostDto[]> {
        const allRooms = await this.roomRepository.findAll();
        const activeRooms = allRooms.filter((r) => r.isActive !== false);

        let seekerPreference = null;
        let seekerLifestyle = null;

        if (seekerUserId) {
            try {
                seekerPreference = await this.seekerPreferenceRepository.findByUserId(seekerUserId);
                seekerLifestyle = await this.lifestyleRepository.findByUserId(seekerUserId);
            } catch {
                // Ignore
            }
        }

        const enrichedRooms: RoomWithHostDto[] = [];

        for (const room of activeRooms) {
            const hostUser = await this.userRepository.findById(room.hostId);

            // STRICT FILTER RULE: Only show room listings created by ADMIN-VERIFIED hosts who are currently in 'host' role
            if (!hostUser || !hostUser.identityVerified || hostUser.role !== 'host') {
                continue;
            }

            const hostLifestyle = await this.lifestyleRepository.findByUserId(room.hostId);

            const matchPercentage = MatchCalculatorService.calculateRoomMatch(
                room,
                hostLifestyle,
                { seekerPreference, seekerLifestyle }
            );

            const hostProfile: HostProfileDto = {
                id: hostUser.id,
                firstName: hostUser.firstName,
                email: hostUser.email,
                identityVerified: Boolean(hostUser.identityVerified),
            };

            if (hostUser.lastName) hostProfile.lastName = hostUser.lastName;
            if (hostUser.gender) hostProfile.gender = hostUser.gender;
            if (hostUser.occupation) hostProfile.occupation = hostUser.occupation;
            if (hostUser.bio) hostProfile.bio = hostUser.bio;
            if (hostUser.selfieUrl) hostProfile.selfieUrl = hostUser.selfieUrl;
            if (hostUser.idCardUrl) hostProfile.idCardUrl = hostUser.idCardUrl;
            if (hostUser.identityStatus) hostProfile.identityStatus = hostUser.identityStatus;
            if (hostLifestyle) hostProfile.lifestyle = hostLifestyle;

            const roomDto: RoomWithHostDto = {
                id: room.id,
                hostId: room.hostId,
                roomType: room.roomType,
                monthlyRent: room.monthlyRent,
                location: room.location,
                capacity: room.capacity,
                availabilityNotes: room.availabilityNotes,
                amenities: room.amenities,
                images: room.images,
                host: hostProfile,
                matchPercentage,
            };

            if (room.title) roomDto.title = room.title;
            if (room.description) roomDto.description = room.description;
            if (room.isActive !== undefined) roomDto.isActive = room.isActive;
            if (room.createdAt) roomDto.createdAt = room.createdAt;
            if (room.updatedAt) roomDto.updatedAt = room.updatedAt;

            enrichedRooms.push(roomDto);
        }

        return enrichedRooms.sort((a, b) => b.matchPercentage - a.matchPercentage);
    }

    async getByHostId(hostId: string): Promise<RoomWithHostDto[]> {
        const hostUser = await this.userRepository.findById(hostId);
        if (!hostUser) return [];

        const hostRooms = await this.roomRepository.findByHostId(hostId);
        const hostLifestyle = await this.lifestyleRepository.findByUserId(hostId);

        const hostProfile: HostProfileDto = {
            id: hostUser.id,
            firstName: hostUser.firstName,
            email: hostUser.email,
            identityVerified: Boolean(hostUser.identityVerified),
        };

        if (hostUser.lastName) hostProfile.lastName = hostUser.lastName;
        if (hostUser.gender) hostProfile.gender = hostUser.gender;
        if (hostUser.occupation) hostProfile.occupation = hostUser.occupation;
        if (hostUser.bio) hostProfile.bio = hostUser.bio;
        if (hostUser.selfieUrl) hostProfile.selfieUrl = hostUser.selfieUrl;
        if (hostUser.idCardUrl) hostProfile.idCardUrl = hostUser.idCardUrl;
        if (hostUser.identityStatus) hostProfile.identityStatus = hostUser.identityStatus;
        if (hostLifestyle) hostProfile.lifestyle = hostLifestyle;

        return hostRooms.map((room) => {
            const roomDto: RoomWithHostDto = {
                id: room.id,
                hostId: room.hostId,
                roomType: room.roomType,
                monthlyRent: room.monthlyRent,
                location: room.location,
                capacity: room.capacity,
                availabilityNotes: room.availabilityNotes,
                amenities: room.amenities,
                images: room.images,
                host: hostProfile,
                matchPercentage: 100,
            };

            if (room.title) roomDto.title = room.title;
            if (room.description) roomDto.description = room.description;
            if (room.isActive !== undefined) roomDto.isActive = room.isActive;
            if (room.createdAt) roomDto.createdAt = room.createdAt;
            if (room.updatedAt) roomDto.updatedAt = room.updatedAt;

            return roomDto;
        });
    }
}
