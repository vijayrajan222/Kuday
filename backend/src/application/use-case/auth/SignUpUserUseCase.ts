import type { UserEntity } from "../../../domain/entities/UserEntity.js";
import { MongoUserRepository } from "../../../infrastructure/repository/MongoUserRepository.js";
import type { SignUpUserRequestDto, SignUpUserResultDTO } from "../../dto/auth/SignUpDTO.js";
import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";
import type { IHashingService } from "../../interfaces/services/IhashingService.js";
import type { ISignUpUserUsercase } from "../../interfaces/use-case/auth/ISignUpUserUsecase.js";


/**
 * this class is to implement interface of the signupUserUsecase. 
 * this exicutes the fucntion to verify the user data call the user repo
 * and save the user data.
 */
export  class SignUpUserUseCase implements ISignUpUserUsercase{
    private _userRepo : IUserRepository
    private _hashService : IHashingService
    constructor(userRepo : IUserRepository,hashServ : IHashingService){ 
        this._userRepo = userRepo
        this._hashService = hashServ;
    }


    async execute(dto: SignUpUserRequestDto): Promise<SignUpUserResultDTO> {
        
    if(dto.ConfirmPassword!==dto.Password) throw new Error(" The passwords do not match. ")
    const hashedPassword = await this._hashService.hash(dto.Password)
    
    

        const newUser : Omit<UserEntity, "id">  = {
            firstName : dto.firstName,
            lastName : dto.lastName,
            email : dto.email,
            isVerified : false,
            isBlocked : false,
            hashedPassword : hashedPassword 
        }


        let savedUser =  await this._userRepo.save(newUser)
        return {id :savedUser.id, email:savedUser.email}

    }
   
}