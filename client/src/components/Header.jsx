import React from 'react';
import { BookOpen, Users, Zap, Compass } from 'lucide-react';
import { getAnonymousSessionId } from '../services/api';

export function Header({ currentView, onNavigate }) {
  const sessionId = getAnonymousSessionId();
  const shortId = sessionId.replace('anon_', '').slice(0, 5).toUpperCase();

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Brand */}
        <div 
          className="brand-logo" 
          onClick={() => onNavigate('landing')}
          style={{ cursor: 'pointer' }}
        >
          <div className="brand-icon-box">
            <BookOpen size={18} />
          </div>
          <span>Studybound</span>
        </div>

        {/* Minimalist Top Nav (strictly 3 primary links) */}
        <nav className="header-nav" aria-label="Main Navigation">
          <button
            className={`nav-link ${currentView === 'courses' || currentView === 'notes-feed' ? 'active' : ''}`}
            onClick={() => onNavigate('courses')}
            id="nav-notes-btn"
          >
            <Compass size={16} />
            <span>Notes</span>
          </button>
          
          <button
            className={`nav-link ${currentView === 'rooms' || currentView === 'in-room' ? 'active' : ''}`}
            onClick={() => onNavigate('rooms')}
            id="nav-rooms-btn"
          >
            <Users size={16} />
            <span>Study Rooms</span>
          </button>

          <button
            className={`nav-link ${currentView === 'streaks' ? 'active' : ''}`}
            onClick={() => onNavigate('streaks')}
            id="nav-streaks-btn"
          >
            <Zap size={16} />
            <span>Streaks</span>
          </button>
        </nav>

        {/* Anonymous Identity Indicator */}
        <div className="header-anon-badge" title="You are browsing anonymously. Notes and votes are peer-verified without public profiles.">
          <span className="status-dot"></span>
          <span>Anon #{shortId}</span>
        </div>
      </div>
    </header>
  );
}
