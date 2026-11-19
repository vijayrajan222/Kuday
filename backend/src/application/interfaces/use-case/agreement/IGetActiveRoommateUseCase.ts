import type { ActiveRoommateResponseDto } from "@application/dto/agreement/ActiveRoommateDto";

export interface IGetActiveRoommateUseCase {
    execute(userId: string): Promise<ActiveRoommateResponseDto | ActiveRoommateResponseDto[] | null>;
}
