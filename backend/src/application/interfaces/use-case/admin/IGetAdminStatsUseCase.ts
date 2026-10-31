import type { AdminStatsResultDto } from "../../../dto/admin/AdminStatsDto.js";

export interface IGetAdminStatsUseCase {
    execute(): Promise<AdminStatsResultDto>;
}
