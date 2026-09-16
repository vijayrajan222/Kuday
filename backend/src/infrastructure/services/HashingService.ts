import bcrypt from "bcrypt"

import type { IHashingService } from "../../application/interfaces/services/IhashingService.js";

export class HashService implements IHashingService{
    constructor(){}

    async hash(input: string): Promise<string> {
       let hashedPassword
        = await bcrypt.hash(input, 10);

        return hashedPassword 
    }

    async compareHashes(hashedValue: string, plainValue: string): Promise<boolean> {
        return await bcrypt.compare(hashedValue,plainValue)
    }
}