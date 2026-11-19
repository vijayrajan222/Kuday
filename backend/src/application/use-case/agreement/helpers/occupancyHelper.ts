import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";

/**
 * Deducts room vacancy when an agreement is completed/finalized.
 * If capacity drops to 0, sets isActive to false (moves from active to occupied).
 */
export async function deductRoomVacancy(
  roomRepository: IRoomRepository,
  roomId?: string,
  socketService?: ISocketNotificationService
): Promise<void> {
  if (!roomId) return;
  try {
    const room = await roomRepository.findById(roomId);
    if (!room) return;

    const currentCap = typeof room.capacity === "number" ? room.capacity : 1;
    const newCapacity = Math.max(0, currentCap - 1);
    const isActive = newCapacity > 0;

    await roomRepository.update(room.id, {
      capacity: newCapacity,
      isActive,
    });

    if (socketService && room.hostId) {
      socketService.notifyUser(room.hostId, "room_updated", {
        id: room.id,
        capacity: newCapacity,
        isActive,
      });
    }
  } catch {
    // Non-blocking error handling
  }
}
