import type { IUserRepository } from "../../application/interfaces/repository/IUserRepository.js";
import type { UserEntity } from "../../domain/entities/UserEntity.js";
import { userModel, type UserDoc } from "../database/model/UserModel.js";

export class MongoUserRepository implements IUserRepository {
    private readonly user = userModel;
    constructor() {}

    private mapUserDoc(doc: UserDoc): UserEntity {
        return {
            id: typeof doc._id === 'string' ? doc._id : doc._id.toString(),
            email: doc.email ?? "",
            firstName: doc.firstName ?? "",
            lastName: doc.lastName ?? "",
            hashedPassword: doc.hashedPassword ?? "",
            isVerified: Boolean(doc.isVerified),
            isBlocked: Boolean(doc.isBlocked),
            isAdmin: Boolean(doc.isAdmin),
            dob: doc.dob ?? "",
            gender: doc.gender ?? "",
            occupation: doc.occupation ?? "",
            bio: doc.bio ?? "",
            role: (doc.role as 'host' | 'seeker' | 'admin' | 'none') ?? 'none',
            isOnboarded: Boolean(doc.isOnboarded),
            idCardUrl: doc.idCardUrl ?? "",
            selfieUrl: doc.selfieUrl ?? "",
            identityVerified: Boolean(doc.identityVerified),
            identityStatus: (doc.identityStatus as 'pending' | 'verified' | 'rejected' | 'none') ?? 'none',
            rejectionReason: doc.rejectionReason ?? "",
        };
    }

    async save(newUser: Omit<UserEntity, "id">): Promise<UserEntity> {
        try {
            const userDocument = await this.user.create(newUser);
            return this.mapUserDoc(userDocument);
        } catch (error: unknown) {
            if (typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000) {
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

    async findAll(): Promise<UserEntity[]> {
        const docs = await this.user.find().exec();
        return docs.map((doc) => this.mapUserDoc(doc));
    }

    async updateVerificationStatus(email: string, isVerified: boolean): Promise<void> {
        await this.user.updateOne({ email }, { isVerified });
    }

    async updatenewPassword(email: string, hashedPassword: string): Promise<void> {
        await this.user.updateOne({ email }, { hashedPassword });
    }

    async updateProfile(userId: string, profileData: Partial<UserEntity>): Promise<UserEntity | null> {
        // Explicitly pick ONLY allowed profile fields to prevent mass-assignment vulnerabilities (e.g. isAdmin, isBlocked)
        const allowedUpdates: Record<string, unknown> = {};
        if (profileData.firstName !== undefined) allowedUpdates.firstName = profileData.firstName;
        if (profileData.lastName !== undefined) allowedUpdates.lastName = profileData.lastName;
        if (profileData.dob !== undefined) allowedUpdates.dob = profileData.dob;
        if (profileData.gender !== undefined) allowedUpdates.gender = profileData.gender;
        if (profileData.occupation !== undefined) allowedUpdates.occupation = profileData.occupation;
        if (profileData.bio !== undefined) allowedUpdates.bio = profileData.bio;
        if (profileData.selfieUrl !== undefined) allowedUpdates.selfieUrl = profileData.selfieUrl;
        if (profileData.idCardUrl !== undefined) allowedUpdates.idCardUrl = profileData.idCardUrl;
        if (profileData.role !== undefined) allowedUpdates.role = profileData.role;
        if (profileData.isOnboarded !== undefined) allowedUpdates.isOnboarded = profileData.isOnboarded;
        if (profileData.identityVerified !== undefined) allowedUpdates.identityVerified = profileData.identityVerified;
        if (profileData.identityStatus !== undefined) allowedUpdates.identityStatus = profileData.identityStatus;
        if (profileData.rejectionReason !== undefined) allowedUpdates.rejectionReason = profileData.rejectionReason;

        const doc = await this.user.findByIdAndUpdate(userId, { $set: allowedUpdates }, { new: true });
        if (!doc) return null;
        return this.mapUserDoc(doc);
    }

    async updateUser(userId: string, userData: Partial<UserEntity>): Promise<UserEntity | null> {
        const doc = await this.user.findByIdAndUpdate(userId, { $set: userData }, { new: true });
        if (!doc) return null;
        return this.mapUserDoc(doc);
    }
}
