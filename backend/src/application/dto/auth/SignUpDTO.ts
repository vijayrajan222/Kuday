
export interface SignUpUserRequestDto{
    email: string,
    firstName: string 
    lastName : string 
    password : string 
    confirmPassword : string
}

export interface SignUpUserResultDTO{
    id: string
    email:string
}
