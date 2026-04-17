/** Canonical site origin (no trailing slash). */
export const SITE_URL = "https://porcelainclaire.com";

export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}
