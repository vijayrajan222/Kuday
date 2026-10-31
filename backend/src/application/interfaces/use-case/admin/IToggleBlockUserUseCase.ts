import type { ToggleBlockUserResultDto } from "../../../dto/admin/ToggleBlockUserDto.js";

export interface IToggleBlockUserUseCase {
    execute(userId: string): Promise<ToggleBlockUserResultDto>;
}
