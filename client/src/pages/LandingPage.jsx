import React from 'react';
import { BookOpen, Users, CheckCircle2, ArrowRight, Clock, ShieldCheck, Flame } from 'lucide-react';

export function LandingPage({ onNavigate, stats }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '20px 0' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div className="badge badge-code" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
          Peer-Verified Knowledge &bull; Synced Accountability
        </div>

        <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.4rem)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.15 }}>
          Where focus sessions build a <span style={{ background: 'linear-gradient(135deg, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>verified notes library</span>
        </h1>

        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '620px', lineHeight: 1.6 }}>
          Studybound connects anonymous peer-verified study notes with Google-Meet-style focus rooms. Every Pomodoro cycle you complete feeds the knowledge pool for the next student.
        </p>

        {/* Two Clear Primary CTAs */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '10px' }}>
          <button 
            className="btn btn-primary btn-lg"
            onClick={() => onNavigate('courses')}
            id="hero-browse-notes-btn"
          >
            <BookOpen size={19} />
            <span>Browse Notes</span>
            <ArrowRight size={17} />
          </button>

          <button 
            className="btn btn-secondary btn-lg"
            onClick={() => onNavigate('rooms')}
            id="hero-join-room-btn"
          >
            <Users size={19} />
            <span>Start or Join a Study Room</span>
          </button>
        </div>
      </section>

      {/* Two Connected Halves Grid */}
      <section className="grid-2" style={{ marginTop: '10px' }}>
        {/* Half 1: Notes Database */}
        <div 
          className="card card-clickable" 
          onClick={() => onNavigate('courses')}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <BookOpen size={22} />
            </div>
            <span className="badge badge-confirmed">Identity-Free</span>
          </div>

          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>1. Open Notes Database</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Crowd-verified notes per course. Accuracy is decided purely by community confirmation votes, never uploader reputation or status.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={15} color="#10b981" />
              <span>Confidence Score = Confirms &minus; Flags</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={15} color="#3b82f6" />
              <span>Zero usernames or avatars in notes UI</span>
            </div>
          </div>
        </div>

        {/* Half 2: Study Rooms */}
        <div 
          className="card card-clickable" 
          onClick={() => onNavigate('rooms')}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-success)' }}>
              <Users size={22} />
            </div>
            <span className="badge badge-phase-focus">Synced Pomodoro</span>
          </div>

          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>2. Study Rooms</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Instant video focus sessions joined via 6-character room code or link. Server-synced Pomodoro timer keeps everyone in sync.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={15} color="#10b981" />
              <span>Server-authoritative synchronized countdown</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={15} color="#eab308" />
              <span>Automatic post-session note contribution prompt</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Connecting Moment (Signature Feature Callout) */}
      <section style={{ 
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(16, 185, 129, 0.06))', 
        border: '1px solid rgba(59, 130, 246, 0.2)', 
        borderRadius: 'var(--radius-lg)', 
        padding: '30px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '14px',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <span className="badge badge-code">Signature Bridge</span>
        <h3 style={{ fontSize: '1.3rem' }}>How Accountability Feeds the Notes Pool</h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', fontSize: '0.95rem' }}>
          When your 25-minute Pomodoro focus block rings, Studybound automatically opens the course note contribution bridge. Capture a fresh takeaway or confirm notes your peers relied on.
        </p>
      </section>
    </div>
  );
}
