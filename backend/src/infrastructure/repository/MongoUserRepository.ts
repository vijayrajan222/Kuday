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
}

