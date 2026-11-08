import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { ILifestyleRepository } from "@application/interfaces/repository/ILifestyleRepository";
import type { ISeekerPreferenceRepository } from "@application/interfaces/repository/ISeekerPreferenceRepository";
import type { RoomWithHostDto, HostProfileDto } from "@application/dto/room/GetRoomResponseDto";
import type { IGetRoomsUseCase } from "@application/interfaces/use-case/room/IGetRoomsUseCase";
import { MatchCalculatorService } from "@domain/services/MatchCalculatorService";

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

            // Host must exist and be currently in 'host' role
            if (!hostUser || hostUser.role !== 'host') {
                continue;
            }

            // Exclude the current user's own listing if they are viewing
            if (seekerUserId && room.hostId === seekerUserId) {
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

    async getById(id: string, seekerUserId?: string): Promise<RoomWithHostDto | null> {
        const room = await this.roomRepository.findById(id);
        if (!room) return null;

        const hostUser = await this.userRepository.findById(room.hostId);
        if (!hostUser) return null;

        const hostLifestyle = await this.lifestyleRepository.findByUserId(room.hostId);

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

        return roomDto;
    }
}
