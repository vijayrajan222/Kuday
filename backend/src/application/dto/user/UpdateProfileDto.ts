export interface UpdateProfileDto {
    userId: string;
    dob?: string | undefined;
    gender?: string | undefined;
    occupation?: string | undefined;
    bio?: string | undefined;
}