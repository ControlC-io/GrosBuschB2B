const normalizeBase = (value: string): string => value.replace(/\/+$/, '');

export const getAdminApiBase = (): string => {
  const raw = (import.meta.env.VITE_API_URL || '').trim();

  if (!raw) {
    return '';
  }

  // In Docker compose, backend is exposed via nginx, not host :3000.
  // Falling back to same origin avoids ERR_CONNECTION_REFUSED from browser.
  if (/^https?:\/\/(localhost|127\.0\.0\.1):3000$/i.test(raw)) {
    return '';
  }

  return normalizeBase(raw);
};

