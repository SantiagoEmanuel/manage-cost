export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

export const RATE_LIMITS = {
  AUTH: { windowMs: 15 * 60 * 1000, max: 5 },
  GENERAL: { windowMs: 15 * 60 * 1000, max: 100 },
} as const;

export const BCRYPT_ROUNDS = 12;
export const REFRESH_TOKEN_DAYS = 30;
export const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60;
