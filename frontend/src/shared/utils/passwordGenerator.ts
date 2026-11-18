/**
 * Password Generator for temporary user accounts.
 * Produces memorable, secure temporary passwords adhering to:
 * - Minimum 8-12 chars
 * - Uppercase + Lowercase
 * - Digits
 * - Symbol
 * - Pronounceable / Friendly
 */
const WORDS = [
  'Brotar',
  'Verde',
  'Amazonia',
  'Andes',
  'Savia',
  'Kantuta',
  'Roble',
  'Flora',
  'Bosque',
  'Semilla',
  'Clima',
  'Eco',
  'Valle',
  'Pampa',
  'Colina',
  'Brisa',
  'Solar',
  'Tierra',
  'Madre',
  'Naturaleza',
];

const SYMBOLS = ['!', '@', '#', '$', '*', '%'];

export function generateTemporaryPassword(): string {
  const word1 = WORDS[Math.floor(Math.random() * WORDS.length)];
  const num = Math.floor(100 + Math.random() * 900); // 3-digit number (100 - 999)
  const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

  return `${word1}-${num}${symbol}`;
}
