export interface IJwtService{
    generateToken(payload:{userId:string;email:string}):string;
}