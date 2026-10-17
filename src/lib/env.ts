/** Public runtime config — read outside .astro frontmatter to avoid Vite transform bugs. */
export const CF_BEACON_TOKEN: string =
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.PUBLIC_CF_BEACON) ||
  '';
