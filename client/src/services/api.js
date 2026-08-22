// Client-side API service & session manager

let cachedSessionId = null;
let cachedSessionToken = null;

// Initialize session with the server (tamper-proof signed session)
export async function initSession() {
  try {
    const res = await fetch('/api/session/init', {
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      cachedSessionId = data.sessionId;
      cachedSessionToken = data.sessionToken;
      localStorage.setItem('studybound_session_id', data.sessionId);
      localStorage.setItem('studybound_session_token', data.sessionToken);
      return data;
    }
  } catch (e) {
    console.warn('Session handshake fallback', e);
  }

  // Fallback to local storage
  cachedSessionId = localStorage.getItem('studybound_session_id') || 'anon_guest';
  cachedSessionToken = localStorage.getItem('studybound_session_token') || '';
  return { sessionId: cachedSessionId, sessionToken: cachedSessionToken };
}

export function getAnonymousSessionId() {
  if (cachedSessionId) return cachedSessionId;
  return localStorage.getItem('studybound_session_id') || 'anon_guest';
}

export function getSessionToken() {
  if (cachedSessionToken) return cachedSessionToken;
  return localStorage.getItem('studybound_session_token') || '';
}

const API_BASE = 'https://hackathon-project-fo11.onrender.com';

async function handleResponse(res) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

function getHeaders() {
  const token = getSessionToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'x-session-token': token } : {})
  };
}

export const api = {
  // Init
  initSession,

  // Courses
  async getCourses() {
    const res = await fetch(`${API_BASE}/courses`, {
      credentials: 'include',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getCourse(courseId) {
    const res = await fetch(`${API_BASE}/courses/${courseId}`, {
      credentials: 'include',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createCourse(data) {
    const res = await fetch(`${API_BASE}/courses`, {
      method: 'POST',
      credentials: 'include',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Notes
  async getNotes(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/notes?${query}`, {
      credentials: 'include',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getNote(noteId) {
    const res = await fetch(`${API_BASE}/notes/${noteId}`, {
      credentials: 'include',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createNote(data) {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      credentials: 'include',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async voteNote(noteId, type) {
    const res = await fetch(`${API_BASE}/notes/${noteId}/vote`, {
      method: 'POST',
      credentials: 'include',
      headers: getHeaders(),
      body: JSON.stringify({ type })
    });
    return handleResponse(res);
  },

  async getUserVotes() {
    const res = await fetch(`${API_BASE}/user-votes`, {
      credentials: 'include',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Rooms
  async createRoom({ courseId, customCourseCode, customCourseName, customSettings = {}, roomName = '' }) {
    const res = await fetch(`${API_BASE}/rooms/create`, {
      method: 'POST',
      credentials: 'include',
      headers: getHeaders(),
      body: JSON.stringify({ 
        courseId, 
        customCourseCode, 
        customCourseName, 
        roomName, 
        customSettings 
      })
    });
    return handleResponse(res);
  },

  async getRoom(code) {
    const res = await fetch(`${API_BASE}/rooms/${code}`, {
      credentials: 'include',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Streaks
  async getStreak() {
    const res = await fetch(`${API_BASE}/streaks`, {
      credentials: 'include',
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};
