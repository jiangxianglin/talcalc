/** Blizzard render CDN — numeric icon file IDs from the client export. */
export function talentIconUrl(iconId: string | number, size: 56 | 36 = 56): string {
  return `https://render.worldofwarcraft.com/us/icons/${size}/${iconId}.jpg`;
}

/** Local class icons (classicon_* from client/CDN, mirrored under public/). */
export function classIconUrl(slug: string): string {
  return `/icons/classes/${slug}.jpg`;
}
