/**
 * this is the interface that define what are the class that handles the actions for the user entity.
 * it is not specific for any data bases
 * it is just a contract that defines the methods needed to read and write data from the db
 * 
 */

import type { UserEntity } from "@domain/entities/UserEntity";

export interface IUserRepository {
    save(newUser: Omit<UserEntity, "id">): Promise<UserEntity>;
    findByEmail(email: string): Promise<UserEntity | null>;
    updateVerificationStatus(email: string, isVerified: boolean): Promise<void>;
    updatenewPassword(email: string, password: string): Promise<void>;
    updateProfile(userId: string, profileData: Partial<UserEntity>): Promise<UserEntity | null>;
    updateUser(userId: string, userData: Partial<UserEntity>, session?: unknown): Promise<UserEntity | null>;
    findById(id: string): Promise<UserEntity | null>;
    findAll(search?: string): Promise<UserEntity[]>;
}
