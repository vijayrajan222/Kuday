import type { AdminLoginRequestDto, AdminLoginResultDto } from "../../../dto/admin/AdminLoginDto.js";

export interface IAdminLoginUseCase {
    execute(input: AdminLoginRequestDto): Promise<AdminLoginResultDto>;
}
