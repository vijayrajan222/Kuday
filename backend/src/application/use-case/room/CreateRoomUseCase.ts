import type { ICreateRoomUseCase } from "@application/interfaces/use-case/room/ICreateRoomUseCase";
import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { ICloudinaryService } from "@application/interfaces/services/ICloudinaryService";
import type { CreateRoomDto } from "@application/dto/room/CreateRoomDto";
import type { RoomEntity } from "@domain/entities/RoomEntity";

export class CreateRoomUseCase implements ICreateRoomUseCase {
    constructor(
        private roomRepository: IRoomRepository,
        private userRepository: IUserRepository,
        private cloudinaryService: ICloudinaryService
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
            const oldCapacity = Number(existingRoom.capacity) || 1;
            const oldAvailableSlots =
                existingRoom.availableSlots !== undefined
                    ? Number(existingRoom.availableSlots)
                    : oldCapacity;
            const occupiedSlots = Math.max(0, oldCapacity - oldAvailableSlots);

            let newCapacity = oldCapacity;
            let newAvailableSlots = oldAvailableSlots;

            if (roomDetails.capacity !== undefined) {
                newCapacity = Number(roomDetails.capacity);
                // Reject capacity lower than currently occupied slots (capacity - availableSlots)
                if (newCapacity < occupiedSlots) {
                    throw new Error(
                        `Capacity cannot be lower than the currently occupied slots (${occupiedSlots}).`
                    );
                }
                const delta = newCapacity - oldCapacity;
                newAvailableSlots = Math.max(0, Math.min(newCapacity, oldAvailableSlots + delta));
            } else if (roomDetails.availableSlots !== undefined) {
                newAvailableSlots = Number(roomDetails.availableSlots);
            }

            const isNowActive = newAvailableSlots > 0;

            // When availableSlots goes above 0 for a host with role "none", re-activate their host role so they get listed again
            if (newAvailableSlots > 0) {
                const hostUser = await this.userRepository.findById(hostId);
                if (hostUser && hostUser.role === "none") {
                    await this.userRepository.updateProfile(hostId, { role: "host" });
                }
            }

            const updatedRoom = await this.roomRepository.update(existingRoom.id, {
                ...roomDetails,
                capacity: newCapacity,
                availableSlots: newAvailableSlots,
                isActive: isNowActive,
                images: finalImages,
            });
            if (updatedRoom) return updatedRoom;
        }

        const newCapacity = Number(roomDetails.capacity) || 1;
        const newAvailableSlots = Number(roomDetails.availableSlots ?? roomDetails.capacity ?? 1);
        const newRoom = await this.roomRepository.create({
            hostId,
            ...roomDetails,
            capacity: newCapacity,
            availableSlots: newAvailableSlots,
            isActive: newAvailableSlots > 0,
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
