const ALPH = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function encodeBase62(num: number): string {
  if (num === 0) return ALPH[0];

  let s = '';
  while (num > 0) {
    s = ALPH[num % 62] + s;
    num = Math.floor(num / 62);
  }
  return s;
}
