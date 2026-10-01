export interface VerifyResetOtpRequestDto{
    email : string
    otp : string
    
}

export interface VerifyResetOtpResponseDto{
    email : string
    isVerified : boolean 
    token : string 
    message: string
}