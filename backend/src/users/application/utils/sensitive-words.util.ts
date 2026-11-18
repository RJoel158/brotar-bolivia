import BadWordsNext from 'bad-words-next';
import esDictionary from 'bad-words-next/lib/es';

const filter = new BadWordsNext({ data: esDictionary });

// Complement with sexual/anatomical and Latin American profanity dictionary
filter.add({
  id: 'latin_sensitive',
  words: [
    'pene*',
    '*pene',
    'pene',
    'vagina*',
    '*vagina',
    'vagina',
    'verga*',
    '*verga',
    'verga',
    'chota*',
    '*chota',
    'chota',
    'pito*',
    '*pito',
    'concha*',
    '*concha',
    'culo*',
    '*culo',
    'tetas*',
    '*tetas',
    'maricon*',
    'marica*',
    'zorra*',
    'chingar*',
    'chinga*',
    'puto*',
    'puta*',
    'mierda*',
    'carajo*',
    'pendejo*',
    'pendeja*',
    'culiao*',
    'dick*',
    'cock*',
    'pussy*',
    'asshole*',
    'bitch*',
  ],
  lookalike: {},
});

export function containsSensitiveWords(text: string): boolean {
  if (!text) return false;

  // 1. Check with bad-words-next engine (handles leetspeak, accents, lookalikes)
  if (filter.check(text)) {
    return true;
  }

  // 2. Normalize and check again
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();

  return filter.check(normalized);
}
