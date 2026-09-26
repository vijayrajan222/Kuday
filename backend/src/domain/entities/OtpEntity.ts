export interface OtpEntity {
    id?: string;
    email: string;
    otp: string;
    expiresAt : Date;
    createdAt ?: Date;
}