import React, { useState } from 'react';
import { X, ThumbsUp, Flag, CheckCircle, AlertTriangle, Tag, Share2, Check } from 'lucide-react';
import { api } from '../services/api';

export function NoteDetailModal({ 
  note, 
  userVote, 
  onClose, 
  onVoteUpdated 
}) {
  const [currentNote, setCurrentNote] = useState(note);
  const [currentUserVote, setCurrentUserVote] = useState(userVote);
  const [voting, setVoting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isConfirmed = currentNote.confidenceScore >= 5;
  const isDisputed = (currentNote.flagCount >= 3 && currentNote.confidenceScore <= -1) || (currentNote.flagCount - currentNote.confirmCount >= 3);

  const handleVote = async (type) => {
    if (voting) return;
    try {
      setVoting(true);
      const res = await api.voteNote(currentNote.id, type);
      if (res && res.note) {
        setCurrentNote(res.note);
        setCurrentUserVote(res.userVote);
        if (onVoteUpdated) {
          onVoteUpdated(res.note, res.userVote);
        }
      }
    } catch (err) {
      alert(err.message || 'Voting failed');
    } finally {
      setVoting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {isConfirmed && (
                <span className="badge badge-confirmed">
                  <CheckCircle size={12} />
                  Confirmed by Peers
                </span>
              )}
              {isDisputed && (
                <span className="badge badge-disputed">
                  <AlertTriangle size={12} />
                  Disputed
                </span>
              )}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {new Date(currentNote.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <h2 style={{ fontSize: '1.45rem', lineHeight: 1.3 }}>{currentNote.title}</h2>
          </div>

          <button 
            onClick={onClose}
            style={{ color: 'var(--text-muted)', padding: '6px', borderRadius: 'var(--radius-sm)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Note Body Content */}
        <div style={{ 
          background: 'var(--bg-surface-elevated)', 
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '20px',
          margin: '16px 0',
          fontSize: '0.96rem',
          lineHeight: 1.7,
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap'
        }}>
          {currentNote.content}
        </div>

        {/* Tags */}
        {currentNote.tags && currentNote.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {currentNote.tags.map(tag => (
              <span 
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.78rem',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)'
                }}
              >
                <Tag size={11} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingTop: '16px', 
          borderTop: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleCopy}
          >
            {copied ? <Check size={14} color="#10b981" /> : <Share2 size={14} />}
            <span>{copied ? 'Link Copied' : 'Share Note'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-sm"
              style={{
                backgroundColor: currentUserVote === 'confirm' ? 'var(--accent-success)' : 'var(--bg-surface-elevated)',
                color: currentUserVote === 'confirm' ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${currentUserVote === 'confirm' ? 'var(--accent-success)' : 'var(--border-subtle)'}`
              }}
              onClick={() => handleVote('confirm')}
              disabled={voting}
            >
              <ThumbsUp size={14} />
              <span>Confirm Accuracy ({currentNote.confirmCount || 0})</span>
            </button>

            <button
              className="btn btn-sm"
              style={{
                backgroundColor: currentUserVote === 'flag' ? 'var(--accent-danger)' : 'var(--bg-surface-elevated)',
                color: currentUserVote === 'flag' ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${currentUserVote === 'flag' ? 'var(--accent-danger)' : 'var(--border-subtle)'}`
              }}
              onClick={() => handleVote('flag')}
              disabled={voting}
            >
              <Flag size={14} />
              <span>Flag Inaccurate ({currentNote.flagCount || 0})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
