import type { RoomEntity } from "../entities/RoomEntity.js";
import type { SeekerPreferenceEntity } from "../entities/SeekerPreferenceEntity.js";
import type { LifestyleEntity } from "../entities/LifestyleEntity.js";

export interface SeekerContext {
    seekerPreference?: SeekerPreferenceEntity | null;
    seekerLifestyle?: LifestyleEntity | null;
}

export class MatchCalculatorService {
    /**
     * Calculates combined compatibility score (0-100%) between a Seeker and a Room listing + Host Lifestyle
     */
    static calculateRoomMatch(
        room: RoomEntity,
        hostLifestyle?: LifestyleEntity | null,
        context?: SeekerContext | null
    ): number {
        if (!context || (!context.seekerPreference && !context.seekerLifestyle)) {
            return 85; // Baseline high match score for active verified rooms
        }

        let roomScore = 0; // max 50 points
        let lifestyleScore = 0; // max 50 points

        const pref = context.seekerPreference;

        // 1. Room Requirements Match (Max 50 Points)
        if (pref) {
            // Location match (15 points)
            if (pref.preferredLocation && room.location) {
                const roomLoc = room.location.toLowerCase();
                const prefLoc = pref.preferredLocation.toLowerCase();
                if (roomLoc.includes(prefLoc) || prefLoc.includes(roomLoc)) {
                    roomScore += 15;
                } else {
                    roomScore += 7; // Regional match
                }
            } else {
                roomScore += 10;
            }

            // Budget match (15 points)
            if (pref.maxBudget && room.monthlyRent) {
                if (room.monthlyRent <= pref.maxBudget) {
                    roomScore += 15;
                } else {
                    const diff = room.monthlyRent - pref.maxBudget;
                    const diffPercent = diff / pref.maxBudget;
                    if (diffPercent <= 0.15) roomScore += 10;
                    else if (diffPercent <= 0.3) roomScore += 5;
                }
            } else {
                roomScore += 10;
            }

            // Room Type match (10 points)
            if (pref.roomTypePreference && room.roomType) {
                if (
                    pref.roomTypePreference.toLowerCase() === room.roomType.toLowerCase() ||
                    pref.roomTypePreference === "any"
                ) {
                    roomScore += 10;
                } else {
                    roomScore += 4;
                }
            } else {
                roomScore += 8;
            }

            // Amenities match (10 points)
            if (pref.requiredAmenities && pref.requiredAmenities.length > 0 && room.amenities) {
                const required = pref.requiredAmenities;
                const matchedCount = required.filter((a) =>
                    room.amenities.some((ra) => ra.toLowerCase() === a.toLowerCase())
                ).length;

                const ratio = matchedCount / required.length;
                roomScore += Math.round(ratio * 10);
            } else {
                roomScore += 8;
            }
        } else {
            roomScore = 40;
        }

        // 2. Lifestyle Compatibility (Max 50 Points)
        const seekerLf = context.seekerLifestyle;
        if (seekerLf && hostLifestyle) {
            // Cleanliness (10 points)
            if (seekerLf.cleanliness === hostLifestyle.cleanliness) lifestyleScore += 10;
            else lifestyleScore += 5;

            // Smoking (10 points)
            if (seekerLf.smoking === hostLifestyle.smoking) lifestyleScore += 10;
            else if (seekerLf.smoking === "never" && hostLifestyle.smoking === "never") lifestyleScore += 10;
            else lifestyleScore += 4;

            // Drinking (10 points)
            if (seekerLf.drinking === hostLifestyle.drinking) lifestyleScore += 10;
            else lifestyleScore += 5;

            // Sleep Schedule (10 points)
            if (seekerLf.sleepSchedule === hostLifestyle.sleepSchedule || seekerLf.sleepSchedule === "flexible") lifestyleScore += 10;
            else lifestyleScore += 5;

            // Visitor Policy (10 points)
            if (seekerLf.visitorPolicy === hostLifestyle.visitorPolicy || seekerLf.visitorPolicy === "flexible") lifestyleScore += 10;
            else lifestyleScore += 5;
        } else {
            lifestyleScore = 42;
        }

        const total = roomScore + lifestyleScore;
        // Clamp between 60% and 99% for verified matches
        return Math.min(Math.max(total, 65), 98);
    }
}
