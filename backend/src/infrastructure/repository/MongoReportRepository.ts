import type { IReportRepository } from "@application/interfaces/repository/IReportRepository";
import type { ReportEntity, ReportStatus } from "@domain/entities/ReportEntity";
import { ReportModel, type ReportDoc } from "@infrastructure/database/model/ReportModel";

export class MongoReportRepository implements IReportRepository {
    private mapToEntity(doc: ReportDoc): ReportEntity {
        return {
            id: typeof doc._id === "string" ? doc._id : doc._id.toString(),
            reporterId: doc.reporterId,
            reportedUserId: doc.reportedUserId,
            reason: doc.reason,
            message: doc.message,
            screenshotUrl: doc.screenshotUrl || undefined,
            status: (doc.status as ReportStatus) || "pending",
            adminNotes: doc.adminNotes || undefined,
            warningIssued: Boolean(doc.warningIssued),
            warningMessage: doc.warningMessage || undefined,
            warningIssuedAt: doc.warningIssuedAt ? String(doc.warningIssuedAt) : undefined,
            createdAt: doc.createdAt ? String(doc.createdAt) : undefined,
            updatedAt: doc.updatedAt ? String(doc.updatedAt) : undefined,
        };
    }

    async create(data: Omit<ReportEntity, "id">): Promise<ReportEntity> {
        const payload: Record<string, unknown> = {
            reporterId: data.reporterId,
            reportedUserId: data.reportedUserId,
            reason: data.reason,
            message: data.message,
            status: data.status || "pending",
        };
        if (data.screenshotUrl) {
            payload.screenshotUrl = data.screenshotUrl;
        }
        if (data.adminNotes) {
            payload.adminNotes = data.adminNotes;
        }
        const doc = await ReportModel.create(payload);
        return this.mapToEntity(doc);
    }

    async findById(id: string): Promise<ReportEntity | null> {
        const doc = await ReportModel.findById(id).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findAll(filter?: {
        status?: string | undefined;
        reportedUserId?: string | undefined;
        reporterId?: string | undefined;
    }): Promise<ReportEntity[]> {
        const query: Record<string, unknown> = {};
        if (filter?.status) {
            query.status = filter.status;
        }
        if (filter?.reportedUserId) {
            query.reportedUserId = filter.reportedUserId;
        }
        if (filter?.reporterId) {
            query.reporterId = filter.reporterId;
        }
        const docs = await ReportModel.find(query).sort({ createdAt: -1 }).exec();
        return docs.map((doc) => this.mapToEntity(doc));
    }

    async updateStatus(
        id: string,
        status: ReportStatus,
        adminNotes?: string
    ): Promise<ReportEntity | null> {
        const updatePayload: Record<string, unknown> = { status };
        if (adminNotes !== undefined) {
            updatePayload.adminNotes = adminNotes;
        }
        const doc = await ReportModel.findByIdAndUpdate(
            id,
            { $set: updatePayload },
            { new: true }
        ).exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async issueWarning(
        id: string,
        warningMessage: string
    ): Promise<ReportEntity | null> {
        const existing = await ReportModel.findById(id).exec();
        const now = new Date();
        const noteStamp = `[Warning Sent ${now.toLocaleDateString()}]: ${warningMessage}`;
        const updatedNotes = existing?.adminNotes
            ? `${existing.adminNotes}\n${noteStamp}`
            : noteStamp;

        const doc = await ReportModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    warningIssued: true,
                    warningMessage,
                    warningIssuedAt: now,
                    adminNotes: updatedNotes,
                },
            },
            { new: true }
        ).exec();
        return doc ? this.mapToEntity(doc) : null;
    }
}
