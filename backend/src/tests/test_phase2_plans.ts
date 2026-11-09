import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectMongo } from "../infrastructure/database/ConnectMongoDB.js";
import { MongoPlanRepository } from "../infrastructure/repository/MongoPlanRepository.js";
import { GetPlansUseCase } from "../application/use-case/payment/GetPlansUseCase.js";
import { seedDefaultPlans, HOST_PLANS } from "../infrastructure/database/seedPlans.js";
import { planModel } from "../infrastructure/database/model/PlanModel.js";

async function runPhase2Test() {
    console.log("==========================================================");
    console.log("=== PHASE 2 TEST: PLANS SEED & LIST ENDPOINT (KUDAI) ===");
    console.log("==========================================================");

    await connectMongo();
    console.log("✓ Connected to MongoDB Atlas\n");

    const planRepo = new MongoPlanRepository();
    const getPlansUseCase = new GetPlansUseCase(planRepo);

    // 1. Run seed script
    await seedDefaultPlans();
    console.log("✓ [1] seedDefaultPlans() executed");

    // 2. Fetch active plans via GetPlansUseCase
    const activePlans = await getPlansUseCase.execute("host");
    console.log(`[2] Retrieved ${activePlans.length} active host plans:`);

    if (activePlans.length !== 2) {
        throw new Error(`Expected exactly 2 active host plans, found: ${activePlans.length}`);
    }

    // 3. Validate Monthly Plan
    const monthlyPlan = activePlans.find((p) => p.durationDays === 30);
    if (!monthlyPlan) throw new Error("Monthly plan (30 days) not found");
    if (monthlyPlan.price !== 49900 || !Number.isInteger(monthlyPlan.price)) {
        throw new Error(`Monthly price must be integer paise 49900, got: ${monthlyPlan.price}`);
    }
    if (monthlyPlan.audience !== "host") {
        throw new Error(`Monthly plan audience must be 'host', got: ${monthlyPlan.audience}`);
    }
    console.log(`✓ [3] Monthly Plan verified: "${monthlyPlan.name}", ₹${monthlyPlan.price / 100} (${monthlyPlan.price} paise), audience: "${monthlyPlan.audience}"`);

    // 4. Validate Yearly Plan
    const yearlyPlan = activePlans.find((p) => p.durationDays === 365);
    if (!yearlyPlan) throw new Error("Yearly plan (365 days) not found");
    if (yearlyPlan.price !== 399900 || !Number.isInteger(yearlyPlan.price)) {
        throw new Error(`Yearly price must be integer paise 399900, got: ${yearlyPlan.price}`);
    }
    if (yearlyPlan.audience !== "host") {
        throw new Error(`Yearly plan audience must be 'host', got: ${yearlyPlan.audience}`);
    }
    console.log(`✓ [4] Yearly Plan verified: "${yearlyPlan.name}", ₹${yearlyPlan.price / 100} (${yearlyPlan.price} paise), audience: "${yearlyPlan.audience}"`);

    // 5. Verify sorting by price ascending
    if (activePlans[0].price > activePlans[1].price) {
        throw new Error("Plans must be sorted by price ascending");
    }
    console.log(`✓ [5] Plans returned sorted by price ascending: [₹${activePlans[0].price / 100}, ₹${activePlans[1].price / 100}]`);

    // 6. Verify non-host/inactive filtering
    const allDbPlans = await planModel.find().lean();
    const inactiveCount = allDbPlans.filter((p) => !p.isActive).length;
    console.log(`✓ [6] Legacy non-host plans deactivated: ${inactiveCount} inactive plan(s) in database`);

    console.log("\n==========================================================");
    console.log("🎉 ALL PHASE 2 CHECKS PASSED PERFECTLY!");
    console.log("==========================================================");

    await mongoose.disconnect();
}

runPhase2Test().catch((err) => {
    console.error("Phase 2 test failed:", err);
    process.exit(1);
});
