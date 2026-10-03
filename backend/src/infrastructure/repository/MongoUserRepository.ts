import type { IUserRepository } from "../../application/interfaces/repository/IUserRepository.js";
import type { UserEntity } from "../../domain/entities/UserEntity.js";
import { userModel } from "../database/model/UserModel.js";

interface UserDoc {
    _id: { toString(): string } | string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    hashedPassword?: string | null;
    isVerified?: boolean | null;
    isBlocked?: boolean | null;
    isAdmin?: boolean | null;
    dob?: string | null;
    gender?: string | null;
    occupation?: string | null;
    bio?: string | null;
    role?: string | null;
    isOnboarded?: boolean | null;
    idCardUrl?: string | null;
    selfieUrl?: string | null;
    identityVerified?: boolean | null;
    identityStatus?: string | null;
    rejectionReason?: string | null;
}

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
        const userDocument = await this.user.create(newUser);
        return this.mapUserDoc(userDocument);
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
        const doc = await this.user.findByIdAndUpdate(userId, { $set: profileData }, { new: true });
        if (!doc) return null;
        return this.mapUserDoc(doc);
    }

    async updateUser(userId: string, userData: Partial<UserEntity>): Promise<UserEntity | null> {
        return this.updateProfile(userId, userData);
    }
}
