import React, { useState, useEffect } from 'react';
import { Flame, Clock, FileText, CheckCircle2, Award, Zap, ArrowRight } from 'lucide-react';
import { api, getAnonymousSessionId } from '../services/api';

export function StreaksPage({ onNavigate }) {
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    try {
      setLoading(true);
      const data = await api.getStreak();
      setStreakData(data);
    } catch (err) {
      console.error('Failed to load streak', err);
    } finally {
      setLoading(false);
    }
  };

  const sessionId = getAnonymousSessionId();
  const shortId = sessionId.replace('anon_', '').slice(0, 6).toUpperCase();

  const streak = streakData?.streakCount || 0;
  const completedCycles = streakData?.completedCycles || 0;
  const totalMinutes = streakData?.totalMinutes || 0;
  const notesContributed = streakData?.notesContributed || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '840px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="badge badge-code">Anonymous Session #{shortId}</span>
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '6px' }}>Focus Streaks & Impact</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Track your continuous study momentum and notes contributed to the community.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid-3">
        {/* Streak Counter */}
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), var(--bg-surface))', 
          borderColor: 'rgba(245, 158, 11, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Flame size={20} />
            </div>
            <span className="badge badge-disputed" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              Active Streak
            </span>
          </div>

          <div style={{ fontSize: '2.8rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
            {streak}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Consecutive focus cycles completed
          </div>
        </div>

        {/* Total Focus Time */}
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), var(--bg-surface))', 
          borderColor: 'rgba(59, 130, 246, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', background: 'rgba(59, 130, 246, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
              <Clock size={20} />
            </div>
            <span className="badge badge-code">Total Time</span>
          </div>

          <div style={{ fontSize: '2.8rem', fontWeight: 800, color: '#60a5fa', lineHeight: 1 }}>
            {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            {completedCycles} total focus cycles finished
          </div>
        </div>

        {/* Notes Contributed */}
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), var(--bg-surface))', 
          borderColor: 'rgba(16, 185, 129, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <FileText size={20} />
            </div>
            <span className="badge badge-confirmed">Peer Impact</span>
          </div>

          <div style={{ fontSize: '2.8rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
            {notesContributed}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Notes contributed to the pool
          </div>
        </div>
      </div>

      {/* Philosophy Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem' }}>How Accountability & Streaks Work</h3>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.92rem', paddingLeft: '20px' }}>
          <li>Every completed 25-minute Pomodoro cycle in a study room increments your streak.</li>
          <li>Leaving a room mid-cycle will break your streak, encouraging complete focus.</li>
          <li>Your study records are tied only to this browser session — zero public names or surveillance.</li>
        </ul>

        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button 
            className="btn btn-primary"
            onClick={() => onNavigate('rooms')}
          >
            <span>Start a Focus Session</span>
            <ArrowRight size={16} />
          </button>

          <button 
            className="btn btn-secondary"
            onClick={() => onNavigate('courses')}
          >
            <span>Browse Verified Notes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
