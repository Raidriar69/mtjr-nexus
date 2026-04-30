/**
 * Verification code utilities for manual PayPal payments.
 *
 * generateVerificationCode()  → "couch – tiger – lamp – rocket"
 * generateInvoiceId()         → "INV-A3B2C1D4"
 */

// ~250 common, unambiguous 4-6 letter English words
const WORDS: readonly string[] = [
  'apple', 'arrow', 'atlas', 'badge', 'blast', 'blade', 'blaze', 'block',
  'brave', 'brick', 'bride', 'brush', 'cabin', 'cable', 'camel', 'candy',
  'cargo', 'cedar', 'chain', 'chalk', 'chase', 'chest', 'chief', 'clamp',
  'clash', 'clean', 'cliff', 'clock', 'cloud', 'coach', 'coast', 'cobra',
  'comet', 'coral', 'couch', 'crank', 'crane', 'creek', 'crisp', 'cross',
  'crown', 'crush', 'cubic', 'curve', 'cycle', 'delta', 'depot', 'derby',
  'draft', 'drain', 'drape', 'drift', 'drive', 'dwarf', 'eagle', 'earth',
  'elder', 'ember', 'epoch', 'exact', 'fable', 'faith', 'fancy', 'feast',
  'fence', 'ferry', 'field', 'finch', 'flame', 'flash', 'fleet', 'flint',
  'flood', 'floor', 'floss', 'fluid', 'focus', 'force', 'forge', 'forte',
  'frame', 'frank', 'frost', 'fruit', 'ghost', 'giant', 'glade', 'gleam',
  'glide', 'globe', 'gloss', 'glove', 'grace', 'grade', 'grain', 'grape',
  'grasp', 'grass', 'grave', 'graze', 'green', 'greet', 'grind', 'groan',
  'grove', 'guard', 'guide', 'guild', 'habit', 'hatch', 'haven', 'heart',
  'heavy', 'hedge', 'hinge', 'honey', 'honor', 'horse', 'hotel', 'hound',
  'hover', 'humor', 'hyper', 'image', 'index', 'inner', 'ivory', 'joker',
  'kayak', 'knife', 'knoll', 'label', 'lance', 'laser', 'latch', 'layer',
  'ledge', 'legal', 'lemon', 'level', 'light', 'limit', 'linen', 'local',
  'lodge', 'logic', 'loyal', 'lucky', 'lunar', 'maize', 'major', 'maker',
  'maple', 'march', 'match', 'merit', 'metal', 'model', 'month', 'mount',
  'mouse', 'music', 'nerve', 'night', 'noble', 'noise', 'north', 'notch',
  'novel', 'nurse', 'ocean', 'onion', 'orbit', 'otter', 'outer', 'oxide',
  'ozone', 'paint', 'panel', 'pasta', 'pearl', 'phase', 'phone', 'photo',
  'pilot', 'pitch', 'pixel', 'pivot', 'plain', 'plank', 'plate', 'plaza',
  'plume', 'plush', 'polar', 'porch', 'power', 'press', 'prime', 'prism',
  'prize', 'proof', 'prose', 'proud', 'proxy', 'pulse', 'punch', 'purse',
  'queen', 'quest', 'quick', 'quiet', 'quota', 'radar', 'radio', 'raise',
  'rally', 'ranch', 'range', 'rapid', 'raven', 'realm', 'rebel', 'relay',
  'remix', 'ridge', 'rivet', 'robot', 'rocky', 'roost', 'rough', 'round',
  'royal', 'ruler', 'rusty', 'sabre', 'sandy', 'savvy', 'scale', 'scene',
  'scout', 'sense', 'serve', 'setup', 'shaft', 'shake', 'shape', 'share',
  'shark', 'sharp', 'shelf', 'shell', 'shift', 'shine', 'shock', 'sight',
  'sigma', 'skate', 'skunk', 'slate', 'sleep', 'slice', 'slide', 'slope',
  'smart', 'smash', 'snake', 'solar', 'solve', 'sonic', 'south', 'space',
  'spark', 'spawn', 'speed', 'spice', 'spike', 'spine', 'sport', 'spray',
  'squad', 'stack', 'staff', 'stage', 'stake', 'stand', 'stark', 'start',
  'steam', 'steel', 'steep', 'stern', 'stick', 'sting', 'stock', 'stone',
  'storm', 'story', 'strap', 'strip', 'study', 'style', 'sugar', 'suite',
  'surge', 'swamp', 'sweep', 'swift', 'swing', 'sword', 'tally', 'talon',
  'tango', 'tempo', 'theme', 'thick', 'thorn', 'tiger', 'timer', 'toast',
  'token', 'total', 'touch', 'tower', 'track', 'trade', 'trail', 'train',
  'treat', 'trend', 'trial', 'trick', 'troop', 'trout', 'truck', 'trunk',
  'trust', 'turbo', 'twist', 'ultra', 'under', 'upper', 'valid', 'value',
  'vault', 'verge', 'verse', 'video', 'vigor', 'viral', 'vista', 'vivid',
  'voice', 'voter', 'wafer', 'waltz', 'wedge', 'whale', 'wheat', 'wheel',
  'white', 'whole', 'witch', 'world', 'worth', 'wrath', 'yacht', 'yield',
  'young', 'youth', 'zebra', 'zesty', 'zippy', 'blank', 'bloom', 'blunt',
  'bound', 'boxer', 'brace', 'brand', 'break', 'breed', 'brief', 'bring',
  'brisk', 'build', 'burst', 'buyer', 'cairn', 'carry', 'catch', 'cause',
  'cover', 'craft', 'cream', 'creed', 'crimp', 'crisp', 'place', 'plain',
  'plaid', 'pilot', 'pivot', 'pluck', 'point', 'poise', 'pound', 'prawn',
] as const;

/** Pick 4 unique random words, joined with " – " */
export function generateVerificationCode(): string {
  const pool = [...WORDS];
  const chosen: string[] = [];
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    chosen.push(pool[idx]);
    pool.splice(idx, 1); // remove to avoid duplicates
  }
  return chosen.join(' – '); // en-dash with spaces
}

const ALPHANUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I confusion

/** Generate an invoice ID like INV-A3B2C1D4 */
export function generateInvoiceId(): string {
  let id = 'INV-';
  for (let i = 0; i < 8; i++) {
    id += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)];
  }
  return id;
}
