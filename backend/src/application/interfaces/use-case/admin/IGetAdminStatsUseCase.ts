import type { AdminStatsResultDto } from "@application/dto/admin/AdminStatsDto.js";

export interface IGetAdminStatsUseCase {
    execute(): Promise<AdminStatsResultDto>;
}
