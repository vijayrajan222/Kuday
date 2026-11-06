import type { ToggleBlockUserResultDto } from "@application/dto/admin/ToggleBlockUserDto";

export interface IToggleBlockUserUseCase {
    execute(userId: string): Promise<ToggleBlockUserResultDto>;
}
