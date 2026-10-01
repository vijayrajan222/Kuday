export interface ResetPasswordRequestDto {
    email: string
    newPassword: string
    confirmPassword: string
}
export interface ResetPasswordResponseDto {
    email : string ;
    message: string;

}