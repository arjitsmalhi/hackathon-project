// Input sanitization, profanity filter, rate limiting, and room code generator

// List of excluded curse words, profanities, and offensive terms
const EXCLUDED_WORDS = [
  'fuck', 'fucking', 'fucker', 'fuk', 'fck',
  'shit', 'shitty', 'shite', 'bullshit',
  'asshole', 'bitch', 'bitches', 'bitching',
  'bastard', 'cunt', 'dick', 'dildo', 'pussy',
  'cock', 'cocksucker', 'slut', 'whore', 'twat',
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded',
  'chink', 'spic', 'kike', 'porn', 'porno', 'xxx',
  'sex', 'nude', 'nudes', 'anal', 'blowjob', 'handjob',
  'cum', 'cumshot', 'jerkoff', 'wanker', 'motherfucker'
];

// Check if a string contains any excluded curse/profanity words
export function containsProfanity(text) {
  if (typeof text !== 'string' || !text.trim()) return false;

  // Normalize: lower-case, collapse repeated leetspeak/symbols (@ -> a, $ -> s, 1 -> i/l, 0 -> o, etc.)
  const normalized = text
    .toLowerCase()
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/!/g, 'i');

  // Check using word boundary regex for each excluded word
  for (const word of EXCLUDED_WORDS) {
    // Word boundary regex or direct substring if word is complex
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(normalized) || normalized.includes(word)) {
      return true;
    }
  }

  return false;
}

// Strip HTML tags and encode dangerous entities to prevent Stored XSS
export function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// Generate an unambiguous, non-guessable 6-character alphanumeric room code (e.g., KX9F2Q)
const ROOM_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes 0, O, 1, I to avoid confusion

export function generateRoomCode() {
  let result = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_CHARSET.length);
    result += ROOM_CODE_CHARSET[randomIndex];
  }
  return result;
}

// In-memory sliding window rate limiter
class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 20) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.clients = new Map(); // key -> [timestamps]

    // Periodic cleanup every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, timestamps] of this.clients.entries()) {
        const valid = timestamps.filter(ts => now - ts < this.windowMs);
        if (valid.length === 0) {
          this.clients.delete(key);
        } else {
          this.clients.set(key, valid);
        }
      }
    }, 300000);
  }

  isAllowed(key) {
    const now = Date.now();
    const timestamps = this.clients.get(key) || [];
    const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);

    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }

    validTimestamps.push(now);
    this.clients.set(key, validTimestamps);
    return true;
  }
}

export const uploadRateLimiter = new RateLimiter(60000, 10); // 10 uploads per min per session
export const voteRateLimiter = new RateLimiter(60000, 30);   // 30 votes per min per session
export const roomJoinRateLimiter = new RateLimiter(60000, 20); // 20 room attempts per min per session
