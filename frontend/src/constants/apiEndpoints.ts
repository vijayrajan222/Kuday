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
} as const;
