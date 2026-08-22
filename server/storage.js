import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

const INITIAL_COURSES = [
  {
    id: 'course-cs101',
    code: 'CS 101',
    name: 'Introduction to Computer Science & Algorithms',
    department: 'Computer Science',
    description: 'Core concepts of algorithms, data structures, recursion, and computational complexity.',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'course-cs201',
    code: 'CS 201',
    name: 'Data Structures & Systems Programming',
    department: 'Computer Science',
    description: 'Trees, graphs, memory management, pointers, and cache-conscious systems design.',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString()
  },
  {
    id: 'course-math220',
    code: 'MATH 220',
    name: 'Linear Algebra & Matrix Computation',
    department: 'Mathematics',
    description: 'Vector spaces, eigenvalues, SVD decomposition, and transformations in machine learning.',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
  },
  {
    id: 'course-bio110',
    code: 'BIO 110',
    name: 'Cellular Biology & Molecular Genetics',
    department: 'Biology',
    description: 'Cell cycle regulation, DNA transcription/translation, CRISPR mechanisms, and metabolic pathways.',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    id: 'course-econ101',
    code: 'ECON 101',
    name: 'Principles of Microeconomics',
    department: 'Economics',
    description: 'Supply and demand elasticity, consumer surplus, game theory, and market equilibria.',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: 'course-phys150',
    code: 'PHYS 150',
    name: 'Classical Mechanics & Thermodynamics',
    department: 'Physics',
    description: 'Newtonian dynamics, conservation laws, rotational kinematics, and entropy fundamentals.',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString()
  }
];

