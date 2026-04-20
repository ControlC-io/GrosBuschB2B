/**
 * Temporary session state for the 2FA / Email OTP login flow.
 * Used between LoginForm → TwoFactorChallenge → (optional) EmailOtpChallenge.
 * All keys are cleared once the user is fully authenticated or abandons the flow.
 */

export const PENDING_2FA_EMAIL_KEY = 'pending_2fa_email';
export const PENDING_EMAIL_OTP_USER_ID_KEY = 'pending_email_otp_user_id';
const API_BEARER_TOKEN_KEY = 'api_bearer_token';

export const getPending2FAEmail = (): string | null =>
  sessionStorage.getItem(PENDING_2FA_EMAIL_KEY);

export const setPending2FAEmail = (email: string): void =>
  sessionStorage.setItem(PENDING_2FA_EMAIL_KEY, email);

export const clearPending2FAEmail = (): void =>
  sessionStorage.removeItem(PENDING_2FA_EMAIL_KEY);

export const getPendingEmailOtpUserId = (): string | null =>
  sessionStorage.getItem(PENDING_EMAIL_OTP_USER_ID_KEY);

export const setPendingEmailOtpUserId = (userId: string): void =>
  sessionStorage.setItem(PENDING_EMAIL_OTP_USER_ID_KEY, userId);

export const clearPendingEmailOtpUserId = (): void =>
  sessionStorage.removeItem(PENDING_EMAIL_OTP_USER_ID_KEY);

/** Clear all pending 2FA/OTP state (e.g. after successful login or when leaving the flow). */
export const clearPendingAuthState = (): void => {
  sessionStorage.removeItem(PENDING_2FA_EMAIL_KEY);
  sessionStorage.removeItem(PENDING_EMAIL_OTP_USER_ID_KEY);
};

export const getApiBearerToken = (): string | null =>
  window.localStorage.getItem(API_BEARER_TOKEN_KEY);

export const setApiBearerToken = (token: string): void =>
  window.localStorage.setItem(API_BEARER_TOKEN_KEY, token);

export const clearApiBearerToken = (): void =>
  window.localStorage.removeItem(API_BEARER_TOKEN_KEY);

/**
 * Generic getter used by the API client to retrieve the current Bearer token.
 * This allows us to swap the storage strategy later without touching the HTTP layer.
 * In development you can set VITE_API_BEARER_TOKEN to override localStorage.
 */
export const getToken = (): string | null =>
  (import.meta as any).env?.VITE_API_BEARER_TOKEN ?? getApiBearerToken();
