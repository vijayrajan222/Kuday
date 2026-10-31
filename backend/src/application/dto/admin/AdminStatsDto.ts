export interface AdminStatsResultDto {
    totalUsers: number;
    hostsCount: number;
    seekersCount: number;
    pendingVerifications: number;
    verifiedUsers: number;
    blockedUsers: number;
    activeListings: number;
    totalRevenue: number;
    monthlyRevenue: number;
    revenueBreakdown: {
        listingFees: number;
        subscriptionRevenue: number;
        bookingCommissions: number;
    };
}
