
export interface SignUpUserRequestDto{
    email: string,
    firstName: string 
    lastName : string 
    Password : string 
    ConfirmPassword : string
}

export interface SignUpUserResultDTO{
    id: string
    email:string
}
