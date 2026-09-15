import type { UserEntity } from "../../../domain/entities/UserEntity.js";
import { MongoUserRepository } from "../../../infrastructure/repository/MongoUserRepository.js";
import type { SignUpUserRequestDto, SignUpUserResultDTO } from "../../dto/auth/SignUpDTO.js";
import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { ISignUpUserUsercase } from "../../interfaces/use-case/auth/ISignUpUserUsecase.js";


/**
 * this class is to implement interface of the signupUserUsecase. 
 * this exicutes the fucntion to verify the user data call the user repo
 * and save the user data.
 */
export  class SignUpUserUseCase implements ISignUpUserUsercase{
    private _userRepo : IUserRepository
    constructor(userRepo : IUserRepository){ 
        this._userRepo = userRepo
    }

    async execute(dto: SignUpUserRequestDto): Promise<SignUpUserResultDTO> {
        
        const newUser : Omit<UserEntity, "id">  = {
            firstName : dto.firstName,
            lastName : dto.lastName,
            email : dto.email,
            isVerified : false,
            isBlocked : false,
            hashedPassword : dto.Password  // later we will hash it .
        }


        let savedUser =  await this._userRepo.save(newUser)
        return {id :savedUser.id, email:savedUser.email}

    }
   
}