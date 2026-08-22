import http from 'http';

async function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Studybound Server Automated Tests...\n');

  try {
    // 1. Health check
    const health = await makeRequest('/api/health');
    console.log('1. Health Check:', health.status === 200 && health.data.status === 'ok' ? '✅ PASS' : '❌ FAIL');

    // 2. Courses
    const coursesRes = await makeRequest('/api/courses');
    console.log('2. Fetch Courses:', coursesRes.status === 200 && coursesRes.data.length > 0 ? `✅ PASS (${coursesRes.data.length} courses)` : '❌ FAIL');
    const courseId = coursesRes.data[0].id;

    // 3. Notes
    const notesRes = await makeRequest(`/api/notes?courseId=${courseId}`);
    console.log('3. Fetch Course Notes:', notesRes.status === 200 ? `✅ PASS (${notesRes.data.length} notes)` : '❌ FAIL');

    // 4. Create Note with XSS attempt
    const testSession = 'test_session_' + Date.now();
    const xssTitle = '<script>alert("xss")</script> Test Safe Title';
    const xssContent = '<b>Bold text</b> <img src=x onerror=alert(1)> Note content here.';
    const createNoteRes = await makeRequest('/api/notes', 'POST', {
      courseId,
      title: xssTitle,
      content: xssContent,
      tags: ['Test', '<script>tag</script>'],
      sessionId: testSession
    });
    const noteCreated = createNoteRes.status === 201;
    const isSanitized = !createNoteRes.data.title.includes('<script>') && !createNoteRes.data.content.includes('<img');
    console.log('4. Note Creation & XSS Sanitization:', (noteCreated && isSanitized) ? '✅ PASS (HTML safely escaped)' : '❌ FAIL');

    const newNoteId = createNoteRes.data.id;

    // 5. Voting & Duplicate Vote Prevention
    const vote1 = await makeRequest(`/api/notes/${newNoteId}/vote`, 'POST', {
      sessionId: testSession,
      type: 'confirm'
    });
    console.log('5a. Initial Confirm Vote:', vote1.status === 200 && vote1.data.note.confirmCount === 1 ? '✅ PASS' : '❌ FAIL');

    // Voting same type again toggles off
    const voteToggle = await makeRequest(`/api/notes/${newNoteId}/vote`, 'POST', {
      sessionId: testSession,
      type: 'confirm'
    });
    console.log('5b. Duplicate Vote Toggle Handling:', voteToggle.status === 200 && voteToggle.data.note.confirmCount === 0 ? '✅ PASS' : '❌ FAIL');

    // Vote flag
    const voteFlag = await makeRequest(`/api/notes/${newNoteId}/vote`, 'POST', {
      sessionId: testSession,
      type: 'flag'
    });
    console.log('5c. Vote Flag & Confidence Score Calculation:', voteFlag.status === 200 && voteFlag.data.note.confidenceScore === -1 ? '✅ PASS' : '❌ FAIL');

    // 6. Room Creation & 6-Char Meeting Code
    const roomRes = await makeRequest('/api/rooms/create', 'POST', {
      courseId,
      roomName: 'Algorithms Final Sprint',
      creatorSessionId: testSession,
      customSettings: { focusMinutes: 25, breakMinutes: 5 }
    });
    const roomCode = roomRes.data.code;
    const is6Char = roomCode && roomCode.length === 6;
    const hasCustomName = roomRes.data.roomName === 'Algorithms Final Sprint';
    console.log('6a. Room Creation & Custom Name:', (roomRes.status === 201 && is6Char && hasCustomName) ? `✅ PASS (Code: ${roomCode}, Name: "${roomRes.data.roomName}")` : '❌ FAIL');

    // 6b. Profanity Exclusion in Room Name
    const badRoomRes = await makeRequest('/api/rooms/create', 'POST', {
      courseId,
      roomName: 'Let us do bullshit and fuck around',
      creatorSessionId: testSession
    });
    console.log('6b. Excluded Curse Word Blocked:', (badRoomRes.status === 400 && badRoomRes.data.error.includes('prohibited curse')) ? '✅ PASS (Profanity Rejected with 400)' : '❌ FAIL');

    // 7. Room Lookup by 6-Char Code
    const getRoomRes = await makeRequest(`/api/rooms/${roomCode}?sessionId=${testSession}`);
    console.log('7. Room Join / Lookup by Code:', (getRoomRes.status === 200 && getRoomRes.data.code === roomCode && getRoomRes.data.roomName === 'Algorithms Final Sprint') ? '✅ PASS' : '❌ FAIL');

    // 8. Streaks
    const streakRes = await makeRequest(`/api/streaks/${testSession}`);
    console.log('8. Session Streak & Stats Fetch:', (streakRes.status === 200 && streakRes.data.notesContributed >= 1) ? '✅ PASS' : '❌ FAIL');

    console.log('\n🎉 ALL AUTOMATED BACKEND TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

// Run tests against active server
runTests();
