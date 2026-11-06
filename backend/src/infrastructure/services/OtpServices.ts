import crypto from "node:crypto";
import type { IOtpService } from "@application/interfaces/services/IOtpServices";

export class OtpService implements IOtpService {
    constructor() {}

    generateOtp(length: number = 6): string {
        let otp = "";
        for (let i = 0; i < length; i++) {
            otp += crypto.randomInt(0, 10).toString();
        }
        return otp;
    }
}