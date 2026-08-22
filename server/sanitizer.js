import crypto from 'crypto';

// Strict list of excluded curse words, profanities, and slurs (evaluated strictly with word boundaries)
const EXCLUDED_WORDS = [
  'fuck', 'fucking', 'fucker', 'fuk', 'fck',
  'shit', 'shitty', 'shite', 'bullshit',
  'asshole', 'bitch', 'bitches', 'bitching',
  'bastard', 'cunt', 'dick', 'dildo', 'pussy',
  'cock', 'cocksucker', 'slut', 'whore', 'twat',
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded',
  'chink', 'spic', 'kike', 'porn', 'porno', 'xxx',
  'blowjob', 'handjob', 'jerkoff', 'wanker', 'motherfucker'
];

// Check if a string contains any excluded curse words using STRICT word-boundary matching ONLY.
// Avoids false positives on academic terms like "cumulative", "sexual reproduction", "assessment", "Sussex", etc.
export function containsProfanity(text) {
  if (typeof text !== 'string' || !text.trim()) return false;

  // Normalize: lower-case and normalize common leetspeak substitutions
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

  // Strict word-boundary matching ONLY
  for (const word of EXCLUDED_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(normalized)) {
      return true;
    }
  }

  return false;
}

// Clean and sanitize text without double HTML-escaping.
// React natively prevents DOM XSS by escaping text nodes.
// We strip null bytes, control characters, and dangerous URI protocols.
export function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '') // remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove invisible ASCII control chars
    .replace(/javascript:/gi, '') // strip malicious URI schemes
    .replace(/data:text\/html/gi, '')
    .trim();
}

// Cryptographically secure 6-character room code generator
const ROOM_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes 0, O, 1, I to avoid confusion

export function generateRoomCode() {
  const bytes = crypto.randomBytes(6);
  let result = '';
  for (let i = 0; i < 6; i++) {
    const index = bytes[i] % ROOM_CODE_CHARSET.length;
    result += ROOM_CODE_CHARSET[index];
  }
  return result;
}

// Cryptographically signed anonymous session token management
export function createSignedSessionToken(secret) {
  const rawId = 'anon_' + crypto.randomBytes(16).toString('hex');
  const hmac = crypto.createHmac('sha256', secret).update(rawId).digest('hex');
  return `${rawId}.${hmac}`;
}

export function verifySignedSessionToken(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [rawId, receivedHmac] = token.split('.');
  if (!rawId || !receivedHmac) return null;

  const expectedHmac = crypto.createHmac('sha256', secret).update(rawId).digest('hex');
  try {
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(receivedHmac, 'hex'),
      Buffer.from(expectedHmac, 'hex')
    );
    return isMatch ? rawId : null;
  } catch (e) {
    return null;
  }
}

// Multi-layer sliding window rate limiter combining Session Token + Client IP
class MultiLayerRateLimiter {
  constructor(windowMs = 60000, maxRequests = 20, maxIpRequests = 40) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.maxIpRequests = maxIpRequests;
    this.sessionStore = new Map(); // sessionId -> [timestamps]
    this.ipStore = new Map();      // ip -> [timestamps]

    // Periodic cleanup every 5 minutes
    setInterval(() => {
      const now = Date.now();
      this.cleanup(this.sessionStore, now);
      this.cleanup(this.ipStore, now);
    }, 300000);
  }

  cleanup(store, now) {
    for (const [key, timestamps] of store.entries()) {
      const valid = timestamps.filter(ts => now - ts < this.windowMs);
      if (valid.length === 0) {
        store.delete(key);
      } else {
        store.set(key, valid);
      }
    }
  }

  isAllowed(sessionId, ip) {
    const now = Date.now();

    // 1. Check IP-level bucket first (prevents resetting counter by rotating session IDs)
    if (ip) {
      const ipTimestamps = (this.ipStore.get(ip) || []).filter(ts => now - ts < this.windowMs);
      if (ipTimestamps.length >= this.maxIpRequests) {
        return false;
      }
      ipTimestamps.push(now);
      this.ipStore.set(ip, ipTimestamps);
    }

    // 2. Check Session-level bucket
    if (sessionId) {
      const sessionTimestamps = (this.sessionStore.get(sessionId) || []).filter(ts => now - ts < this.windowMs);
      if (sessionTimestamps.length >= this.maxRequests) {
        return false;
      }
      sessionTimestamps.push(now);
      this.sessionStore.set(sessionId, sessionTimestamps);
    }

    return true;
  }
}

export const uploadRateLimiter = new MultiLayerRateLimiter(60000, 10, 25); // 10 uploads/min per session, 25/min per IP
export const voteRateLimiter = new MultiLayerRateLimiter(60000, 30, 60);     // 30 votes/min per session, 60/min per IP
export const roomJoinRateLimiter = new MultiLayerRateLimiter(60000, 20, 50); // 20 room creates/joins per min
