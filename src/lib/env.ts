/**
 * Public runtime config — read outside .astro frontmatter to avoid Vite transform bugs.
 *
 * The Cloudflare Web Analytics beacon token is public by design (it ships in the HTML for anyone
 * to read), so the live token is a fallback: Pages builds did not pick PUBLIC_CF_BEACON up from the
 * project's deployment_configs, and a missing token silently disables analytics. Override with
 * PUBLIC_CF_BEACON when you re-create the Web Analytics site.
 */
const FALLBACK_CF_BEACON = '9f22aae19f014883ab529ac2195fbc8b';

export const CF_BEACON_TOKEN: string =
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.PUBLIC_CF_BEACON) ||
  FALLBACK_CF_BEACON;
