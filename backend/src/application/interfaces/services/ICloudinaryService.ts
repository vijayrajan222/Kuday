export interface ICloudinaryService {
    uploadImage(fileData: string, folder?: string): Promise<string>;
}
