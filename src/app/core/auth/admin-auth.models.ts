export const AUTHORIZED_ADMIN_USER_ID = 'c50fb5e1-4978-4d35-a08d-08d93abfe38a';

export type AdminAuthErrorCode = 'invalid-credentials' | 'unauthorized' | 'unavailable';

export type AdminAuthResult = { ok: true } | { ok: false; code: AdminAuthErrorCode };
