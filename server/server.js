import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { storage } from './storage.js';
import {
  sanitizeText,
  generateRoomCode,
  containsProfanity,
  uploadRateLimiter,
  voteRateLimiter,
  roomJoinRateLimiter
} from './sanitizer.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// --- REST API Endpoints ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 1. Courses
app.get('/api/courses', (req, res) => {
  try {
    const courses = storage.getCourses();
    // Attach note counts to each course
    const allNotes = storage.getAllNotes();
    const result = courses.map(c => {
      const courseNotes = allNotes.filter(n => n.courseId === c.id);
      return {
        ...c,
        noteCount: courseNotes.length,
        topScore: courseNotes.length > 0 ? Math.max(...courseNotes.map(n => n.confidenceScore)) : 0
      };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.get('/api/courses/:id', (req, res) => {
  const course = storage.getCourseById(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
});

app.post('/api/courses', (req, res) => {
  const { code, name, department, description } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'Course code and name are required' });
  }
  if (containsProfanity(code) || containsProfanity(name) || containsProfanity(description || '')) {
    return res.status(400).json({ error: 'Course contains prohibited inappropriate language' });
  }
  const course = storage.createCourse({
    code: sanitizeText(code),
    name: sanitizeText(name),
    department: sanitizeText(department || 'General'),
    description: sanitizeText(description || '')
  });
  res.status(201).json(course);
});

// 2. Notes
app.get('/api/notes', (req, res) => {
  try {
    const { courseId, search, tag } = req.query;
    let notes = courseId ? storage.getNotesByCourse(courseId) : storage.getAllNotes();

    if (tag) {
      notes = notes.filter(n => n.tags && n.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      notes = notes.filter(
        n =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

app.get('/api/notes/:id', (req, res) => {
  const note = storage.getNoteById(req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
});

app.post('/api/notes', (req, res) => {
  const { courseId, title, content, tags, sessionId } = req.body;
  const clientKey = sessionId || req.ip;

  if (!uploadRateLimiter.isAllowed(clientKey)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait a minute before uploading again.' });
  }

  if (!courseId || !title || !content) {
    return res.status(400).json({ error: 'Course, title, and content are required' });
  }

  if (containsProfanity(title) || containsProfanity(content)) {
    return res.status(400).json({ error: 'Note contains prohibited inappropriate language' });
  }

  const course = storage.getCourseById(courseId);
  if (!course) return res.status(400).json({ error: 'Invalid course ID' });

  // Sanitize all inputs to prevent Stored XSS
  const sanitizedTitle = sanitizeText(title);
  const sanitizedContent = sanitizeText(content);
  const sanitizedTags = Array.isArray(tags) ? tags.map(t => sanitizeText(t)).filter(Boolean) : [];

  const note = storage.createNote({
    courseId,
    title: sanitizedTitle,
    content: sanitizedContent,
    tags: sanitizedTags
  });

  if (sessionId) {
    storage.incrementNoteContributed(sessionId);
  }

  res.status(201).json(note);
});

// 3. Voting (Confirm / Flag with Session Deduplication)
app.post('/api/notes/:id/vote', (req, res) => {
  const { sessionId, type } = req.body;
  const noteId = req.params.id;
  const clientKey = sessionId || req.ip;

  if (!voteRateLimiter.isAllowed(clientKey)) {
    return res.status(429).json({ error: 'Voting rate limit exceeded. Please wait a moment.' });
  }

  if (!sessionId) {
    return res.status(400).json({ error: 'Anonymous session ID is required to vote' });
  }

  if (type !== 'confirm' && type !== 'flag') {
    return res.status(400).json({ error: 'Invalid vote type' });
  }

  const result = storage.voteNote(noteId, sessionId, type);
  if (result.error) {
    return res.status(404).json({ error: result.error });
  }

  res.json(result);
});

app.get('/api/user-votes', (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.json({});
  const votes = storage.getUserVotesForSession(sessionId);
  res.json(votes);
});

// 4. Rooms
app.post('/api/rooms/create', (req, res) => {
  const { courseId, customCourseCode, customCourseName, roomName, creatorSessionId, customSettings } = req.body;
  const clientKey = creatorSessionId || req.ip;

  if (!roomJoinRateLimiter.isAllowed(clientKey)) {
    return res.status(429).json({ error: 'Too many room requests. Please wait a moment.' });
  }

  let course = null;

  // Handle custom course code/name input
  if (customCourseCode || customCourseName) {
    const rawCode = (customCourseCode || customCourseName).trim();
    const rawName = (customCourseName || customCourseCode).trim();

    if (containsProfanity(rawCode) || containsProfanity(rawName)) {
      return res.status(400).json({ error: 'Course code or name contains prohibited curse or offensive words. Please choose a respectful course name.' });
    }

    // Look for existing course by code or create new one
    const existing = storage.getCourses().find(c => c.code.toLowerCase() === rawCode.toLowerCase());
    if (existing) {
      course = existing;
    } else {
      course = storage.createCourse({
        code: rawCode.slice(0, 15),
        name: rawName.slice(0, 80),
        department: 'General',
        description: `Community study hub for ${rawCode}.`
      });
    }
  } else if (courseId) {
    course = storage.getCourseById(courseId);
  }

  if (!course) {
    return res.status(400).json({ error: 'Please select or enter the course you are studying' });
  }

  // Validate custom room name for curse words & offensive language
  if (roomName && containsProfanity(roomName)) {
    return res.status(400).json({ error: 'Room name contains prohibited curse or offensive words. Please choose a respectful name.' });
  }

  const sanitizedRoomName = roomName ? sanitizeText(roomName).slice(0, 60) : `${course.code} Focus Session`;

  // Generate unique 6-character code
  let code = generateRoomCode();
  while (storage.getRoom(code)) {
    code = generateRoomCode();
  }

  const room = storage.createRoom({
    code,
    courseId: course.id,
    courseCode: course.code,
    courseName: course.name,
    roomName: sanitizedRoomName,
    creatorSessionId,
    customSettings
  });

  res.status(201).json(room);
});

app.get('/api/rooms/:code', (req, res) => {
  const rawCode = req.params.code;
  const clientKey = req.query.sessionId || req.ip;

  if (!roomJoinRateLimiter.isAllowed(clientKey)) {
    return res.status(429).json({ error: 'Too many join attempts. Please wait.' });
  }

  const code = rawCode.trim().toUpperCase();
  const room = storage.getRoom(code);
  if (!room) {
    return res.status(404).json({ error: 'Study room not found or code has expired' });
  }
  res.json(room);
});

// 5. Streaks
app.get('/api/streaks/:sessionId', (req, res) => {
  const streak = storage.getStreak(req.params.sessionId);
  res.json(streak);
});

// --- Server-Authoritative Pomodoro Timer & Realtime Engine ---

setInterval(() => {
  const now = Date.now();
  const rooms = storage.data.rooms;

  for (const [code, room] of Object.entries(rooms)) {
    if (!room.pomodoro || !room.pomodoro.isRunning) continue;

    room.lastActive = now;
    room.pomodoro.timeRemaining -= 1;

    // Phase completed!
    if (room.pomodoro.timeRemaining <= 0) {
      const prevPhase = room.pomodoro.phase;
      const settings = room.pomodoro.settings || { focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, cyclesBeforeLongBreak: 4 };

      if (prevPhase === 'focus') {
        room.pomodoro.cycleCount += 1;
        
        // Award streak to all active participants in the room
        room.participants.forEach(p => {
          if (p.sessionId) {
            storage.incrementCycleStreak(p.sessionId, settings.focusMinutes);
          }
        });

        // Trigger Post-Session Note Contribution prompt to all clients in the room!
        io.to(code).emit('focus-cycle-ended', {
          courseId: room.courseId,
          courseCode: room.courseCode,
          courseName: room.courseName,
          completedCycle: room.pomodoro.cycleCount
        });

        // Determine if long break or short break
        const isLongBreak = room.pomodoro.cycleCount % settings.cyclesBeforeLongBreak === 0;
        room.pomodoro.phase = isLongBreak ? 'long_break' : 'short_break';
        const breakDuration = (isLongBreak ? settings.longBreakMinutes : settings.breakMinutes) * 60;
        room.pomodoro.duration = breakDuration;
        room.pomodoro.timeRemaining = breakDuration;
      } else {
        // Break completed, transition back to focus
        room.pomodoro.phase = 'focus';
        const focusDuration = settings.focusMinutes * 60;
        room.pomodoro.duration = focusDuration;
        room.pomodoro.timeRemaining = focusDuration;
      }

      io.to(code).emit('pomodoro-phase-changed', {
        pomodoro: room.pomodoro,
        transition: `${prevPhase}->${room.pomodoro.phase}`
      });
    } else {
      // Sync tick broadcast every second so all clients remain 100% smooth and in lockstep
      io.to(code).emit('pomodoro-sync', room.pomodoro);
    }
  }
}, 1000);

// --- Socket.IO Room Management ---

io.on('connection', socket => {
  let currentRoomCode = null;
  let participantSessionId = null;

  socket.on('join-room', ({ roomCode, sessionId, displayName }) => {
    if (!roomCode) return;
    const code = roomCode.trim().toUpperCase();
    const room = storage.getRoom(code);

    if (!room) {
      socket.emit('room-error', { message: 'Room not found' });
      return;
    }

    currentRoomCode = code;
    participantSessionId = sessionId;
    socket.join(code);

    // Assign clean anonymous display name: Student 1, Student 2, etc.
    const existingCount = room.participants.length;
    const finalDisplayName = displayName || `Student ${existingCount + 1}`;

    const existingIndex = room.participants.findIndex(p => p.sessionId === sessionId);
    if (existingIndex !== -1) {
      room.participants[existingIndex].socketId = socket.id;
    } else {
      room.participants.push({
        socketId: socket.id,
        sessionId,
        displayName: finalDisplayName,
        isCameraOn: true,
        isMicOn: true,
        joinedAt: new Date().toISOString()
      });
    }

    room.lastActive = Date.now();

    // Broadcast updated room state
    io.to(code).emit('room-state', {
      room: {
        id: room.id,
        code: room.code,
        courseId: room.courseId,
        courseCode: room.courseCode,
        courseName: room.courseName,
        roomName: room.roomName,
        participants: room.participants,
        pomodoro: room.pomodoro
      }
    });

    socket.to(code).emit('user-joined', {
      displayName: finalDisplayName,
      participantCount: room.participants.length
    });
  });

  socket.on('leave-room', () => {
    handleLeave();
  });

  socket.on('toggle-media', ({ type, enabled }) => {
    if (!currentRoomCode) return;
    const room = storage.getRoom(currentRoomCode);
    if (!room) return;

    const participant = room.participants.find(p => p.socketId === socket.id);
    if (participant) {
      if (type === 'camera') participant.isCameraOn = enabled;
      if (type === 'mic') participant.isMicOn = enabled;
      io.to(currentRoomCode).emit('participant-media-toggled', {
        socketId: socket.id,
        sessionId: participant.sessionId,
        type,
        enabled
      });
    }
  });

  // Pomodoro Controls (Server-Authoritative)
  socket.on('pomodoro-control', ({ action, settings }) => {
    if (!currentRoomCode) return;
    const room = storage.getRoom(currentRoomCode);
    if (!room) return;

    if (action === 'start') {
      room.pomodoro.isRunning = true;
    } else if (action === 'pause') {
      room.pomodoro.isRunning = false;
    } else if (action === 'reset') {
      room.pomodoro.isRunning = false;
      const s = room.pomodoro.settings;
      const dur = (room.pomodoro.phase === 'focus' ? s.focusMinutes : room.pomodoro.phase === 'short_break' ? s.breakMinutes : s.longBreakMinutes) * 60;
      room.pomodoro.timeRemaining = dur;
      room.pomodoro.duration = dur;
    } else if (action === 'skip') {
      const s = room.pomodoro.settings || { focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, cyclesBeforeLongBreak: 4 };
      if (room.pomodoro.phase === 'focus') {
        room.pomodoro.cycleCount += 1;
        
        // Award streak
        room.participants.forEach(p => {
          if (p.sessionId) {
            storage.incrementCycleStreak(p.sessionId, s.focusMinutes);
          }
        });

        // Broadcast post-session note contribution prompt to all clients
        io.to(currentRoomCode).emit('focus-cycle-ended', {
          courseId: room.courseId,
          courseCode: room.courseCode,
          courseName: room.courseName,
          completedCycle: room.pomodoro.cycleCount
        });

        const isLong = room.pomodoro.cycleCount % s.cyclesBeforeLongBreak === 0;
        room.pomodoro.phase = isLong ? 'long_break' : 'short_break';
        const dur = (isLong ? s.longBreakMinutes : s.breakMinutes) * 60;
        room.pomodoro.duration = dur;
        room.pomodoro.timeRemaining = dur;
      } else {
        room.pomodoro.phase = 'focus';
        const dur = s.focusMinutes * 60;
        room.pomodoro.duration = dur;
        room.pomodoro.timeRemaining = dur;
      }
      io.to(currentRoomCode).emit('pomodoro-phase-changed', {
        pomodoro: room.pomodoro,
        transition: 'skip'
      });
    } else if (action === 'update-settings' && settings) {
      room.pomodoro.settings = {
        ...room.pomodoro.settings,
        focusMinutes: Number(settings.focusMinutes) || 25,
        breakMinutes: Number(settings.breakMinutes) || 5,
        longBreakMinutes: Number(settings.longBreakMinutes) || 15
      };
      if (!room.pomodoro.isRunning) {
        const s = room.pomodoro.settings;
        const dur = (room.pomodoro.phase === 'focus' ? s.focusMinutes : room.pomodoro.phase === 'short_break' ? s.breakMinutes : s.longBreakMinutes) * 60;
        room.pomodoro.duration = dur;
        room.pomodoro.timeRemaining = dur;
      }
    }

    io.to(currentRoomCode).emit('pomodoro-sync', room.pomodoro);
  });

  // Room focus check-in / text message
  socket.on('room-chat', ({ message }) => {
    if (!currentRoomCode || !message) return;
    const room = storage.getRoom(currentRoomCode);
    if (!room) return;

    const participant = room.participants.find(p => p.socketId === socket.id);
    const sanitizedMsg = sanitizeText(message).slice(0, 300);

    io.to(currentRoomCode).emit('room-chat-message', {
      id: `msg-${Date.now()}`,
      sender: participant ? participant.displayName : 'Student',
      text: sanitizedMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  const handleLeave = () => {
    if (!currentRoomCode) return;
    const room = storage.getRoom(currentRoomCode);
    if (room) {
      room.participants = room.participants.filter(p => p.socketId !== socket.id);
      socket.leave(currentRoomCode);
      io.to(currentRoomCode).emit('room-state', {
        room: {
          id: room.id,
          code: room.code,
          courseId: room.courseId,
          courseCode: room.courseCode,
          courseName: room.courseName,
          roomName: room.roomName,
          participants: room.participants,
          pomodoro: room.pomodoro
        }
      });
      // If room is empty, reset timer running state
      if (room.participants.length === 0) {
        room.pomodoro.isRunning = false;
      }
    }
    currentRoomCode = null;
  };

  socket.on('disconnect', () => {
    handleLeave();
  });
});

server.listen(PORT, () => {
  console.log(`Studybound backend server running on http://localhost:${PORT}`);
});
