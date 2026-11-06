import type { AdminStatsResultDto } from "@application/dto/admin/AdminStatsDto";

export interface IGetAdminStatsUseCase {
    execute(): Promise<AdminStatsResultDto>;
}
