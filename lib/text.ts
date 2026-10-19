/** Accent-insensitive lowercase text for searches (no String.normalize on Hermes). */
const FOLD: Record<string, string> = {
  à: 'a', â: 'a', ä: 'a', á: 'a', ã: 'a', å: 'a', ç: 'c', é: 'e', è: 'e', ê: 'e', ë: 'e', î: 'i', ï: 'i', í: 'i', ì: 'i',
  ô: 'o', ö: 'o', ó: 'o', ò: 'o', õ: 'o', ù: 'u', û: 'u', ü: 'u', ú: 'u', ÿ: 'y', ñ: 'n', œ: 'oe', æ: 'ae',
  أ: 'ا', إ: 'ا', آ: 'ا', ة: 'ه', ى: 'ي',
};

export function foldText(s: string): string {
  return s.toLowerCase().trim().replace(/[^\u0000-\u007f]/g, (c) => FOLD[c] ?? c);
}
