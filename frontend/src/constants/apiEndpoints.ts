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
    GET_USER: (userId: string) => `/users/${userId}`,
  },
  LIFESTYLE: {
    SAVE: '/lifestyles',
    GET: (userId: string) => `/lifestyles/${userId}`,
  },
  ROOM: {
    CREATE: '/rooms',
    GET_ALL: '/rooms',
  },
  SEEKER: {
    SAVE_PREFERENCES: '/seeker-preferences',
    GET_ALL: '/seeker-preferences',
  },
} as const;
