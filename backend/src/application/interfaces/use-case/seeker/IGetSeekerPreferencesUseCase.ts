import type { SeekerPreferenceWithUserDto } from "@application/dto/seeker/GetSeekerResponseDto";

export interface IGetSeekerPreferencesUseCase {
    execute(hostUserId?: string): Promise<SeekerPreferenceWithUserDto[]>;
}
