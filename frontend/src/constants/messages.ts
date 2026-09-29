export const MESSAGES = {
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  NETWORK_ERROR: 'Cannot reach the server. Check your connection and try again.',
  SIGNUP_SUCCESS: 'Account created! We sent a 6-digit code to your email.',
  OTP_SUCCESS: 'Email verified. Welcome to KUDAY!',
  OTP_RESENT: 'A new code is on its way to your inbox.',
  OTP_INCOMPLETE: 'Enter the 6-digit code.',
  OTP_NO_TOKEN: 'Verification succeeded but no session was returned. Please try again.',
  LOGIN_SUCCESS: 'Logged in successfully!',
  LOGOUT_SUCCESS: 'You have been signed out.',
} as const;
