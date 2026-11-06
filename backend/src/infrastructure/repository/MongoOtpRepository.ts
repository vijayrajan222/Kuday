import type { IOtpRepository } from "@application/interfaces/repository/IOtpRepository";
import type { OtpEntity } from "@domain/entities/OtpEntity";

import { otpModel } from "@infrastructure/database/model/OtpModel";



export class MongoOtpRepository implements IOtpRepository{
    private readonly _otp = otpModel
    constructor(){

    }
   
   async save(otpData: Omit<OtpEntity,"id"|"createdAt">): Promise<OtpEntity>{
    const doc = await this._otp.create({
        email : otpData.email,
        otp: otpData.otp,
        expiresAt : otpData.expiresAt
    })
            return {
                id: doc._id.toString(),
                email: doc.email,
                otp: doc.otp,
                expiresAt : doc.expiresAt,
            }
    }
  async  findLatestByEmail(email:string):Promise<OtpEntity|null>{
        const doc  = await this._otp.findOne({email}).sort({createdAt:-1})
            if(!doc) return null

            return {
                id: doc._id.toString(),
                email: doc.email,
                otp: doc.otp,
                expiresAt : doc.expiresAt,
                createdAt : doc.createdAt
            }
        }
  async  deleteByEmail(email:string):Promise<void> {
        await this._otp.deleteMany({email})
    }  

}