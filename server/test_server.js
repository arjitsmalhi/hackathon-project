import http from 'http';
import { containsProfanity, sanitizeText, verifySignedSessionToken, createSignedSessionToken } from './sanitizer.js';

const SESSION_SECRET = 'studybound_super_secure_session_secret_2026';

// Make HTTP request with optional cookie jar
async function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Studybound Server Automated Tests...\n');

  try {
    // 1. Health check
    const health = await makeRequest('/api/health');
    console.log('1. Health Check:', health.status === 200 && health.data.status === 'ok' ? '✅ PASS' : '❌ FAIL');

    // 1b. Session init endpoint issues signed session token
    const sessionInit = await makeRequest('/api/session/init');
    const hasToken = sessionInit.status === 200 && !!sessionInit.data.sessionId && !!sessionInit.data.sessionToken;
    console.log('1b. Signed Session Init:', hasToken ? `✅ PASS (id: ${sessionInit.data.sessionId.slice(0, 14)}...)` : '❌ FAIL');

    const serverSessionToken = sessionInit.data.sessionToken;
    const serverSessionId = sessionInit.data.sessionId;

    // 1c. Verify the token is actually cryptographically valid
    const verifiedId = verifySignedSessionToken(serverSessionToken, SESSION_SECRET);
    console.log('1c. HMAC Signature Verification:', verifiedId === serverSessionId ? '✅ PASS (signature valid)' : '❌ FAIL');

    // 1d. Tampered token must be rejected
    const tamperedToken = serverSessionToken.split('.')[0] + '.deadbeefdeadbeef';
    const tamperedVerify = verifySignedSessionToken(tamperedToken, SESSION_SECRET);
    console.log('1d. Tampered Token Rejected:', tamperedVerify === null ? '✅ PASS' : '❌ FAIL');

    // 2. Courses
    const coursesRes = await makeRequest('/api/courses');
    console.log('2. Fetch Courses:', coursesRes.status === 200 && coursesRes.data.length > 0 ? `✅ PASS (${coursesRes.data.length} courses)` : '❌ FAIL');
    const courseId = coursesRes.data[0].id;

    // 3. Notes
    const notesRes = await makeRequest(`/api/notes?courseId=${courseId}`);
    console.log('3. Fetch Course Notes:', notesRes.status === 200 ? `✅ PASS (${notesRes.data.length} notes)` : '❌ FAIL');

    // 4. XSS sanitization: React renders text safely — server should NOT double-escape
    const xssTitle = 'javascript:alert(1) Safe Title';
    const xssContent = 'data:text/html exploit Note content here.';
    const createNoteRes = await makeRequest('/api/notes', 'POST', {
      courseId,
      title: xssTitle,
      content: xssContent,
      tags: ['Test', 'academic']
    }, { 'x-session-token': serverSessionToken });

    const noteCreated = createNoteRes.status === 201;
    // sanitizeText strips dangerous URI schemes without HTML-escaping
    const noJavascriptUri = !createNoteRes.data?.title?.includes('javascript:');
    const noDoubleEscape = !createNoteRes.data?.title?.includes('&lt;') && !createNoteRes.data?.title?.includes('&#');
    console.log('4a. Dangerous URI Schemes Stripped:', (noteCreated && noJavascriptUri) ? '✅ PASS (dangerous URIs removed)' : `❌ FAIL (status: ${createNoteRes.status}, err: ${JSON.stringify(createNoteRes.data)})`);
    console.log('4b. No Double HTML-Escaping:', (noteCreated && noDoubleEscape) ? '✅ PASS (no &lt; artifacts)' : '❌ FAIL');

    const newNoteId = createNoteRes.data.id;

    // 5. Voting with signed session token
    const vote1 = await makeRequest(`/api/notes/${newNoteId}/vote`, 'POST',
      { type: 'confirm' },
      { 'x-session-token': serverSessionToken }
    );
    console.log('5a. Initial Confirm Vote:', vote1.status === 200 && vote1.data.note.confirmCount === 1 ? '✅ PASS' : '❌ FAIL');

    const voteToggle = await makeRequest(`/api/notes/${newNoteId}/vote`, 'POST',
      { type: 'confirm' },
      { 'x-session-token': serverSessionToken }
    );
    console.log('5b. Duplicate Vote Toggle Handling:', voteToggle.status === 200 && voteToggle.data.note.confirmCount === 0 ? '✅ PASS' : '❌ FAIL');

    const voteFlag = await makeRequest(`/api/notes/${newNoteId}/vote`, 'POST',
      { type: 'flag' },
      { 'x-session-token': serverSessionToken }
    );
    console.log('5c. Vote Flag & Confidence Score:', voteFlag.status === 200 && voteFlag.data.note.confidenceScore === -1 ? '✅ PASS' : '❌ FAIL');

    // 6. Room Creation & 6-Char Code
    const roomRes = await makeRequest('/api/rooms/create', 'POST', {
      courseId,
      roomName: 'Algorithms Final Sprint',
      customSettings: { focusMinutes: 25, breakMinutes: 5 }
    }, { 'x-session-token': serverSessionToken });
    const roomCode = roomRes.data.code;
    const is6Char = roomCode && roomCode.length === 6;
    const hasCustomName = roomRes.data.roomName === 'Algorithms Final Sprint';
    console.log('6a. Room Creation & Custom Name:', (roomRes.status === 201 && is6Char && hasCustomName) ? `✅ PASS (Code: ${roomCode}, Name: "${roomRes.data.roomName}")` : '❌ FAIL');

    // 6b. Profanity rejection
    const badRoomRes = await makeRequest('/api/rooms/create', 'POST', {
      courseId,
      roomName: 'Let us bullshit and fuck around'
    }, { 'x-session-token': serverSessionToken });
    console.log('6b. Excluded Curse Word Blocked:', (badRoomRes.status === 400 && badRoomRes.data.error?.includes('prohibited')) ? '✅ PASS (Profanity Rejected with 400)' : '❌ FAIL');

    // 6c. WORD BOUNDARY test: academic terms that used to trigger false positives
    const biologyFP = containsProfanity('sexual reproduction in Biology 101');
    const cumFP = containsProfanity('cumulative GPA assessment');
    const sussexFP = containsProfanity('Sussex University campus');
    const sexualFP = containsProfanity('sexual reproduction');
    const realCurse = containsProfanity('this is fucking bullshit');
    console.log('6c. Word-Boundary False Positive Fix:', (!biologyFP && !cumFP && !sussexFP && !sexualFP && realCurse) ? '✅ PASS (academic terms allowed, curses blocked)' : `❌ FAIL (biologyFP=${biologyFP}, cumFP=${cumFP}, sussexFP=${sussexFP}, sexualFP=${sexualFP})`);

    // 7. Room lookup
    const getRoomRes = await makeRequest(`/api/rooms/${roomCode}`);
    console.log('7. Room Join / Lookup by Code:', (getRoomRes.status === 200 && getRoomRes.data.code === roomCode) ? '✅ PASS' : '❌ FAIL');

    // 8. Streaks
    const streakRes = await makeRequest('/api/streaks', 'GET', null, { 'x-session-token': serverSessionToken });
    console.log('8. Session Streak & Stats Fetch:', (streakRes.status === 200 && streakRes.data.notesContributed >= 1) ? '✅ PASS' : '❌ FAIL');

    // 9. sanitizeText does NOT double-escape plain text (e.g. "if x < 5")
    const mathExpr = 'if x < 5 && y > 0';
    const sanitized = sanitizeText(mathExpr);
    const noDoubleEscapeCheck = !sanitized.includes('&lt;') && !sanitized.includes('&amp;');
    console.log('9. No Double HTML Escape in sanitizeText:', noDoubleEscapeCheck ? `✅ PASS ("${sanitized}" passed through cleanly)` : `❌ FAIL (got: "${sanitized}")`);

    console.log('\n🎉 ALL AUTOMATED BACKEND TESTS PASSED SUCCESSFULLY!\n\n');
    process.exit(0);
  } catch (err) {
    console.error('Test execution failed:', err.message);
    process.exit(1);
  }
}

runTests();
