import type { IAgreementRepository } from "@application/interfaces/repository/IAgreementRepository";
import type {
    AgreementEntity,
    AgreementStatus,
    CustomClauseEntity,
    CustomClauseStatus,
    AgreementPaymentStatus,
} from "@domain/entities/AgreementEntity";
import { AgreementModel, type AgreementDoc } from "@infrastructure/database/model/AgreementModel";

export class MongoAgreementRepository implements IAgreementRepository {
    private mapToEntity(doc: AgreementDoc): AgreementEntity {
        const rawObj = doc.toObject();

        const customClauses: CustomClauseEntity[] = (rawObj.customClauses || []).map((clause) => {
            const clauseObj = clause as {
                _id: unknown;
                proposedBy: string;
                originalText: string;
                aiDraftText?: string;
                finalText: string;
                status: string;
                respondedBy?: string;
                respondedAt?: Date;
                createdAt?: Date;
            };

            return {
                id: clauseObj._id ? String(clauseObj._id) : "",
                proposedBy: clauseObj.proposedBy,
                originalText: clauseObj.originalText,
                aiDraftText: clauseObj.aiDraftText || undefined,
                finalText: clauseObj.finalText,
                status: (clauseObj.status as CustomClauseStatus) || "proposed",
                respondedBy: clauseObj.respondedBy || undefined,
                respondedAt: clauseObj.respondedAt ? clauseObj.respondedAt.toISOString() : undefined,
                createdAt: clauseObj.createdAt ? clauseObj.createdAt.toISOString() : undefined,
            };
        });

        return {
            id: typeof doc._id === "string" ? doc._id : doc._id.toString(),
            hostId: doc.hostId,
            seekerId: doc.seekerId,
            roomId: doc.roomId,
            status: doc.status as AgreementStatus,
            commonTerms: {
                rent: doc.commonTerms.rent,
                deposit: doc.commonTerms.deposit,
                moveInDate: doc.commonTerms.moveInDate,
                durationMonths: doc.commonTerms.durationMonths,
                noticePeriodDays: doc.commonTerms.noticePeriodDays,
                paymentDueDay: doc.commonTerms.paymentDueDay,
                utilities: doc.commonTerms.utilities,
            },
            pendingCommonTerms: doc.pendingCommonTerms
                ? {
                      proposedBy: doc.pendingCommonTerms.proposedBy,
                      terms: {
                          rent: doc.pendingCommonTerms.terms.rent,
                          deposit: doc.pendingCommonTerms.terms.deposit,
                          moveInDate: doc.pendingCommonTerms.terms.moveInDate,
                          durationMonths: doc.pendingCommonTerms.terms.durationMonths,
                          noticePeriodDays: doc.pendingCommonTerms.terms.noticePeriodDays,
                          paymentDueDay: doc.pendingCommonTerms.terms.paymentDueDay,
                          utilities: doc.pendingCommonTerms.terms.utilities,
                      },
                      status: doc.pendingCommonTerms.status as "pending" | "accepted" | "rejected",
                      proposedAt: doc.pendingCommonTerms.proposedAt
                          ? new Date(doc.pendingCommonTerms.proposedAt).toISOString()
                          : new Date().toISOString(),
                      respondedAt: doc.pendingCommonTerms.respondedAt
                          ? new Date(doc.pendingCommonTerms.respondedAt).toISOString()
                          : undefined,
                  }
                : undefined,
            hostObligations: doc.hostObligations || [],
            seekerObligations: doc.seekerObligations || [],
            customClauses,
            editLock: {
                userId: doc.editLock?.userId || null,
                expiresAt: doc.editLock?.expiresAt ? new Date(doc.editLock.expiresAt).toISOString() : null,
            },
            revision: typeof doc.revision === "number" ? doc.revision : 1,
            pendingWith: doc.pendingWith || null,
            lastSubmittedBy: doc.lastSubmittedBy || null,
            acceptedBy: doc.acceptedBy || [],
            acceptanceTimestamps: {
                host: doc.acceptanceTimestamps?.host
                    ? new Date(doc.acceptanceTimestamps.host).toISOString()
                    : null,
                seeker: doc.acceptanceTimestamps?.seeker
                    ? new Date(doc.acceptanceTimestamps.seeker).toISOString()
                    : null,
            },
            payment: {
                required: Boolean(doc.payment?.required),
                payerId: doc.payment?.payerId || undefined,
                amount: doc.payment?.amount || 0,
                provider: (doc.payment?.provider as "razorpay" | "mock") || undefined,
                orderId: doc.payment?.orderId || undefined,
                paymentId: doc.payment?.paymentId || undefined,
                status: (doc.payment?.status as AgreementPaymentStatus) || "pending",
            },
            startDate: doc.startDate || undefined,
            endDate: doc.endDate || undefined,
            activatedAt: doc.activatedAt || undefined,
            slotRestored: doc.slotRestored || false,
            terminatedAt: doc.terminatedAt || undefined,
            version: doc.version || 1,
            lockedAt: doc.lockedAt ? new Date(doc.lockedAt).toISOString() : undefined,
            pdfUrl: doc.pdfUrl || undefined,
            createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
        };
    }

