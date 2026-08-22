import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, CheckCircle, AlertTriangle, 
  Search, Users, ThumbsUp, Flag, Tag, Sparkles, Share2, Copy, Check 
} from 'lucide-react';
import { api } from '../services/api';

export function CourseNotesFeedPage({ 
  course, 
  onBack, 
  onOpenUpload, 
  onStartRoom, 
  onSelectNote 
}) {
  const [notes, setNotes] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [votingId, setVotingId] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadNotesAndVotes();
  }, [course.id]);

  const loadNotesAndVotes = async () => {
    try {
      setLoading(true);
      const [notesData, votesData] = await Promise.all([
        api.getNotes({ courseId: course.id }),
        api.getUserVotes()
      ]);
      setNotes(notesData);
      setUserVotes(votesData || {});
    } catch (err) {
      console.error('Failed to fetch course notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (e, noteId, type) => {
    e.stopPropagation();
    if (votingId) return;

    setVotingId(noteId);
    try {
      const response = await api.voteNote(noteId, type);
      if (response && response.note) {
        // Update local note list
        setNotes(prev =>
          prev
            .map(n => (n.id === noteId ? response.note : n))
            .sort((a, b) => b.confidenceScore - a.confidenceScore)
        );
        // Update user's vote state
        setUserVotes(prev => {
          const updated = { ...prev };
          if (response.userVote) {
            updated[noteId] = response.userVote;
          } else {
            delete updated[noteId];
          }
          return updated;
        });
      }
    } catch (err) {
      alert(err.message || 'Voting failed');
    } finally {
      setVotingId(null);
    }
  };

  const allTags = ['All', ...new Set(notes.flatMap(n => n.tags || []))];

  const filteredNotes = notes.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedTag === 'All' || (n.tags && n.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  const handleCopyCourseLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Breadcrumb & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={onBack}
          id="back-to-courses-btn"
        >
          <ArrowLeft size={16} />
          <span>All Courses</span>
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleCopyCourseLink}
            title="Share this course notes feed"
          >
            {copiedLink ? <Check size={14} color="#10b981" /> : <Share2 size={14} />}
            <span>{copiedLink ? 'Link Copied' : 'Share Feed'}</span>
          </button>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => onStartRoom(course)}
            id="start-course-room-btn"
          >
            <Users size={15} />
            <span>Start Study Room</span>
          </button>

          <button 
            className="btn btn-primary btn-sm"
            onClick={() => onOpenUpload(course.id)}
            id="upload-note-header-btn"
          >
            <Plus size={16} />
            <span>Upload Note</span>
          </button>
        </div>
      </div>

      {/* Course Banner Info */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-surface-elevated), var(--bg-surface))', borderColor: 'var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="badge badge-code" style={{ fontSize: '0.85rem' }}>{course.code}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{course.department || 'General'}</span>
            </div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{course.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '700px' }}>
              {course.description || 'Open crowd-verified repository. Notes are scored by peer consensus, completely identity-free.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-surface)', padding: '12px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{notes.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Notes Pool</div>
            </div>
            <div style={{ width: 1, backgroundColor: 'var(--border-subtle)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-success)' }}>
                {notes.reduce((acc, n) => acc + (n.confirmCount || 0), 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Confirmations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Tag Filter Strip */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search notes in this course..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '38px' }}
            id="notes-search-input"
          />
        </div>

        {allTags.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  backgroundColor: selectedTag === tag ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                  color: selectedTag === tag ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div className="pulse-active">Loading notes feed...</div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <Sparkles size={36} color="var(--accent-primary)" style={{ opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.2rem' }}>No notes found for this course</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '460px' }}>
            Be the first student to upload a key concept, formula sheet, or study summary for your peers!
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => onOpenUpload(course.id)}
            id="empty-upload-note-btn"
          >
            <Plus size={16} />
            <span>Upload First Note</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredNotes.map(note => {
            const userVote = userVotes[note.id];
            const isConfirmed = note.confidenceScore >= 5;
            const isDisputed = (note.flagCount >= 3 && note.confidenceScore <= -1) || (note.flagCount - note.confirmCount >= 3);

            return (
              <div
                key={note.id}
                className="card card-clickable"
                onClick={() => onSelectNote(note)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderLeft: isDisputed 
                    ? '4px solid var(--accent-warning)' 
                    : isConfirmed 
                    ? '4px solid var(--accent-success)' 
                    : '1px solid var(--border-subtle)'
                }}
                id={`note-card-${note.id}`}
              >
                {/* Note Header & Confidence Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {isConfirmed && (
                        <span className="badge badge-confirmed">
                          <CheckCircle size={12} />
                          Confirmed
                        </span>
                      )}
                      {isDisputed && (
                        <span className="badge badge-disputed">
                          <AlertTriangle size={12} />
                          Disputed (Check Accuracy)
                        </span>
                      )}
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', marginTop: '2px', color: 'var(--text-primary)' }}>
                      {note.title}
                    </h3>
                  </div>

                  {/* Confidence Score Pill */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    minWidth: '58px',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: note.confidenceScore > 0 ? 'var(--accent-success-bg)' : note.confidenceScore < 0 ? 'var(--accent-danger-bg)' : 'var(--bg-surface-elevated)',
                    border: `1px solid ${note.confidenceScore > 0 ? 'var(--accent-success-border)' : note.confidenceScore < 0 ? 'var(--accent-danger-border)' : 'var(--border-subtle)'}`
                  }}>
                    <span style={{ 
                      fontSize: '1.15rem', 
                      fontWeight: 800, 
                      color: note.confidenceScore > 0 ? 'var(--accent-success)' : note.confidenceScore < 0 ? 'var(--accent-danger)' : 'var(--text-secondary)' 
                    }}>
                      {note.confidenceScore > 0 ? `+${note.confidenceScore}` : note.confidenceScore}
                    </span>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Score
                    </span>
                  </div>
                </div>

                {/* Content Preview */}
                <p style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.92rem', 
                  lineHeight: 1.55,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  whiteSpace: 'pre-line'
                }}>
                  {note.content}
                </p>

                {/* Footer: Tags & Vote Actions (Identity-Free) */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  paddingTop: '10px', 
                  borderTop: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  {/* Tag Pills */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {note.tags && note.tags.map(tag => (
                      <span key={tag} style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        fontSize: '0.75rem', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        background: 'var(--bg-surface-elevated)', 
                        color: 'var(--text-muted)' 
                      }}>
                        <Tag size={11} />
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Voting Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Confirm Vote Button */}
                    <button
                      className="btn btn-sm"
                      style={{
                        backgroundColor: userVote === 'confirm' ? 'var(--accent-success)' : 'var(--bg-surface-elevated)',
                        color: userVote === 'confirm' ? '#fff' : 'var(--text-secondary)',
                        border: `1px solid ${userVote === 'confirm' ? 'var(--accent-success)' : 'var(--border-subtle)'}`
                      }}
                      onClick={e => handleVote(e, note.id, 'confirm')}
                      disabled={votingId === note.id}
                      title="Confirm this note is accurate"
                      id={`confirm-vote-btn-${note.id}`}
                    >
                      <ThumbsUp size={13} />
                      <span>Confirm ({note.confirmCount || 0})</span>
                    </button>

                    {/* Flag Vote Button */}
                    <button
                      className="btn btn-sm"
                      style={{
                        backgroundColor: userVote === 'flag' ? 'var(--accent-danger)' : 'var(--bg-surface-elevated)',
                        color: userVote === 'flag' ? '#fff' : 'var(--text-muted)',
                        border: `1px solid ${userVote === 'flag' ? 'var(--accent-danger)' : 'var(--border-subtle)'}`
                      }}
                      onClick={e => handleVote(e, note.id, 'flag')}
                      disabled={votingId === note.id}
                      title="Flag as inaccurate or outdated"
                      id={`flag-vote-btn-${note.id}`}
                    >
                      <Flag size={13} />
                      <span>Flag ({note.flagCount || 0})</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
