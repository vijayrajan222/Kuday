import mongoose, {
    Schema,
    type HydratedDocument,
    type InferSchemaType,
} from "mongoose";

const CommonTermsSchema = new Schema(
    {
        rent: { type: Number, required: true },
        deposit: { type: Number, required: true },
        moveInDate: { type: String, required: true },
        durationMonths: { type: Number, required: true, default: 11 },
        noticePeriodDays: { type: Number, required: true, default: 30 },
        paymentDueDay: { type: Number, required: true, default: 5 },
        utilities: { type: String, required: true, default: "Electricity and water split equally" },
    },
    { _id: false }
);

const ProposedCommonTermsSchema = new Schema(
    {
        proposedBy: { type: String, required: true },
        terms: { type: CommonTermsSchema, required: true },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
        },
        proposedAt: { type: Date, default: Date.now },
        respondedAt: { type: Date },
    },
    { _id: false }
);

const CustomClauseSchema = new Schema({
    proposedBy: { type: String, required: true },
    originalText: { type: String, required: true },
    aiDraftText: { type: String, default: "" },
    finalText: { type: String, required: true },
    status: {
        type: String,
        enum: ["proposed", "accepted", "rejected", "countered"],
        default: "proposed",
    },
    respondedBy: { type: String },
    respondedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
});

const PaymentSchema = new Schema(
    {
        required: { type: Boolean, default: false },
        payerId: { type: String },
        amount: { type: Number, default: 0 },
        provider: { type: String, enum: ["razorpay", "mock"] },
        orderId: { type: String },
        paymentId: { type: String },
        status: {
            type: String,
            enum: ["pending", "completed", "failed", "waived"],
            default: "pending",
        },
    },
    { _id: false }
);

const SignaturePartySchema = new Schema(
    {
        signedAt: { type: Date },
        ip: { type: String },
    },
    { _id: false }
);

const SignaturesSchema = new Schema(
    {
        host: { type: SignaturePartySchema },
        seeker: { type: SignaturePartySchema },
    },
    { _id: false }
);

export const AgreementSchema = new Schema(
    {
        hostId: { type: String, required: true, index: true },
        seekerId: { type: String, required: true, index: true },
        roomId: { type: String, required: true, index: true },
        status: {
            type: String,
            enum: [
                "draft",
                "negotiating",
                "awaiting_payment",
                "ready_to_sign",
                "signed",
                "cancelled",
            ],
            default: "draft",
            index: true,
        },
        commonTerms: { type: CommonTermsSchema, required: true },
        pendingCommonTerms: { type: ProposedCommonTermsSchema },
        hostObligations: { type: [String], default: [] },
        seekerObligations: { type: [String], default: [] },
        customClauses: { type: [CustomClauseSchema], default: [] },
        payment: { type: PaymentSchema, default: () => ({ required: false, amount: 0, status: "pending" }) },
        signatures: { type: SignaturesSchema, default: () => ({}) },
        version: { type: Number, default: 1 },
        lockedAt: { type: Date },
        pdfUrl: { type: String, default: "" },
    },
    {
        timestamps: true,
    }
);

// Only one active agreement exists per host + seeker + room
AgreementSchema.index(
    { hostId: 1, seekerId: 1, roomId: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $ne: "cancelled" } },
    }
);

export type AgreementDoc = HydratedDocument<InferSchemaType<typeof AgreementSchema>>;

export const AgreementModel = mongoose.model<AgreementDoc>("Agreement", AgreementSchema);
