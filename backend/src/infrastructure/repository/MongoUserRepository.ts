/**
 * here we can write the code for any dbs like mongo progress or anyting 
 * the code we write here is independant of other interfaces we written earlier 
 *
 */

import type { IUserRepository } from "../../application/interfaces/repository/IUserRepository.js";
import type { UserEntity } from "../../domain/entities/UserEntity.js";
import { userModel } from "../database/model/UserModel.js";

export class MongoUserRepository implements IUserRepository {
    private readonly user = userModel
    constructor(){
        
    }
    async save(newUser: Omit<UserEntity, "id">): Promise<UserEntity> {
        /**
         * this mehtor saves the user without id 
         * to mongodb user collection 
         * and returns the saved user documents with the id 
         * @param newUser: user without id 
         * @return the new user with id detils 
         */
       const userDocument =  await this.user.create(newUser)
       return {
        id : userDocument._id.toString(),
        email : userDocument.email,
        firstName : userDocument.firstName,
        lastName: userDocument.lastName,
        hashedPassword: userDocument.hashedPassword,
        isVerified : userDocument.isVerified,
        isBlocked: userDocument.isBlocked,

       }
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        /**
         * this methord is initiated in the IuserRepository for conforming wether 
         * the user already exisit or not if there is a user with the same email 
         * it should not get saved so we check wether the person with same email 
         * exist or not and as we are implementing the same methord in here so 
         * we should write the methrod over here 
         * @param email : the entered email id by the user
         * @returns the user details if the user is there or else returning null;
         */

        let doc = await this.user.findOne({email});
        if(!doc) return null;
        return {
            id : doc._id.toString(),
            email : doc.email,
            firstName : doc.firstName,
            lastName : doc.lastName,
            hashedPassword : doc.hashedPassword,
            isVerified : doc.isVerified,
            isBlocked : doc.isBlocked
        }
    }

    async updateVerificationStatus(email: string, isVerified: boolean): Promise<void> {
        await this.user.updateOne({email},{isVerified})
    }
}