const INITIAL_NOTES = [
  {
    id: 'note-1',
    courseId: 'course-cs101',
    title: 'Mastering Big-O Analysis & Master Theorem Cheat Sheet',
    content: `### Master Theorem Quick Reference
For recurrences of the form $T(n) = aT(n/b) + f(n)$ where $a \\ge 1$ and $b > 1$:
1. **Case 1**: If $f(n) = O(n^{\\log_b a - \\epsilon})$ for $\\epsilon > 0$, then $T(n) = \\Theta(n^{\\log_b a})$.
2. **Case 2**: If $f(n) = \\Theta(n^{\\log_b a} \\log^k n)$ with $k \\ge 0$, then $T(n) = \\Theta(n^{\\log_b a} \\log^{k+1} n)$.
3. **Case 3**: If $f(n) = \\Omega(n^{\\log_b a + \\epsilon})$ and regularity condition holds ($af(n/b) \\le c f(n)$ for $c < 1$), then $T(n) = \\Theta(f(n))$.

*Exam Tip:* Always check if $b$ is a divisor or a subtraction. If $T(n) = T(n-1) + O(1)$, this is linear $O(n)$, not logarithmic!`,
    tags: ['Algorithms', 'Complexity', 'Exam Prep'],
    confirmCount: 14,
    flagCount: 1,
    confidenceScore: 13,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'note-2',
    courseId: 'course-cs201',
    title: 'Red-Black Tree Invariants & Rotation Mechanics',
    content: `### 5 Properties of Red-Black Trees:
1. Every node is either red or black.
2. The root is always black.
3. Every leaf (NIL node) is black.
4. If a node is red, both its children are black (no two consecutive reds).
5. Every path from a given node to any of its descendant NIL nodes contains the same number of black nodes (Black-Height).

**Max Height Proof:** Height is at most $2 \\log_2(n + 1)$, guaranteeing $O(\\log n)$ search, insert, and delete operations.`,
    tags: ['Data Structures', 'Trees', 'C++'],
    confirmCount: 9,
    flagCount: 0,
    confidenceScore: 9,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'note-3',
    courseId: 'course-math220',
    title: 'Eigenvalues, Eigenvectors & Diagonalization Steps',
    content: `### Diagonalization Workflow:
1. Find characteristic polynomial: $\\det(A - \\lambda I) = 0$.
2. Solve for eigenvalues $\\lambda_1, \\lambda_2, \\dots, \\lambda_k$.
3. For each $\\lambda_i$, find basis of nullspace: $(A - \\lambda_i I)\\vec{v} = \\vec{0}$.
4. If geometric multiplicity equals algebraic multiplicity for all eigenvalues, matrix $A$ is diagonalizable: $A = PDP^{-1}$ where $P$ has eigenvectors as columns and $D$ has eigenvalues along diagonal.`,
    tags: ['Linear Algebra', 'Matrices', 'Formulas'],
    confirmCount: 18,
    flagCount: 2,
    confidenceScore: 16,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'note-4',
    courseId: 'course-bio110',
    title: 'Krebs Cycle & ATP Yield Breakdown (Aerobic Respiration)',
    content: `### Total Net ATP Yield per Glucose Molecule:
- **Glycolysis**: 2 ATP (net) + 2 NADH (~3-5 ATP via ETC)
- **Pyruvate Oxidation**: 2 NADH (~5 ATP)
- **Citric Acid (Krebs) Cycle**: 2 GTP (converted to 2 ATP) + 6 NADH (~15 ATP) + 2 FADH2 (~3 ATP)
- **Total Theoretical Yield**: ~30 to 32 ATP per glucose molecule.

*Common Mistake:* Remember that each NADH yields ~2.5 ATP while each FADH2 yields only ~1.5 ATP because FADH2 enters at Complex II instead of Complex I.`,
    tags: ['Cellular Bio', 'Metabolism', 'Cheat Sheet'],
    confirmCount: 12,
    flagCount: 1,
    confidenceScore: 11,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'note-5',
    courseId: 'course-econ101',
    title: 'Price Elasticity of Demand & Total Revenue Relationship',
    content: `### Elasticity Formula:
$$\\epsilon_d = \\frac{\\% \\Delta Q}{\\% \\Delta P} = \\frac{(Q_2 - Q_1) / [(Q_2 + Q_1) / 2]}{(P_2 - P_1) / [(P_2 + P_1) / 2]}$$

### Revenue Effect:
- If $|\\epsilon_d| > 1$ (Elastic): Price $\\uparrow \\implies$ Revenue $\\downarrow$.
- If $|\\epsilon_d| = 1$ (Unitary): Price change has zero net effect on revenue (revenue is maximized).
- If $|\\epsilon_d| < 1$ (Inelastic): Price $\\uparrow \\implies$ Revenue $\\uparrow$.`,
    tags: ['Microeconomics', 'Elasticity', 'Formulas'],
    confirmCount: 7,
    flagCount: 0,
    confidenceScore: 7,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

class Storage {
  constructor() {
    this.data = {
      courses: [...INITIAL_COURSES],
      notes: [...INITIAL_NOTES],
      votes: [], // { id, noteId, voterSessionId, type: 'confirm' | 'flag', createdAt }
      rooms: {}, // code -> { id, code, courseId, courseCode, courseName, createdAt, lastActive, participants: [], pomodoro: {...} }
      streaks: {} // sessionId -> { streakCount, completedCycles, totalMinutes, notesContributed, lastActive }
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.courses && parsed.notes) {
          this.data = {
            ...this.data,
            ...parsed,
            // Keep memory rooms clean on reboot or initialize
            rooms: parsed.rooms || {}
          };
        }
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Failed to load storage, using defaults:', err);
    }
  }

  save() {
    try {
      const tempPath = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DATA_FILE);
    } catch (err) {
      console.error('Failed to persist storage:', err);
    }
  }

  // --- Courses ---
  getCourses() {
    return this.data.courses;
  }

  getCourseById(courseId) {
    return this.data.courses.find(c => c.id === courseId);
  }

  createCourse({ code, name, department, description }) {
    const course = {
      id: `course-${nanoid(8)}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      department: department ? department.trim() : 'General',
      description: description ? description.trim() : '',
      createdAt: new Date().toISOString()
    };
    this.data.courses.push(course);
    this.save();
    return course;
  }

  // --- Notes ---
  getNotesByCourse(courseId) {
    return this.data.notes
      .filter(n => n.courseId === courseId)
      .sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  getAllNotes() {
    return [...this.data.notes].sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  getNoteById(noteId) {
    return this.data.notes.find(n => n.id === noteId);
  }

  createNote({ courseId, title, content, tags = [] }) {
    const note = {
      id: `note-${nanoid(10)}`,
      courseId,
      title: title.trim(),
      content: content.trim(),
      tags: Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : [],
      confirmCount: 0,
      flagCount: 0,
      confidenceScore: 0,
      createdAt: new Date().toISOString()
    };
    this.data.notes.unshift(note);
    this.save();
    return note;
  }

  // --- Voting (Deduplicated per Session) ---
  voteNote(noteId, voterSessionId, type) {
    const note = this.data.notes.find(n => n.id === noteId);
    if (!note) return { error: 'Note not found' };

    // Check if session has already voted on this note
    const existingIndex = this.data.votes.findIndex(
      v => v.noteId === noteId && v.voterSessionId === voterSessionId
    );

    let userVoteState = type; // 'confirm' | 'flag' | null (if toggled off)

    if (existingIndex !== -1) {
      const existingVote = this.data.votes[existingIndex];
      if (existingVote.type === type) {
        // Toggling same vote off
        this.data.votes.splice(existingIndex, 1);
        userVoteState = null;
      } else {
        // Changing vote from confirm to flag or vice versa
        existingVote.type = type;
        existingVote.createdAt = new Date().toISOString();
      }
    } else {
      // New vote
      this.data.votes.push({
        id: `vote-${nanoid(8)}`,
        noteId,
        voterSessionId,
        type,
        createdAt: new Date().toISOString()
      });
    }

    // Recalculate counts strictly from vote records for exact consistency
    const noteVotes = this.data.votes.filter(v => v.noteId === noteId);
    note.confirmCount = noteVotes.filter(v => v.type === 'confirm').length;
    note.flagCount = noteVotes.filter(v => v.type === 'flag').length;
    note.confidenceScore = note.confirmCount - note.flagCount;

    this.save();
    return { note, userVote: userVoteState };
  }

  getUserVotesForSession(sessionId) {
    const map = {};
    this.data.votes
      .filter(v => v.voterSessionId === sessionId)
      .forEach(v => {
        map[v.noteId] = v.type;
      });
    return map;
  }

  // --- Rooms ---
  getRoom(code) {
    if (!code) return null;
    return this.data.rooms[code.toUpperCase()] || null;
  }

  getRoomById(id) {
    return Object.values(this.data.rooms).find(r => r.id === id) || null;
  }

  createRoom({ code, courseId, courseCode, courseName, roomName, creatorSessionId, customSettings }) {
    const focusMinutes = (customSettings && customSettings.focusMinutes) || 25;
    const breakMinutes = (customSettings && customSettings.breakMinutes) || 5;
    const longBreakMinutes = (customSettings && customSettings.longBreakMinutes) || 15;

    const room = {
      id: `room-${nanoid(10)}`,
      code: code.toUpperCase(),
      courseId,
      courseCode,
      courseName,
      roomName: roomName ? roomName.trim() : `${courseCode} Focus Session`,
      creatorSessionId,
      createdAt: new Date().toISOString(),
      lastActive: Date.now(),
      participants: [], // { socketId, sessionId, displayName, isCameraOn, isMicOn }
      pomodoro: {
        phase: 'focus', // 'focus' | 'short_break' | 'long_break'
        timeRemaining: focusMinutes * 60,
        duration: focusMinutes * 60,
        isRunning: false,
        cycleCount: 0,
        lastTickTime: null,
        settings: {
          focusMinutes,
          breakMinutes,
          longBreakMinutes,
          cyclesBeforeLongBreak: 4
        }
      }
    };
    this.data.rooms[room.code] = room;
    return room;
  }

  removeRoom(code) {
    if (this.data.rooms[code]) {
      delete this.data.rooms[code];
    }
  }

  // --- Streaks & Stats ---
  getStreak(sessionId) {
    return (
      this.data.streaks[sessionId] || {
        streakCount: 0,
        completedCycles: 0,
        totalMinutes: 0,
        notesContributed: 0,
        lastActive: new Date().toISOString()
      }
    );
  }

  incrementCycleStreak(sessionId, minutesAdded = 25) {
    if (!sessionId) return;
    const current = this.getStreak(sessionId);
    this.data.streaks[sessionId] = {
      ...current,
      streakCount: current.streakCount + 1,
      completedCycles: current.completedCycles + 1,
      totalMinutes: current.totalMinutes + minutesAdded,
      lastActive: new Date().toISOString()
    };
    this.save();
    return this.data.streaks[sessionId];
  }

  breakStreak(sessionId) {
    if (!sessionId) return;
    const current = this.getStreak(sessionId);
    this.data.streaks[sessionId] = {
      ...current,
      streakCount: 0,
      lastActive: new Date().toISOString()
    };
    this.save();
    return this.data.streaks[sessionId];
  }

  incrementNoteContributed(sessionId) {
    if (!sessionId) return;
    const current = this.getStreak(sessionId);
    this.data.streaks[sessionId] = {
      ...current,
      notesContributed: (current.notesContributed || 0) + 1,
      lastActive: new Date().toISOString()
    };
    this.save();
    return this.data.streaks[sessionId];
  }
}

export const storage = new Storage();
