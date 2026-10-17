import LZString from 'lz-string';

export function compressUri(input: string): string {
  return LZString.compressToEncodedURIComponent(input);
}

export function decompressUri(input: string): string | null {
  return LZString.decompressFromEncodedURIComponent(input);
}
