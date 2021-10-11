export function classes(...names: string[]): string {
  return names.filter(Boolean).join(' ');
}

export function isGif(image: HTMLImageElement): boolean {
  const url = new URL(image.src);
  return url.pathname.endsWith('.gif');
}
