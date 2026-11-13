import type { IUserRepository } from "@application/interfaces/repository/IUserRepository.js";
import type { ISubscriptionRepository } from "@application/interfaces/repository/ISubscriptionRepository.js";
import type { IPremiumHookService } from "@application/interfaces/services/IPremiumHookService.js";

export class PremiumHookService implements IPremiumHookService {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly subRepo: ISubscriptionRepository
    ) {}

    /**
     * Rule 8 & 9:
     * Checks if a host is currently active premium.
     * Criteria:
     * 1. User must currently be in the 'host' role.
     * 2. If user switched to 'seeker', the subscription is dormant (returns false).
     *    It applies again if they switch back to 'host'.
     * 3. Has an active subscription with endDate in the future (endDate > now).
     */
    async isHostPremium(hostId: string): Promise<boolean> {
        const user = await this.userRepo.findById(hostId);
        if (!user || user.role !== "host") {
            return false;
        }

        const activeSub = await this.subRepo.findActiveByUserId(hostId);
        if (!activeSub || activeSub.status !== "active" || !activeSub.endDate) {
            return false;
        }

        return new Date(activeSub.endDate) > new Date();
    }

    /**
     * Rule 8: Hook for future video call & agreement feature:
     * Marks premium benefits as used on the host's active subscription if currently null.
     * Once set, refunds become ineligible.
     */
    async markPremiumBenefitsUsed(hostId: string): Promise<boolean> {
        const activeSub = await this.subRepo.findActiveByUserId(hostId);
        if (!activeSub || activeSub.status !== "active") {
            return false;
        }

        if (activeSub.benefitsUsedAt !== null && activeSub.benefitsUsedAt !== undefined) {
            return true; // Already marked
        }

        return this.subRepo.markBenefitsUsed(activeSub.id);
    }
}
