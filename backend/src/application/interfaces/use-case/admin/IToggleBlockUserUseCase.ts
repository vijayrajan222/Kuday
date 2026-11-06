import type { ToggleBlockUserResultDto } from "@application/dto/admin/ToggleBlockUserDto.js";

export interface IToggleBlockUserUseCase {
    execute(userId: string): Promise<ToggleBlockUserResultDto>;
}
