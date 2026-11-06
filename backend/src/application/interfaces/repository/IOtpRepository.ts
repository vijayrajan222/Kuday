import type { OtpEntity } from "@domain/entities/OtpEntity.js";


/**
 * we created a interface to save the otp list a collection for otp details 
 * and this interface can interfear in the reading writing data from the database
 * so it is interface for Repository 
 */
export interface IOtpRepository{
    save(otpData: Omit<OtpEntity,"id"|"createdAt">): Promise<OtpEntity>;
    findLatestByEmail(email:string):Promise<OtpEntity|null>
    deleteByEmail(email:string):Promise<void>
}