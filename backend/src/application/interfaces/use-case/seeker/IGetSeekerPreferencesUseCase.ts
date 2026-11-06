import type { SeekerPreferenceWithUserDto } from "@application/dto/seeker/GetSeekerResponseDto.js";

export interface IGetSeekerPreferencesUseCase {
    execute(hostUserId?: string): Promise<SeekerPreferenceWithUserDto[]>;
}
