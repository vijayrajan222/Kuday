

// this is the shape of the user that interacts with the business 
// this entity intreface defines the data of the user.


export interface UserEntity{
    id : string 
    firstName : string 
    lastName : string 
    email : string
    hashedPassword :string 
    isVerified : boolean
    isBlocked : boolean
    otp ?: number
}    

/** next we should do the repostory and usecase  before starting that we should create interfaces that define what is going to happen inside the repository and use case  and 
 * we should describe that as interface in application layer . and it consits of methord that are going to be used not the entire code only list kind . 
 */