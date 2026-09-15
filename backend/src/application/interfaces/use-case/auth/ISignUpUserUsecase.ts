/**
 * DTO is data transfer object 
 * we wrote every related types dto into another file in application itself and written the interface used in that or reseaved after that fucntion exicution 
 * and here we wirte the methord that uses the interface 
 * we are using exicute for being uniform we use like run
 * 
 * we write the interfaces as a part of dependancy inverrtion such a way that a class should not depend onn its 
 */

import type { SignUpUserRequestDto, SignUpUserResultDTO } from "../../../dto/auth/SignUpDTO.js";

/**
 * This interface is used to define the use case class
 * which handles verifying the user data that gets 
 * and call the user repository to save data 
 */
export interface ISignUpUserUsercase{
 execute(dto:SignUpUserRequestDto) : Promise<SignUpUserResultDTO>
}

