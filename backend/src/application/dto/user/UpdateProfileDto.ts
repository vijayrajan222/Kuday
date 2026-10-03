export interface UpdateProfileDto {
    userId: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    dob?: string | undefined;
    gender?: string | undefined;
    occupation?: string | undefined;
    bio?: string | undefined;
    selfieUrl?: string | undefined;
    selfieBase64?: string | undefined;
}