/**
 * this is the interface that define what are the class that handles the actions for the user entity.
 * it is not specific for any data bases
 * it is just a contract that defines the methods needed to read and write data from the db
 * 
 */

import type { UserEntity } from "../../../domain/entities/UserEntity.js";


export interface IUserRepository{

    save(newUser:Omit<UserEntity,"id">) : Promise<UserEntity>
    /** this methords saves the userdata to the database .  we are giving the userEntity 
     * @param the data of the new user in the user enity 
     * @return the user data saved in the db which is again the userEnity 
    */
    


}