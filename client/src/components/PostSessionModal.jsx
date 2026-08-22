import React, { useEffect } from 'react';
import { Sparkles, FileText, CheckCircle2, ArrowRight, X, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../services/audio';

export function PostSessionModal({ 
  cycleData, 
  onAddNote, 
  onConfirmNotes, 
  onSkip 
}) {
  useEffect(() => {
    // Play celebratory chime and fire confetti
    soundEffects.playFocusComplete();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#3b82f6']
      });
    } catch (e) {}
  }, []);

  return (
    <div className="modal-backdrop" onClick={onSkip}>
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: '560px', 
          textAlign: 'center',
          background: 'linear-gradient(180deg, var(--bg-surface-elevated), var(--bg-surface))',
          borderColor: 'rgba(99, 102, 241, 0.4)'
        }}
      >
        {/* Confetti Icon Header */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(16, 185, 129, 0.2))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          border: '1px solid rgba(99, 102, 241, 0.4)'
        }}>
          <Sparkles size={30} color="#10b981" />
        </div>

        <div className="badge badge-confirmed" style={{ margin: '0 auto 12px', padding: '5px 12px' }}>
          <Flame size={13} />
          Focus Cycle {cycleData.completedCycle || 1} Complete!
        </div>

        <h2 style={{ fontSize: '1.75rem', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Connect Your Focus to the Pool
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
          You just finished a focus session for <strong>{cycleData.courseCode || 'your course'}</strong>. Help build the verified notes library for the next student studying this topic.
        </p>

        {/* 3 Core Action Choices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
          {/* Action 1: Upload a Note */}
          <button
            className="btn btn-primary btn-lg"
            onClick={() => onAddNote(cycleData.courseId)}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)'
            }}
            id="post-session-add-note-btn"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={20} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Add a note from this session</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.85, fontWeight: 400 }}>
                  Pre-fills with {cycleData.courseCode}
                </div>
              </div>
            </div>
            <ArrowRight size={18} />
          </button>

          {/* Action 2: Confirm Existing Notes */}
          <button
            className="btn btn-secondary"
            onClick={() => onConfirmNotes(cycleData.courseId)}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '14px 20px',
              borderRadius: 'var(--radius-md)'
            }}
            id="post-session-confirm-notes-btn"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={19} color="#10b981" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Confirm or flag existing notes</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Verify notes your peers uploaded for {cycleData.courseCode}
                </div>
              </div>
            </div>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Action 3: Skip */}
        <div style={{ marginTop: '20px' }}>
          <button
            className="btn btn-sm"
            onClick={onSkip}
            style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}
            id="post-session-skip-btn"
          >
            Skip for now &rarr; continue to break
          </button>
        </div>
      </div>
    </div>
  );
}
