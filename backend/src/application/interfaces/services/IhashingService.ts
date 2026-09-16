/**
 * this interface defines the service for converting the passwords string 
 * to hashes and also compare the string with the hashes
 */
export interface IHashingService{
    hash(input:string):Promise<string>
    compareHashes(hashedValue:string,savedHash:string):Promise<boolean>
}