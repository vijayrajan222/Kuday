export interface IMailService {
    sendOtpEmail(email:string , otp:string) : Promise<void>
}