    async create(data: Omit<AgreementEntity, "id">): Promise<AgreementEntity> {
        const payload: Record<string, unknown> = {
            hostId: data.hostId,
            seekerId: data.seekerId,
            roomId: data.roomId,
            status: data.status || "draft",
            commonTerms: data.commonTerms,
            hostObligations: data.hostObligations || [],
            seekerObligations: data.seekerObligations || [],
            customClauses: data.customClauses || [],
            editLock: data.editLock || { userId: null, expiresAt: null },
            revision: data.revision || 1,
            pendingWith: data.pendingWith || null,
            lastSubmittedBy: data.lastSubmittedBy || null,
            acceptedBy: data.acceptedBy || [],
            acceptanceTimestamps: data.acceptanceTimestamps || { host: null, seeker: null },
            payment: data.payment,
            version: data.version || 1,
        };
        if (data.pendingCommonTerms) {
            payload.pendingCommonTerms = data.pendingCommonTerms;
        }
        if (data.lockedAt) {
            payload.lockedAt = data.lockedAt;
        }
        if (data.pdfUrl) {
            payload.pdfUrl = data.pdfUrl;
        }
        if (data.startDate) {
            payload.startDate = data.startDate;
        }
        if (data.endDate) {
            payload.endDate = data.endDate;
        }

        const doc = await AgreementModel.create(payload);
        return this.mapToEntity(doc);
    }

    async findById(id: string): Promise<AgreementEntity | null> {
        const doc = await AgreementModel.findById(id).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findActive(hostId: string, seekerId: string, roomId: string): Promise<AgreementEntity | null> {
        const doc = await AgreementModel.findOne({
            hostId,
            seekerId,
            roomId,
            status: { $ne: "cancelled" },
        }).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async update(id: string, updates: Partial<AgreementEntity>): Promise<AgreementEntity | null> {
        const doc = await AgreementModel.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true }
        ).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByUser(userId: string): Promise<AgreementEntity[]> {
        const docs = await AgreementModel.find({
            $or: [{ hostId: userId }, { seekerId: userId }],
            status: { $ne: "cancelled" },
        })
            .sort({ updatedAt: -1 })
            .exec();
        return docs.map((d) => this.mapToEntity(d));
    }

    async findByOrderId(orderId: string): Promise<AgreementEntity | null> {
        const doc = await AgreementModel.findOne({ "payment.orderId": orderId }).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async markCompletedAtomic(id: string, updates: Partial<AgreementEntity>): Promise<AgreementEntity | null> {
        const doc = await AgreementModel.findOneAndUpdate(
            {
                _id: id,
                status: { $ne: "completed" },
            },
            {
                $set: {
                    ...updates,
                    status: "completed",
                    activatedAt: new Date().toISOString(),
                },
            },
            { new: true }
        ).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async markTerminatedAtomic(id: string, targetStatus: "ended" | "cancelled"): Promise<AgreementEntity | null> {
        const doc = await AgreementModel.findOneAndUpdate(
            {
                _id: id,
                status: "completed",
                slotRestored: { $ne: true },
            },
            {
                $set: {
                    status: targetStatus,
                    slotRestored: true,
                    terminatedAt: new Date().toISOString(),
                },
            },
            { new: true }
        ).exec();
        return doc ? this.mapToEntity(doc) : null;
    }
}
