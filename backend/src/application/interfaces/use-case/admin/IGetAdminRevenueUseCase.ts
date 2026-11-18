import type { AdminRevenueSummaryDto } from "@application/dto/admin/AdminRevenueDto";

export interface IGetAdminRevenueUseCase {
    execute(): Promise<AdminRevenueSummaryDto>;
}
