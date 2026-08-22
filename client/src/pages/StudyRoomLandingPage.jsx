import React, { useState, useEffect } from 'react';
import { Users, Plus, ArrowRight, Video, Clock, ShieldCheck, Sparkles, Settings, Edit3, ListFilter } from 'lucide-react';
import { api } from '../services/api';

export function StudyRoomLandingPage({ onJoinRoom, prefilledCourse }) {
  const [courses, setCourses] = useState([]);
  const [courseMode, setCourseMode] = useState(prefilledCourse ? 'select' : 'select'); // 'select' | 'custom'
  const [selectedCourseId, setSelectedCourseId] = useState(prefilledCourse ? prefilledCourse.id : '');
  const [customCourseCode, setCustomCourseCode] = useState('');
  const [customCourseName, setCustomCourseName] = useState('');
  const [customRoomName, setCustomRoomName] = useState('');
  const [joinInput, setJoinInput] = useState('');
  
  // Custom Pomodoro Settings
  const [showCustomSettings, setShowCustomSettings] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);

  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getCourses().then(data => {
      setCourses(data);
      if (!selectedCourseId && data.length > 0) {
        setSelectedCourseId(prefilledCourse ? prefilledCourse.id : data[0].id);
      }
    }).catch(() => {});
  }, [prefilledCourse]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError(null);

    if (courseMode === 'select' && !selectedCourseId) {
      setError('Please select a course from the list or switch to typing a custom course.');
      return;
    }

    if (courseMode === 'custom' && !customCourseCode.trim()) {
      setError('Please enter your course code or study subject name (e.g. CHEM 201, AP Psychology, MCAT Prep).');
      return;
    }

    try {
      setCreating(true);
      const room = await api.createRoom({
        courseId: courseMode === 'select' ? selectedCourseId : undefined,
        customCourseCode: courseMode === 'custom' ? customCourseCode.trim() : undefined,
        customCourseName: courseMode === 'custom' ? (customCourseName.trim() || customCourseCode.trim()) : undefined,
        roomName: customRoomName.trim(),
        customSettings: {
          focusMinutes: Number(focusMinutes) || 25,
          breakMinutes: Number(breakMinutes) || 5,
          longBreakMinutes: Number(longBreakMinutes) || 15
        }
      });
      onJoinRoom(room.code);
    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByInput = async (e) => {
    e.preventDefault();
    const raw = joinInput.trim();
    if (!raw) return;

    // Extract code if user pasted a full URL
    let code = raw;
    if (raw.includes('/room/')) {
      code = raw.split('/room/').pop().split('?')[0].split('/')[0];
    } else if (raw.includes('code=')) {
      code = new URLSearchParams(raw.split('?')[1]).get('code') || raw;
    }
    code = code.trim().toUpperCase();

    try {
      setJoining(true);
      setError(null);
      const room = await api.getRoom(code);
      onJoinRoom(room.code);
    } catch (err) {
      setError(err.message || 'Invalid or expired room code. Please check and try again.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', maxWidth: '960px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div className="badge badge-phase-focus" style={{ padding: '6px 14px' }}>
          <Video size={13} />
          Google-Meet-Style Focus Sessions
        </div>
        <h1 style={{ fontSize: '2.4rem' }}>Study Rooms & Synced Pomodoro</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', fontSize: '1rem' }}>
          Hop into a focused accountability room with peers studying the same course. Run a synchronized Pomodoro timer, then bridge key takeaways into the notes pool.
        </p>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--accent-danger-bg)',
          border: '1px solid var(--accent-danger-border)',
          color: '#f87171',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* Dual Entry Grid: Create or Join */}
      <div className="grid-2">
        {/* Card 1: Create a Room */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                <Plus size={18} />
              </div>
              <h2 style={{ fontSize: '1.3rem' }}>Create a New Room</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Pick any course or type your own subject. Generates an instant shareable link and 6-character room code.
            </p>

            <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Course Selection / Custom Typing Tabs */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    What course are you studying? <span style={{ color: 'var(--accent-danger)' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCourseMode(courseMode === 'select' ? 'custom' : 'select')}
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--accent-primary)',
                      background: 'none',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    {courseMode === 'select' ? '+ Type custom course' : '← Select from list'}
                  </button>
                </div>

                {courseMode === 'select' ? (
                  <select
                    value={selectedCourseId}
                    onChange={e => setSelectedCourseId(e.target.value)}
                    style={{ width: '100%' }}
                    id="room-course-select"
                  >
                    <option value="" disabled>Select target course...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="e.g. CHEM 201, HIST 105, MCAT Prep..."
                      value={customCourseCode}
                      onChange={e => setCustomCourseCode(e.target.value)}
                      required
                      style={{ width: '100%' }}
                      id="custom-course-code-input"
                    />
                    <input
                      type="text"
                      placeholder="Course name (e.g. Organic Chemistry II) - optional"
                      value={customCourseName}
                      onChange={e => setCustomCourseName(e.target.value)}
                      style={{ width: '100%', fontSize: '0.85rem' }}
                      id="custom-course-name-input"
                    />
                  </div>
                )}
              </div>

              {/* Custom Room Name Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Room Topic / Name <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midterm Cram Pod, Chapter 4 Deep Work..."
                  value={customRoomName}
                  onChange={e => setCustomRoomName(e.target.value)}
                  maxLength={60}
                  style={{ width: '100%' }}
                  id="custom-room-name-input"
                />
              </div>

              {/* Adjustable Pomodoro Settings Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowCustomSettings(!showCustomSettings)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    color: 'var(--accent-primary)',
                    background: 'none',
                    padding: '4px 0'
                  }}
                >
                  <Settings size={14} />
                  <span>{showCustomSettings ? 'Hide Timer Settings' : 'Customize Pomodoro Intervals (Optional)'}</span>
                </button>

                {showCustomSettings && (
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '12px', 
                    background: 'var(--bg-surface-elevated)', 
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px'
                  }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Focus (min)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="90" 
                        value={focusMinutes} 
                        onChange={e => setFocusMinutes(e.target.value)} 
                        style={{ width: '100%', padding: '6px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Break (min)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="30" 
                        value={breakMinutes} 
                        onChange={e => setBreakMinutes(e.target.value)} 
                        style={{ width: '100%', padding: '6px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Long Break</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="60" 
                        value={longBreakMinutes} 
                        onChange={e => setLongBreakMinutes(e.target.value)} 
                        style={{ width: '100%', padding: '6px' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit"
                className="btn btn-primary"
                disabled={creating}
                style={{ width: '100%', marginTop: '6px' }}
                id="create-room-submit-btn"
              >
                <Video size={16} />
                <span>{creating ? 'Starting Session...' : 'Create & Enter Room'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Card 2: Join with Code or Link */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-success)' }}>
                <Users size={18} />
              </div>
              <h2 style={{ fontSize: '1.3rem' }}>Join an Existing Room</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Enter a 6-character room code (e.g. <code>KX9F2Q</code>) or paste a shared invite link.
            </p>

            <form onSubmit={handleJoinByInput} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Meeting Code or Link <span style={{ color: 'var(--accent-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. KX9F2Q or paste link..."
                  value={joinInput}
                  onChange={e => setJoinInput(e.target.value)}
                  required
                  style={{ width: '100%', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}
                  id="join-room-code-input"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} color="#10b981" />
                  <span>Automatically syncs timer with existing participants</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={13} color="#6366f1" />
                  <span>Join as an anonymous student (no sign-up required)</span>
                </div>
              </div>

              <button 
                type="submit"
                className="btn btn-secondary"
                disabled={joining || !joinInput.trim()}
                style={{ width: '100%', marginTop: '6px' }}
                id="join-room-submit-btn"
              >
                <ArrowRight size={16} />
                <span>{joining ? 'Connecting...' : 'Join Study Session'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
