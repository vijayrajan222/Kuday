import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { UserEntity } from "@domain/entities/UserEntity";
import { userModel, type UserDoc } from "@infrastructure/database/model/UserModel";

/**
 * Fields that updateProfile() is allowed to change.
 * Anything not listed here (isAdmin, isBlocked, email, hashedPassword, ...)
 * is ignored, which prevents mass-assignment of sensitive fields.
 */
const PROFILE_UPDATABLE_FIELDS = [
    "firstName",
    "lastName",
    "dob",
    "gender",
    "occupation",
    "bio",
    "selfieUrl",
    "idCardUrl",
    "role",
    "isOnboarded",
    "identityVerified",
    "identityStatus",
    "rejectionReason",
] as const satisfies readonly (keyof UserEntity)[];

/** MongoDB duplicate-key error code (unique index violated). */
const MONGO_DUPLICATE_KEY_CODE = 11000;

function isDuplicateKeyError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: unknown }).code === MONGO_DUPLICATE_KEY_CODE
    );
}

export class MongoUserRepository implements IUserRepository {
    private readonly user = userModel;

    // Converts a Mongoose document into a clean domain entity
    private mapUserDoc(doc: UserDoc): UserEntity {
        return {
            id: typeof doc._id === "string" ? doc._id : doc._id.toString(),
            email: doc.email ?? "",
            firstName: doc.firstName ?? "",
            lastName: doc.lastName ?? "",
            hashedPassword: doc.hashedPassword ?? "",
            isVerified: Boolean(doc.isVerified),
            isBlocked: Boolean(doc.isBlocked),
            isAdmin: Boolean(doc.isAdmin),
            isPremium: Boolean(doc.isPremium),
            premiumExpiresAt: doc.premiumExpiresAt ?? undefined,
            dob: doc.dob ?? "",
            gender: doc.gender ?? "",
            occupation: doc.occupation ?? "",
            bio: doc.bio ?? "",
            role: (doc.role as "host" | "seeker" | "admin" | "none") ?? "none",
            isOnboarded: Boolean(doc.isOnboarded),
            idCardUrl: doc.idCardUrl ?? "",
            selfieUrl: doc.selfieUrl ?? "",
            identityVerified: Boolean(doc.identityVerified),
            identityStatus:
                (doc.identityStatus as "pending" | "verified" | "rejected" | "none") ?? "none",
            rejectionReason: doc.rejectionReason ?? "",
        };
    }

    async save(newUser: Omit<UserEntity, "id">): Promise<UserEntity> {
        try {
            const userDocument = await this.user.create(newUser as never);
            return this.mapUserDoc(userDocument);
        } catch (error: unknown) {
            // Two signups with the same email at the same moment
            if (isDuplicateKeyError(error)) {
                throw new Error("User with this email already exists.");
            }
            throw error;
        }
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        const doc = await this.user.findOne({ email });
        if (!doc) return null;
        return this.mapUserDoc(doc);
    }

    async findById(id: string): Promise<UserEntity | null> {
        const doc = await this.user.findById(id);
        if (!doc) return null;
        return this.mapUserDoc(doc);
    }

    async findAll(search?: string): Promise<UserEntity[]> {
        const filter: Record<string, unknown> = {};
        if (search && search.trim()) {
            const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(escaped, "i");
            filter.$or = [
                { firstName: regex },
                { lastName: regex },
                { email: regex },
                { role: regex },
            ];
        }
        const docs = await this.user.find(filter).exec();
        return docs.map((doc) => this.mapUserDoc(doc));
    }

    async updateVerificationStatus(email: string, isVerified: boolean): Promise<void> {
        await this.user.updateOne({ email }, { isVerified });
    }

    async updatenewPassword(email: string, hashedPassword: string): Promise<void> {
        await this.user.updateOne({ email }, { hashedPassword });
    }

    async updateProfile(
        userId: string,
        profileData: Partial<UserEntity>
    ): Promise<UserEntity | null> {
        // Copy only the allowed fields that were actually provided
        const allowedUpdates: Record<string, unknown> = {};
        for (const field of PROFILE_UPDATABLE_FIELDS) {
            if (profileData[field] !== undefined) {
                allowedUpdates[field] = profileData[field];
            }
        }

        const doc = await this.user.findByIdAndUpdate(
            userId,
            { $set: allowedUpdates },
            { new: true } // return the updated document, not the old one
        );
        if (!doc) return null;
        return this.mapUserDoc(doc);
    }

    /**
     * Unfiltered update. Only call this from trusted use cases (e.g. admin
     * block / identity verification) with values the use case built itself,
     * never with raw request data.
     */
    async updateUser(
        userId: string,
        userData: Partial<UserEntity>,
        session?: unknown
    ): Promise<UserEntity | null> {
        const doc = await this.user.findByIdAndUpdate(
            userId,
            { $set: userData },
            {
                returnDocument: "after",
                session: (session as any) || undefined,
            }
        );
        if (!doc) return null;
        return this.mapUserDoc(doc);
    }
}
