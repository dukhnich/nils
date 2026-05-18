const CYRILLIC = /[Ѐ-ӿ]/;

export function isCyrillic(text: string): boolean {
  return CYRILLIC.test(text);
}
