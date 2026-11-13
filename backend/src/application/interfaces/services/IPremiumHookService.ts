export interface IPremiumHookService {
    isHostPremium(hostId: string): Promise<boolean>;
    markPremiumBenefitsUsed(hostId: string): Promise<boolean>;
}
