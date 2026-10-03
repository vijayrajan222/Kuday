import type { IUserRepository } from "../../application/interfaces/repository/IUserRepository.js";
import type { UserEntity } from "../../domain/entities/UserEntity.js";
import { userModel } from "../database/model/UserModel.js";

export class MongoUserRepository implements IUserRepository {
    private readonly user = userModel;
    constructor() {}

    private mapUserDoc(doc: any): UserEntity {
        return {
            id: doc._id.toString(),
            email: doc.email,
            firstName: doc.firstName,
            lastName: doc.lastName ?? "",
            hashedPassword: doc.hashedPassword ?? "",
            isVerified: doc.isVerified,
            isBlocked: doc.isBlocked,
            dob: doc.dob ?? "",
            gender: doc.gender ?? "",
            occupation: doc.occupation ?? "",
            bio: doc.bio ?? "",
            role: doc.role as 'host' | 'seeker' | 'none',
            isOnboarded: doc.isOnboarded ?? false,
            idCardUrl: doc.idCardUrl ?? "",
            selfieUrl: doc.selfieUrl ?? "",
            identityVerified: doc.identityVerified ?? false,
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
}
