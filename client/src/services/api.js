// Client-side API service & session manager

// Retrieve or initialize a persistent anonymous session ID
export function getAnonymousSessionId() {
  let sessionId = localStorage.getItem('studybound_session_id');
  if (!sessionId) {
    sessionId = 'anon_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem('studybound_session_id', sessionId);
  }
  return sessionId;
}

const API_BASE = '/api';

async function handleResponse(res) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Courses
  async getCourses() {
    const res = await fetch(`${API_BASE}/courses`);
    return handleResponse(res);
  },

  async getCourse(courseId) {
    const res = await fetch(`${API_BASE}/courses/${courseId}`);
    return handleResponse(res);
  },

  async createCourse(data) {
    const res = await fetch(`${API_BASE}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Notes
  async getNotes(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/notes?${query}`);
    return handleResponse(res);
  },

  async getNote(noteId) {
    const res = await fetch(`${API_BASE}/notes/${noteId}`);
    return handleResponse(res);
  },

  async createNote(data) {
    const sessionId = getAnonymousSessionId();
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, sessionId })
    });
    return handleResponse(res);
  },

  async voteNote(noteId, type) {
    const sessionId = getAnonymousSessionId();
    const res = await fetch(`${API_BASE}/notes/${noteId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, type })
    });
    return handleResponse(res);
  },

  async getUserVotes() {
    const sessionId = getAnonymousSessionId();
    const res = await fetch(`${API_BASE}/user-votes?sessionId=${sessionId}`);
    return handleResponse(res);
  },

  // Rooms
  async createRoom({ courseId, customCourseCode, customCourseName, customSettings = {}, roomName = '' }) {
    const creatorSessionId = getAnonymousSessionId();
    const res = await fetch(`${API_BASE}/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        courseId, 
        customCourseCode, 
        customCourseName, 
        roomName, 
        creatorSessionId, 
        customSettings 
      })
    });
    return handleResponse(res);
  },

  async getRoom(code) {
    const sessionId = getAnonymousSessionId();
    const res = await fetch(`${API_BASE}/rooms/${code}?sessionId=${sessionId}`);
    return handleResponse(res);
  },

  // Streaks
  async getStreak() {
    const sessionId = getAnonymousSessionId();
    const res = await fetch(`${API_BASE}/streaks/${sessionId}`);
    return handleResponse(res);
  }
};
