import type { SeekerPreferenceWithUserDto } from "../../../dto/seeker/GetSeekerResponseDto.js";

export interface IGetSeekerPreferencesUseCase {
    execute(hostUserId?: string): Promise<SeekerPreferenceWithUserDto[]>;
}
