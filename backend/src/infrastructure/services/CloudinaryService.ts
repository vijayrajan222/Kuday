import { v2 as cloudinary } from "cloudinary";
import type { ICloudinaryService } from "@application/interfaces/services/ICloudinaryService.js";

export class CloudinaryService implements ICloudinaryService {
    constructor() {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "hz3hcfmp",
            api_key: process.env.CLOUDINARY_API_KEY || "477183347914279",
            api_secret: process.env.CLOUDINARY_API_SECRET || "NmxJ_TNF-crUAc_V39VnutTuKSE",
        });
    }

    async uploadImage(fileData: string, folder: string = "kuday_identity"): Promise<string> {
        try {
            const result = await cloudinary.uploader.upload(fileData, {
                folder,
                resource_type: "auto",
            });
            return result.secure_url;
        } catch (error: unknown) {
            throw new Error(`Cloudinary upload failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
