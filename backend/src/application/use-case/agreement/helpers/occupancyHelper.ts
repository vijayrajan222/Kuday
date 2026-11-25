import type { IRoomRepository } from "@application/interfaces/repository/IRoomRepository";
import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IInterestRepository } from "@application/interfaces/repository/IInterestRepository";
import type { ISeekerPreferenceRepository } from "@application/interfaces/repository/ISeekerPreferenceRepository";
import type { ISocketNotificationService } from "@application/interfaces/services/ISocketNotificationService";
import type { RoomEntity } from "@domain/entities/RoomEntity";
import type { AgreementEntity } from "@domain/entities/AgreementEntity";
import { NotFoundError, ValidationError } from "@application/errors/AppError";

/**
 * Deducts room vacancy when an agreement is completed/finalized.
 * Decrements availableSlots with an atomic findOneAndUpdate query.
 * Does not set isActive to false (listed = isActive && availableSlots > 0).
 * Throws ValidationError if roomId is missing or no slots remain.
 */
export async function deductRoomVacancy(
  roomRepository: IRoomRepository,
  roomId?: string,
  socketService?: ISocketNotificationService
): Promise<RoomEntity> {
  if (!roomId) {
    throw new ValidationError("Room ID is required to finalize agreement.");
  }

  const updatedRoom = await roomRepository.decrementAvailableSlots(roomId);
  if (!updatedRoom) {
    throw new ValidationError("No available slots remaining for this room.");
  }

  if (socketService && updatedRoom.hostId) {
    socketService.notifyUser(updatedRoom.hostId, "room_updated", {
      id: updatedRoom.id,
      availableSlots: updatedRoom.availableSlots,
      isActive: updatedRoom.isActive,
    });
  }

  return updatedRoom;
}

export function calculateAgreementDates(commonTerms?: { moveInDate?: string; durationMonths?: number }): {
  startDate: string;
  endDate?: string | undefined;
} {
  const startDate = commonTerms?.moveInDate || new Date().toISOString();
  let endDate: string | undefined = undefined;
  try {
    const d = new Date(startDate);
    if (!isNaN(d.getTime())) {
      d.setMonth(d.getMonth() + (commonTerms?.durationMonths || 11));
      endDate = d.toISOString();
    }
  } catch {
    // ignore parsing failure
  }
  return { startDate, endDate };
}

export interface AgreementActivationDeps {
  agreementRepository: IAgreementRepository;
  roomRepository: IRoomRepository;
  userRepository: IUserRepository;
  interestRepository?: IInterestRepository | undefined;
  seekerPreferenceRepository?: ISeekerPreferenceRepository | undefined;
  socketService?: ISocketNotificationService | undefined;
}

/**
 * Idempotent Agreement Activation.
 * Runs activation strictly on the FIRST transition to 'completed':
 * - Step 1: Reserves the slot FIRST (atomic decrement). If availableSlots was 0, fails immediately and agreement is NOT completed.
 * - Step 2: Attempts atomic markCompletedAtomic. If it fails because another request already completed it, gives the slot back (increment, never above capacity).
 * - Step 3: If both succeed:
 *   - Sets seeker role to "none" and deactivates seeker preference until the agreement ends.
 *   - If room's availableSlots reached 0: sets room isActive to false and host role to "none".
 *   - If room still has available slots (> 0): ensures room isActive remains true and host role remains "host".
 *   - Closes seeker's other pending interests/matches, and marks full room interests as "room filled".
 */
export async function activateAgreement(
  deps: AgreementActivationDeps,
  agreementId: string,
  updates: Partial<AgreementEntity>
): Promise<{ agreement: AgreementEntity; alreadyActivated: boolean; slotReserved: boolean; inactive?: boolean }> {
  const {
    agreementRepository,
    roomRepository,
    userRepository,
    interestRepository,
    seekerPreferenceRepository,
    socketService,
  } = deps;

  const current = await agreementRepository.findById(agreementId);
  if (!current) {
    throw new NotFoundError("Agreement not found.");
  }

  // If already cancelled or ended, ignore immediately WITHOUT touching room slots
  if (current.status === "cancelled" || current.status === "ended") {
    return { agreement: current, alreadyActivated: false, slotReserved: false, inactive: true };
  }

  // Idempotency: If already completed or activated, return immediately without re-deducting
  if (current.status === "completed" || current.activatedAt) {
    return { agreement: current, alreadyActivated: true, slotReserved: true };
  }

  // STEP 1: Reserve the slot FIRST (atomic decrement)
  const updatedRoom = await roomRepository.decrementAvailableSlots(current.roomId);
  if (!updatedRoom) {
    // Slot decrement failed: room is full / no slots left.
    // The agreement must NOT end up 'completed'.
    return { agreement: current, alreadyActivated: false, slotReserved: false };
  }

  // STEP 2: Attempt atomic markCompletedAtomic
  const dates = calculateAgreementDates(current.commonTerms);
  const updated = await agreementRepository.markCompletedAtomic(agreementId, {
    ...updates,
    startDate: dates.startDate,
    endDate: dates.endDate,
    lockedAt: new Date().toISOString(),
  });

  if (!updated) {
    // Another concurrent call (e.g. webhook vs verify on the same agreement) already completed it.
    // Give the slot back (never above capacity):
    await roomRepository.incrementAvailableSlots(current.roomId);
    const existing = await agreementRepository.findById(agreementId);
    return { agreement: existing || current, alreadyActivated: true, slotReserved: true };
  }

  // STEP 3: WON BOTH THE SLOT AND THE ATOMIC TRANSITION: Run side-effects

  // 1. Set seeker's role to "none" and deactivate seeker preferences until agreement ends
  await userRepository.updateProfile(current.seekerId, { role: "none" });
  if (seekerPreferenceRepository) {
    await seekerPreferenceRepository.updateStatusByUserId(current.seekerId, false);
  }

  // 2. Room vacancy and Host role management:
  // - If availableSlots reached 0: disable room listing (isActive: false) and set host's role to "none"
  // - If availableSlots > 0: keep room listing active (isActive: true) and ensure host keeps "host" role
  if (updatedRoom.availableSlots <= 0) {
    await roomRepository.update(updatedRoom.id, { isActive: false });
    await userRepository.updateProfile(current.hostId, { role: "none" });
  } else {
    await roomRepository.update(updatedRoom.id, { isActive: true });
    const hostUser = await userRepository.findById(current.hostId);
    if (hostUser && hostUser.role !== "host") {
      await userRepository.updateProfile(current.hostId, { role: "host" });
    }
  }

  // 3. Close seeker's other pending interests and conversations/matches
  if (interestRepository) {
    await interestRepository.closeOtherSeekerInterests(current.seekerId, current.hostId);

    // 4. If room's availableSlots reached 0, mark remaining pending seekers' interests as "room filled"
    if (updatedRoom.availableSlots <= 0) {
      await interestRepository.markPendingRoomInterestsFilled(current.roomId);
    }
  }

  // 5. Notify host via socket
  if (socketService && updatedRoom.hostId) {
    socketService.notifyUser(updatedRoom.hostId, "room_updated", {
      id: updatedRoom.id,
      availableSlots: updatedRoom.availableSlots,
      isActive: updatedRoom.availableSlots > 0,
    });
  }

  return { agreement: updated, alreadyActivated: false, slotReserved: true };
}
