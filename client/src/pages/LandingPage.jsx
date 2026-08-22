import React from 'react';
import { BookOpen, Users, CheckCircle2, ArrowRight, Clock, ShieldCheck, Flame, TrendingUp } from 'lucide-react';

export function LandingPage({ onNavigate, stats }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', padding: '0' }}>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '72vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 0 48px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle ambient glow behind hero text */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(37,99,235,0.09) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Eyebrow */}
          <p style={{
            fontSize: '0.72rem',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '22px',
            fontWeight: 600
          }}>
            Same tools. Bigger possibilities.
          </p>

          {/* Main headline — NoteNest-style large, bold, left-aligned */}
          <h1 style={{
            fontSize: 'clamp(2.8rem, 6.5vw, 4.8rem)',
            fontWeight: 800,
            letterSpacing: '-2px',
            lineHeight: 1.1,
            maxWidth: '740px',
            marginBottom: '22px',
            color: '#f8fafc'
          }}>
            Focus today,<br />
            impact{' '}
            <span style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>tomorrow.</span>
          </h1>

          {/* Sub-headline */}
          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            maxWidth: '480px',
            lineHeight: 1.65,
            marginBottom: '36px'
          }}>
            Anonymous notes. Meaningful study sessions.<br />
            A community that helps you grow.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '60px' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => onNavigate('courses')}
              id="hero-browse-notes-btn"
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              <span>Get Started</span>
              <ArrowRight size={17} />
            </button>

            <button
              className="btn btn-secondary btn-lg"
              onClick={() => onNavigate('rooms')}
              id="hero-join-room-btn"
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              <Users size={17} />
              <span>Join a Study Room</span>
            </button>
          </div>

          {/* Stats row — NoteNest-style minimal counters */}
          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            {[
              { value: '10K+', label: 'Notes shared' },
              { value: '5K+', label: 'Students' },
              { value: '1', label: 'Goal', sub: 'Greater possibilities' }
            ].map((stat, i) => (
              <div key={i}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>{stat.label}</div>
                {stat.sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.7 }}>{stat.sub}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Right-side vertical text — decorative, NoteNest-inspired */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '0.62rem',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          opacity: 0.5,
          fontWeight: 600
        }}>
          {['LESS', 'DISTRACTION', 'MORE', 'PROGRESS'].map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0 0 52px' }} />

      {/* ── TWO FEATURE CARDS ── */}
      <section className="grid-2" style={{ marginBottom: '52px' }}>
        <div className="card card-clickable" onClick={() => onNavigate('courses')} style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <BookOpen size={22} />
            </div>
            <span className="badge badge-confirmed">Identity-Free</span>
          </div>

          <div>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '8px' }}>Open Notes Database</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Crowd-verified notes per course. Accuracy is scored by peer votes — not by uploader reputation or status.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={14} color="#10b981" />
              <span>Sorted by trust % — most verified notes first</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={14} color="#3b82f6" />
              <span>Zero usernames or avatars in notes UI</span>
            </div>
          </div>
        </div>

        <div className="card card-clickable" onClick={() => onNavigate('rooms')} style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-success)' }}>
              <Users size={22} />
            </div>
            <span className="badge badge-phase-focus">Synced Pomodoro</span>
          </div>

          <div>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '8px' }}>Study Rooms</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Instant focus sessions via 6-character room code. Server-synced Pomodoro keeps every participant on the same clock.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={14} color="#10b981" />
              <span>Server-authoritative synchronized countdown</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={14} color="#eab308" />
              <span>Auto post-session note contribution prompt</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SIGNATURE FEATURE CALLOUT ── */}
      <section style={{
        background: 'linear-gradient(120deg, rgba(37,99,235,0.07) 0%, rgba(16,185,129,0.05) 100%)',
        border: '1px solid rgba(59,130,246,0.18)',
        borderRadius: 'var(--radius-lg)',
        padding: '36px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
          <span className="badge badge-code">Signature Bridge</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>How it works</span>
        </div>

        <h3 style={{ fontSize: '1.4rem', maxWidth: '560px', lineHeight: 1.3 }}>
          How accountability feeds the notes pool
        </h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '620px', fontSize: '0.93rem', lineHeight: 1.65 }}>
          When your 25-minute Pomodoro focus block ends, Studybound automatically opens the course contribution bridge. Add a fresh insight or confirm a note your peers rely on — building the community knowledge pool one session at a time.
        </p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('rooms')} style={{ borderRadius: 'var(--radius-full)' }}>
            Start a Session <ArrowRight size={14} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('courses')} style={{ borderRadius: 'var(--radius-full)' }}>
            <BookOpen size={14} />
            Browse Notes Pool
          </button>
        </div>
      </section>
    </div>
  );
}
