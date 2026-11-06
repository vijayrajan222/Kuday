import type { AdminLoginRequestDto, AdminLoginResultDto } from "@application/dto/admin/AdminLoginDto";

export interface IAdminLoginUseCase {
    execute(input: AdminLoginRequestDto): Promise<AdminLoginResultDto>;
}
