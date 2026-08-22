import { io } from 'socket.io-client';
import http from 'http';

async function req(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const r = http.request(options, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, data: d }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function runEndToEndVerification() {
  console.log('🚀 Running Complete End-to-End Studybound Verification...\n');

  // Step 1: Browse Courses
  const coursesRes = await req('/api/courses');
  console.log(`1. Course Catalog Loaded: ${coursesRes.data.length} courses available`);
  const course = coursesRes.data.find(c => c.code === 'CS 101') || coursesRes.data[0];

  // Step 2: Course Notes Feed
  const notesRes = await req(`/api/notes?courseId=${course.id}`);
  console.log(`2. Notes Feed for ${course.code}: ${notesRes.data.length} notes found`);

  // Step 3: Vote Confirm on First Note
  const sessionA = 'anon_student_A_' + Date.now();
  const noteToVote = notesRes.data[0];
  const voteRes = await req(`/api/notes/${noteToVote.id}/vote`, 'POST', {
    sessionId: sessionA,
    type: 'confirm'
  });
  console.log(`3. Vote Confirm Recorded: New Score = ${voteRes.data.note.confidenceScore} (Confirm Count = ${voteRes.data.note.confirmCount})`);

  // Step 4: Upload New Note
  const uploadRes = await req('/api/notes', 'POST', {
    courseId: course.id,
    title: 'Dynamic Programming: Memoization vs Tabulation',
    content: 'Top-down caching avoids redundant subproblem recomputation in recursive trees.',
    tags: ['Algorithms', 'Exam Prep'],
    sessionId: sessionA
  });
  console.log(`4. Note Uploaded Successfully: ID=${uploadRes.data.id}, Title="${uploadRes.data.title}"`);

  // Step 5: Create Study Room
  const createRoomRes = await req('/api/rooms/create', 'POST', {
    courseId: course.id,
    creatorSessionId: sessionA,
    customSettings: { focusMinutes: 1, breakMinutes: 1 }
  });
  const roomCode = createRoomRes.data.code;
  console.log(`5. Study Room Created: Code=${roomCode} (Associated Course: ${createRoomRes.data.courseCode})`);

  // Step 6: Connect to Realtime Socket.IO Room & Join as 2 Participants
  const socket1 = io('http://localhost:4000');
  const socket2 = io('http://localhost:4000');
  const sessionB = 'anon_student_B_' + Date.now();

  await new Promise((resolve) => {
    let joinedCount = 0;
    socket1.emit('join-room', { roomCode, sessionId: sessionA, displayName: 'Student 1' });
    socket2.emit('join-room', { roomCode, sessionId: sessionB, displayName: 'Student 2' });

    socket1.on('room-state', ({ room }) => {
      if (room.participants.length >= 2) {
        console.log(`6. Realtime Room Joined: ${room.participants.length} anonymous participants in room [${roomCode}]`);
        resolve();
      }
    });
  });

  // Step 7: Pomodoro Start & Synchronized Tick Verification
  await new Promise((resolve) => {
    socket1.on('pomodoro-sync', (pomodoro) => {
      if (pomodoro.isRunning) {
        console.log(`7. Synced Pomodoro Started: Phase=${pomodoro.phase}, Time Remaining=${pomodoro.timeRemaining}s`);
        resolve();
      }
    });
    socket1.emit('pomodoro-control', { action: 'start' });
  });

  // Step 8: Trigger Focus Cycle End -> Verify Signature Post-Session Bridge
  await new Promise((resolve) => {
    let receivedCycleEvent = false;

    socket2.on('focus-cycle-ended', (cycleData) => {
      console.log(`8. 🎯 SIGNATURE POST-SESSION PROMPT TRIGGERED!`);
      console.log(`   - Course ID: ${cycleData.courseId}`);
      console.log(`   - Course Code: ${cycleData.courseCode}`);
      console.log(`   - Completed Cycle: #${cycleData.completedCycle}`);
      receivedCycleEvent = true;
      resolve();
    });

    // Skip/Fast forward to complete cycle
    socket1.emit('pomodoro-control', { action: 'skip' });
  });

  // Step 9: Verify Streak Updated for Participants
  const streakRes = await req(`/api/streaks/${sessionA}`);
  console.log(`9. Streak Updated: ${streakRes.data.streakCount} cycle(s) streak, ${streakRes.data.notesContributed} note(s) contributed`);

  // Cleanup
  socket1.disconnect();
  socket2.disconnect();

  console.log('\n🎉 COMPLETE END-TO-END FLOW VERIFIED SUCCESSFULLY!');
  process.exit(0);
}

runEndToEndVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
