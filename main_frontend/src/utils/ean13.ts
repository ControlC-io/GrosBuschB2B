const L_PATTERNS = [
  '0001101',
  '0011001',
  '0010011',
  '0111101',
  '0100011',
  '0110001',
  '0101111',
  '0111011',
  '0110111',
  '0001011',
] as const;

const G_PATTERNS = [
  '0100111',
  '0110011',
  '0011011',
  '0100001',
  '0011101',
  '0111001',
  '0000101',
  '0010001',
  '0001001',
  '0010111',
] as const;

const R_PATTERNS = [
  '1110010',
  '1100110',
  '1101100',
  '1000010',
  '1011100',
  '1001110',
  '1010000',
  '1000100',
  '1001000',
  '1110100',
] as const;

const LEFT_PARITY = [
  'LLLLLL',
  'LLGLGG',
  'LLGGLG',
  'LLGGGL',
  'LGLLGG',
  'LGGLLG',
  'LGGGLL',
  'LGLGLG',
  'LGLGGL',
  'LGGLGL',
] as const;

const ean13CheckDigit = (digits12: string): string => {
  let sum = 0;
  for (let index = 0; index < 12; index += 1) {
    sum += Number(digits12[index]) * (index % 2 === 0 ? 1 : 3);
  }
  return String((10 - (sum % 10)) % 10);
};

export const isValidEan13 = (value: string): boolean => {
  if (!/^\d{13}$/.test(value)) return false;
  return ean13CheckDigit(value.slice(0, 12)) === value[12];
};

/** Encodes an EAN 13 as a binary string of bar (1) and space (0) modules. */
export const encodeEan13 = (gtin: string): string | null => {
  if (!isValidEan13(gtin)) return null;

  const digits = [...gtin].map(Number);
  const parity = LEFT_PARITY[digits[0]];
  const left = digits.slice(1, 7);
  const right = digits.slice(7, 13);

  const leftBits = left
    .map((digit, index) => (parity[index] === 'L' ? L_PATTERNS[digit] : G_PATTERNS[digit]))
    .join('');
  const rightBits = right.map((digit) => R_PATTERNS[digit]).join('');

  return `101${leftBits}01010${rightBits}101`;
};
