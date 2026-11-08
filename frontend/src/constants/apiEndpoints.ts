export const API_ENDPOINTS = {
  AUTH: {
    SIGN_UP: '/auth/signUp',
    LOGIN: '/auth/login',
    GOOGLE: '/auth/google',
    VERIFY_OTP: '/auth/verify-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_RESET_OTP: '/auth/verify-reset-otp',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    RESEND_OTP: '/auth/resend-otp',
  },
  USER: {
    UPDATE_PROFILE: (userId: string) => `/users/${userId}/profile`,
    UPDATE_ROLE: (userId: string) => `/users/${userId}/role`,
    UPLOAD_IDENTITY: (userId: string) => `/users/${userId}/identity`,
    CHANGE_PASSWORD: (userId: string) => `/users/${userId}/change-password`,
    GET_USER: (userId: string) => `/users/${userId}`,
    GET_PUBLIC_PROFILE: (userId: string, viewerId?: string) =>
      viewerId ? `/users/${userId}/public-profile?viewerId=${viewerId}` : `/users/${userId}/public-profile`,
  },
  LIFESTYLE: {
    SAVE: '/lifestyles',
    GET: (userId: string) => `/lifestyles/${userId}`,
  },
  ROOM: {
    CREATE: '/rooms',
    GET_ALL: '/rooms',
    GET_BY_ID: (id: string, userId?: string) =>
      userId ? `/rooms/${id}?userId=${userId}` : `/rooms/${id}`,
  },
  SEEKER: {
    SAVE_PREFERENCES: '/seeker-preferences',
    GET_ALL: '/seeker-preferences',
  },
  NOTIFICATION: {
    GET: (userId: string) => `/notifications/${userId}`,
    CREATE: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: (userId: string) => `/notifications/${userId}/read-all`,
  },
  INTEREST: {
    SEND: '/interests',
    UPDATE_STATUS: (id: string) => `/interests/${id}/status`,
    RECEIVED: (userId: string) => `/interests/received/${userId}`,
    SENT: (userId: string) => `/interests/sent/${userId}`,
  },
  ADMIN: {
    LOGIN: '/admin/login',
    STATS: '/admin/stats',
    USERS: '/admin/users',
    VERIFY_IDENTITY: (userId: string) => `/admin/users/${userId}/verify-identity`,
    TOGGLE_BLOCK: (userId: string) => `/admin/users/${userId}/toggle-block`,
  },
} as const;
