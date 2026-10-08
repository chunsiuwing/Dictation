// Phonics blending module - breaks words into syllables and phonics chunks for HK primary students
// Uses common English graphemes (letter patterns) to split words into blendable parts

const PHONICS_GRAPHEMES = [
  // Trigraphs (3 letters)
  'igh', 'tch', 'dge', 'ear', 'air', 'ure',
  // Digraphs (2 letters) - vowels
  'ai', 'ay', 'ee', 'ea', 'oa', 'oo', 'ou', 'ow', 'oi', 'oy',
  'ar', 'er', 'ir', 'or', 'ur', 'au', 'aw', 'ew', 'ui', 'ue',
  // Digraphs (2 letters) - consonants
  'sh', 'ch', 'th', 'wh', 'ph', 'ck', 'ng', 'nk', 'gh',
  // Common endings
  'ing', 'ed', 'er', 'est', 'ly', 'es', 's',
];

// Grapheme to phonetic sound mapping for letter sounds
const GRAPHEME_SOUNDS = {
  // Single letters - short sounds
  'a': 'æ', 'e': 'ɛ', 'i': 'ɪ', 'o': 'ɒ', 'u': 'ʌ',
  'b': 'b', 'c': 'k', 'd': 'd', 'f': 'f', 'g': 'g',
  'h': 'h', 'j': 'dʒ', 'k': 'k', 'l': 'l', 'm': 'm',
  'n': 'n', 'p': 'p', 'q': 'kw', 'r': 'r', 's': 's',
  't': 't', 'v': 'v', 'w': 'w', 'x': 'ks', 'y': 'j', 'z': 'z',
  // Vowel digraphs
  'ai': 'eɪ', 'ay': 'eɪ', 'ee': 'iː', 'ea': 'iː',
  'oa': 'oʊ', 'oo': 'uː', 'ou': 'aʊ', 'ow': 'aʊ',
  'oi': 'ɔɪ', 'oy': 'ɔɪ', 'ar': 'ɑː', 'er': 'ɜː',
  'ir': 'ɜː', 'or': 'ɔː', 'ur': 'ɜː', 'au': 'ɔː',
  'aw': 'ɔː', 'ew': 'juː', 'ui': 'uː', 'ue': 'juː',
  'igh': 'aɪ', 'ie': 'aɪ', 'ye': 'aɪ',
  // Consonant digraphs
  'sh': 'ʃ', 'ch': 'tʃ', 'th': 'θ', 'wh': 'w',
  'ph': 'f', 'ck': 'k', 'ng': 'ŋ', 'nk': 'ŋk', 'gh': 'g',
  // Common endings
  'ing': 'ɪŋ', 'ed': 'd', 'er': 'ə', 'est': 'ɪst',
  'ly': 'li', 'es': 'ɪz', 's': 'z',
};

// Syllable colors for visual distinction
const SYLLABLE_COLORS = [
  '#4A90D9', // Blue
  '#E74C3C', // Red
  '#27AE60', // Green
  '#F39C12', // Orange
  '#9B59B6', // Purple
  '#1ABC9C', // Teal
  '#E91E63', // Pink
  '#795548', // Brown
];

/**
 * Break a word into phonics chunks for blending
 */
function blendWord(word) {
  const lower = word.toLowerCase();
  const chunks = [];
  let i = 0;

  while (i < lower.length) {
    let matched = false;

    for (const grapheme of PHONICS_GRAPHEMES) {
      if (lower.substring(i, i + grapheme.length) === grapheme) {
        chunks.push(grapheme);
        i += grapheme.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      chunks.push(lower[i]);
      i++;
    }
  }

  return chunks;
}

/**
 * Split a word into syllables
 * Uses vowel groups to identify syllable boundaries
 */
function splitSyllables(word) {
  const lower = word.toLowerCase();
  const syllables = [];
  let currentSyllable = '';
  let i = 0;

  // Find vowel positions
  const vowels = 'aeiouy';
  const vowelPositions = [];
  for (let j = 0; j < lower.length; j++) {
    if (vowels.includes(lower[j])) {
      vowelPositions.push(j);
    }
  }

  if (vowelPositions.length <= 1) {
    return [word];
  }

  // Split between vowel groups
  let lastSplit = 0;
  for (let k = 0; k < vowelPositions.length - 1; k++) {
    const currentVowel = vowelPositions[k];
    const nextVowel = vowelPositions[k + 1];
    const consonantsBetween = nextVowel - currentVowel - 1;

    if (consonantsBetween === 0) {
      // Adjacent vowels - might be a digraph, keep together
      continue;
    } else if (consonantsBetween === 1) {
      // Single consonant - split before it (V/CV)
      const splitPos = currentVowel + 1;
      syllables.push(lower.substring(lastSplit, splitPos));
      lastSplit = splitPos;
    } else if (consonantsBetween === 2) {
      // Two consonants - split between them (VC/CV)
      // But don't split digraphs
      const c1 = lower[currentVowel + 1];
      const c2 = lower[currentVowel + 2];
      const digraph = c1 + c2;
      if (['sh', 'ch', 'th', 'wh', 'ph', 'ck', 'ng', 'nk'].includes(digraph)) {
        // Keep digraph together, split before it
        const splitPos = currentVowel + 1;
        syllables.push(lower.substring(lastSplit, splitPos));
        lastSplit = splitPos;
      } else {
        // Split between the two consonants
        const splitPos = currentVowel + 2;
        syllables.push(lower.substring(lastSplit, splitPos));
        lastSplit = splitPos;
      }
    } else {
      // Three or more consonants - split after first consonant
      const splitPos = currentVowel + 2;
      syllables.push(lower.substring(lastSplit, splitPos));
      lastSplit = splitPos;
    }
  }

  // Add the last syllable
  syllables.push(lower.substring(lastSplit));

  return syllables;
}

/**
 * Get syllables with color information
 */
function getSyllablesWithColors(word) {
  const syllables = splitSyllables(word);
  return syllables.map((syllable, index) => ({
    text: syllable,
    color: SYLLABLE_COLORS[index % SYLLABLE_COLORS.length],
    index: index
  }));
}

/**
 * Get a simple phonetic respelling for display
 */
function getPhonicsDisplay(word) {
  const chunks = blendWord(word);
  return chunks.join('-');
}

/**
 * Get the phonics chunks with type info (vowel/consonant)
 */
function getPhonicsChunks(word) {
  const chunks = blendWord(word);
  return chunks.map(chunk => ({
    text: chunk,
    type: isVowelChunk(chunk) ? 'vowel' : 'consonant',
    sound: GRAPHEME_SOUNDS[chunk.toLowerCase()] || chunk
  }));
}

/**
 * Get the phonetic sound for a grapheme
 */
function getGraphemeSound(grapheme) {
  return GRAPHEME_SOUNDS[grapheme.toLowerCase()] || grapheme;
}

function isVowelChunk(chunk) {
  const vowels = 'aeiou';
  return vowels.includes(chunk[0]) ||
    ['ai', 'ay', 'ee', 'ea', 'oa', 'oo', 'ou', 'ow', 'oi', 'oy',
     'ar', 'er', 'ir', 'or', 'ur', 'au', 'aw', 'ew', 'ui', 'ue', 'igh'].includes(chunk);
}

/**
 * Simple syllable counter
 */
function countSyllables(word) {
  return splitSyllables(word).length;
}
