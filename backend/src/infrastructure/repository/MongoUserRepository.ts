import type { IUserRepository } from "../../application/interfaces/repository/IUserRepository.js";
import type { UserEntity } from "../../domain/entities/UserEntity.js";
import { userModel } from "../database/model/UserModel.js";

export class MongoUserRepository implements IUserRepository {
    private readonly user = userModel;
    constructor() {}

    async save(newUser: Omit<UserEntity, "id">): Promise<UserEntity> {
        const userDocument = await this.user.create(newUser);
        return {
            id: userDocument._id.toString(),
            email: userDocument.email,
            firstName: userDocument.firstName,
            lastName: userDocument.lastName ?? "",
            hashedPassword: userDocument.hashedPassword ?? "",
            isVerified: userDocument.isVerified,
            isBlocked: userDocument.isBlocked,
        };
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        let doc = await this.user.findOne({ email });
        if (!doc) return null;
        return {
            id: doc._id.toString(),
            email: doc.email,
            firstName: doc.firstName,
            lastName: doc.lastName ?? "",
            hashedPassword: doc.hashedPassword ?? "",
            isVerified: doc.isVerified,
            isBlocked: doc.isBlocked,
        };
    }

    async updateVerificationStatus(email: string, isVerified: boolean): Promise<void> {
        await this.user.updateOne({ email }, { isVerified });
    }
}
