export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'host' | 'seeker' | 'admin' | 'none';
  identityVerified: boolean;
  identityStatus: 'pending' | 'verified' | 'rejected' | 'none';
  rejectionReason?: string;
  selfieUrl?: string;
  idCardUrl?: string;
  isBlocked: boolean;
  isAdmin: boolean;
}

export interface AdminStats {
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

export interface AdminAuthResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isAdmin: boolean;
  token: string;
}

export interface AdminAuthResponse {
  success: boolean;
  data: AdminAuthResult;
  message?: string;
}

export interface AdminStatsResponse {
  success: boolean;
  data: AdminStats;
}

export interface AdminUsersResponse {
  success: boolean;
  data: AdminUser[];
}
