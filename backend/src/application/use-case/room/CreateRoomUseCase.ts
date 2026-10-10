import type { ICreateRoomUseCase } from "../../interfaces/use-case/room/ICreateRoomUseCase.js";
import type { IRoomRepository } from "../../interfaces/repository/IRoomRepository.js";
import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { CloudinaryService } from "../../../infrastructure/services/CloudinaryService.js";
import type { CreateRoomDto } from "../../dto/room/CreateRoomDto.js";
import type { RoomEntity } from "../../../domain/entities/RoomEntity.js";

export class CreateRoomUseCase implements ICreateRoomUseCase {
    constructor(
        private roomRepository: IRoomRepository,
        private userRepository: IUserRepository,
        private cloudinaryService: CloudinaryService
    ) {}

    async execute(dto: CreateRoomDto): Promise<RoomEntity> {
        const { hostId, imagesBase64, images: providedImages, ...roomDetails } = dto;

        if (!roomDetails.location || roomDetails.location.trim().length < 2) {
            throw new Error("Location must be at least 2 characters");
        }
        if (!roomDetails.monthlyRent || Number(roomDetails.monthlyRent) <= 0) {
            throw new Error("Monthly rent must be a positive number greater than 0");
        }
        if (roomDetails.capacity !== undefined && (Number(roomDetails.capacity) <= 0 || Number(roomDetails.capacity) > 50)) {
            throw new Error("Capacity must be between 1 and 50");
        }

        let finalImages: string[] = providedImages || [];

        if (imagesBase64 && imagesBase64.length > 0) {
            const uploadedUrls = await Promise.all(
                imagesBase64.map((imgBase64) =>
                    this.cloudinaryService.uploadImage(imgBase64, "kuday_rooms")
                )
            );
            finalImages = [...finalImages, ...uploadedUrls];
        }

        const existingRooms = await this.roomRepository.findByHostId(hostId);
        const existingRoom = existingRooms[0];
        if (existingRoom) {
            const updatedRoom = await this.roomRepository.update(existingRoom.id, {
                ...roomDetails,
                images: finalImages,
            });
            if (updatedRoom) return updatedRoom;
        }

        const newRoom = await this.roomRepository.create({
            hostId,
            ...roomDetails,
            images: finalImages,
        });

        // Mark user as onboarded with host role
        await this.userRepository.updateProfile(hostId, {
            isOnboarded: true,
            role: "host",
        });

        return newRoom;
    }
}
