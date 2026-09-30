export const API_ENDPOINTS = {
  AUTH: {
    SIGN_UP: '/auth/signUp',
    LOGIN: '/auth/login',
    GOOGLE: '/auth/google',
    VERIFY_OTP: '/auth/verify-otp',
    // NOTE: needs a matching backend route (see notes)
    RESEND_OTP: '/auth/resend-otp',
  },
} as const;
