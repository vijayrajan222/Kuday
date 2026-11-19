import mongoose from "mongoose";
import { connectMongo } from "../ConnectMongoDB.js";
import { RoomModel } from "../model/RoomModel.js";
import { AgreementModel } from "../model/AgreementModel.js";

/**
 * Migration: Post-Agreement Schema Updates
 * 1. Sets availableSlots = capacity (default 1) for rooms where availableSlots is undefined.
 * 2. Backfills startDate and endDate for completed agreements missing them.
 * Note: User role remains unchanged ("none" state preserved, no user updates).
 */
export async function runMigration(): Promise<void> {
    console.log("Starting post-agreement schema migration...");
    await connectMongo();

    // 1. Migrate Rooms: set availableSlots from capacity where missing
    const roomsToUpdate = await RoomModel.countDocuments({
        availableSlots: { $exists: false },
    });
    console.log(`Found ${roomsToUpdate} rooms missing availableSlots.`);

    if (roomsToUpdate > 0) {
        const roomResult = await RoomModel.updateMany(
            { availableSlots: { $exists: false } },
            [{ $set: { availableSlots: { $ifNull: ["$capacity", 1] } } }]
        );
        console.log(`Migrated ${roomResult.modifiedCount} rooms.`);
    }

    // 2. Migrate Completed Agreements: populate startDate & endDate if missing
    const completedAgreements = await AgreementModel.find({
        status: "completed",
        $or: [{ startDate: { $exists: false } }, { startDate: null }],
    });
    console.log(`Found ${completedAgreements.length} completed agreements missing startDate.`);

    let agreementUpdatedCount = 0;
    for (const ag of completedAgreements) {
        const commonTerms = ag.commonTerms as { moveInDate?: string; durationMonths?: number } | undefined;
        const startDate = commonTerms?.moveInDate || (ag.createdAt ? new Date(ag.createdAt).toISOString() : new Date().toISOString());
        let endDate: string | null = null;
        try {
            const d = new Date(startDate);
            if (!isNaN(d.getTime())) {
                d.setMonth(d.getMonth() + (commonTerms?.durationMonths || 11));
                endDate = d.toISOString();
            }
        } catch {
            // ignore
        }

        await AgreementModel.updateOne(
            { _id: ag._id },
            { $set: { startDate, endDate } }
        );
        agreementUpdatedCount++;
    }
    console.log(`Migrated ${agreementUpdatedCount} completed agreements.`);

    console.log("Migration completed successfully.");
    await mongoose.disconnect();
}

// Allow direct execution if run via node/tsx
if (process.argv[1] && process.argv[1].includes("migratePostAgreementSchema")) {
    runMigration()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error("Migration failed:", err);
            process.exit(1);
        });
}
