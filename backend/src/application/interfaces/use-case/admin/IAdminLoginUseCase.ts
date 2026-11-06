import type { AdminLoginRequestDto, AdminLoginResultDto } from "@application/dto/admin/AdminLoginDto.js";

export interface IAdminLoginUseCase {
    execute(input: AdminLoginRequestDto): Promise<AdminLoginResultDto>;
}
