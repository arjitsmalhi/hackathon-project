import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, CheckCircle, AlertTriangle, 
  Search, Users, ThumbsUp, Flag, Tag, Sparkles, Share2, Check,
  ArrowUpDown, Clock, TrendingUp, ShieldCheck, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

// Computes a trust percentage from confirms and flags
function getTrustPercent(confirmCount = 0, flagCount = 0) {
  const total = confirmCount + flagCount;
  if (total === 0) return null; // Not enough data
  return Math.round((confirmCount / total) * 100);
}

function TrustBar({ confirmCount = 0, flagCount = 0, score = 0 }) {
  const pct = getTrustPercent(confirmCount, flagCount);

  const color = pct === null
    ? '#64748b'
    : pct >= 80
    ? '#10b981'
    : pct >= 50
    ? '#3b82f6'
    : '#ef4444';

  const label = pct === null
    ? 'Unverified'
    : pct >= 80
    ? `${pct}% Trusted`
    : pct >= 50
    ? `${pct}% Trusted`
    : `${pct}% Trust — Check Accuracy`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '140px' }}>
      {/* Label row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          {label}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: '5px',
        borderRadius: '99px',
        background: 'var(--bg-surface-elevated)',
        overflow: 'hidden',
        width: '100%'
      }}>
        <div style={{
          height: '100%',
          width: pct !== null ? `${pct}%` : '0%',
          background: color,
          borderRadius: '99px',
          transition: 'width 0.5s ease'
        }} />
      </div>

      {/* Upvote / Downvote raw counts */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <span style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <ThumbsUp size={10} /> {confirmCount}
        </span>
        <span style={{ fontSize: '0.72rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Flag size={10} /> {flagCount}
        </span>
      </div>
    </div>
  );
}

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
  const [sortBy, setSortBy] = useState('credibility'); // 'credibility' | 'newest' | 'oldest'
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
        setNotes(prev =>
          prev.map(n => (n.id === noteId ? response.note : n))
        );
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

  const filtered = notes.filter(n => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.tags && n.tags.some(t => t.toLowerCase().includes(q)));
    const matchesTag = selectedTag === 'All' || (n.tags && n.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  const sortedNotes = [...filtered].sort((a, b) => {
    if (sortBy === 'credibility') return b.confidenceScore - a.confidenceScore;
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    return 0;
  });

  const totalConfirms = notes.reduce((acc, n) => acc + (n.confirmCount || 0), 0);
  const totalFlags = notes.reduce((acc, n) => acc + (n.flagCount || 0), 0);
  const poolTrust = getTrustPercent(totalConfirms, totalFlags);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack} id="back-to-courses-btn">
          <ArrowLeft size={16} />
          <span>All Courses</span>
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(window.location.href); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }}>
            {copiedLink ? <Check size={14} color="#10b981" /> : <Share2 size={14} />}
            <span>{copiedLink ? 'Copied!' : 'Share Feed'}</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onStartRoom(course)} id="start-course-room-btn">
            <Users size={14} />
            <span>Study Room</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onOpenUpload(course.id)} id="upload-note-header-btn">
            <Plus size={15} />
            <span>Upload Note</span>
          </button>
        </div>
      </div>

      {/* Course Banner */}
      <div className="card" style={{ padding: '22px 24px', background: 'linear-gradient(120deg, var(--bg-surface-elevated) 0%, var(--bg-surface) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '18px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-code" style={{ fontSize: '0.85rem' }}>{course.code}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{course.department || 'General'}</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>{course.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '640px', lineHeight: 1.6 }}>
              {course.description || 'Open crowd-verified notes repository. Accuracy is determined purely by peer consensus — completely identity-free.'}
            </p>
          </div>

          {/* Pool Stats */}
          <div style={{ display: 'flex', gap: '0', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
            {[
              { value: notes.length, label: 'Notes' },
              { value: totalConfirms, label: 'Confirms', color: '#10b981' },
              { value: poolTrust !== null ? `${poolTrust}%` : '—', label: 'Pool Trust', color: poolTrust >= 80 ? '#10b981' : poolTrust >= 50 ? '#3b82f6' : poolTrust !== null ? '#ef4444' : undefined }
            ].map((stat, i) => (
              <div key={i} style={{
                textAlign: 'center',
                padding: '14px 20px',
                borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none'
              }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: stat.color || 'var(--text-primary)' }}>{stat.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search + Tag Filter + Sort Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Search + Sort row */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search notes, topics, keywords..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '38px' }}
              id="notes-search-input"
            />
          </div>

          {/* Sort Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
            {[
              { key: 'credibility', label: 'Top Rated', icon: <TrendingUp size={13} /> },
              { key: 'newest', label: 'Newest', icon: <Clock size={13} /> },
              { key: 'oldest', label: 'Oldest', icon: <ArrowUpDown size={13} /> }
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '7px 13px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: sortBy === opt.key ? '#fff' : 'var(--text-muted)',
                  background: sortBy === opt.key ? 'var(--accent-primary)' : 'transparent',
                  transition: 'all 0.15s ease',
                  borderRight: '1px solid var(--border-subtle)',
                  whiteSpace: 'nowrap'
                }}
                id={`sort-${opt.key}-btn`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tag Filters */}
        {allTags.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  backgroundColor: selectedTag === tag ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                  color: selectedTag === tag ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${selectedTag === tag ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  transition: 'all 0.15s ease'
                }}
              >
                {tag === 'All' ? 'All Topics' : tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
      {!loading && (
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{sortedNotes.length} {sortedNotes.length === 1 ? 'note' : 'notes'}</span>
          {search && <span>matching "<strong style={{ color: 'var(--text-secondary)' }}>{search}</strong>"</span>}
          <span>·</span>
          <span>sorted by <strong style={{ color: 'var(--accent-primary)' }}>{sortBy === 'credibility' ? 'Top Rated' : sortBy === 'newest' ? 'Newest First' : 'Oldest First'}</strong></span>
        </div>
      )}

      {/* Notes Feed */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ marginTop: '14px' }}>Loading notes feed...</p>
        </div>
      ) : sortedNotes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '52px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <Sparkles size={38} color="var(--accent-primary)" style={{ opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.2rem' }}>{search ? 'No notes match your search' : 'No notes for this course yet'}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '440px' }}>
            {search ? 'Try different keywords, or browse all topics.' : 'Be the first to upload a key concept, formula sheet, or lecture summary!'}
          </p>
          {!search && (
            <button className="btn btn-primary" onClick={() => onOpenUpload(course.id)} id="empty-upload-note-btn">
              <Plus size={16} />
              <span>Upload First Note</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedNotes.map((note, index) => {
            const userVote = userVotes[note.id];
            const trust = getTrustPercent(note.confirmCount, note.flagCount);
            const total = (note.confirmCount || 0) + (note.flagCount || 0);
            const isHighTrust = trust !== null && trust >= 80;
            const isDisputed = trust !== null && trust < 40 && total >= 3;
            const isNew = !total;

            const borderAccent = isDisputed
              ? 'var(--accent-danger)'
              : isHighTrust
              ? 'var(--accent-success)'
              : 'transparent';

            return (
              <div
                key={note.id}
                className="card card-clickable"
                onClick={() => onSelectNote(note)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  borderLeft: `3px solid ${borderAccent}`,
                  transition: 'all 0.2s ease'
                }}
                id={`note-card-${note.id}`}
              >
                {/* Header: Rank + Title + Trust Bar */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  {/* Rank Number */}
                  {sortBy === 'credibility' && (
                    <div style={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: index === 0 ? 'rgba(16,185,129,0.15)' : 'var(--bg-surface-elevated)',
                      border: `1px solid ${index === 0 ? 'rgba(16,185,129,0.3)' : 'var(--border-subtle)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: index === 0 ? '#10b981' : 'var(--text-muted)'
                    }}>
                      #{index + 1}
                    </div>
                  )}

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Status badges + date */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {isHighTrust && (
                        <span className="badge badge-confirmed" style={{ fontSize: '0.7rem' }}>
                          <ShieldCheck size={10} /> Verified
                        </span>
                      )}
                      {isDisputed && (
                        <span className="badge badge-disputed" style={{ fontSize: '0.7rem' }}>
                          <AlertTriangle size={10} /> Disputed
                        </span>
                      )}
                      {isNew && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-surface-elevated)', padding: '2px 7px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                          New
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', lineHeight: 1.3, color: 'var(--text-primary)', margin: 0 }}>
                      {note.title}
                    </h3>
                  </div>

                  {/* Confidence score pill */}
                  <div style={{
                    flexShrink: 0,
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: note.confidenceScore > 0 ? 'rgba(16,185,129,0.1)' : note.confidenceScore < 0 ? 'rgba(239,68,68,0.1)' : 'var(--bg-surface-elevated)',
                    border: `1px solid ${note.confidenceScore > 0 ? 'rgba(16,185,129,0.25)' : note.confidenceScore < 0 ? 'rgba(239,68,68,0.25)' : 'var(--border-subtle)'}`,
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      lineHeight: 1,
                      color: note.confidenceScore > 0 ? '#10b981' : note.confidenceScore < 0 ? '#ef4444' : 'var(--text-secondary)'
                    }}>
                      {note.confidenceScore > 0 ? `+${note.confidenceScore}` : note.confidenceScore}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: '2px' }}>score</div>
                  </div>
                </div>

                {/* Content Preview */}
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  margin: 0
                }}>
                  {note.content}
                </p>

                {/* Footer: Trust bar + tags + vote buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  {/* Left: Trust bar + tags */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <TrustBar confirmCount={note.confirmCount} flagCount={note.flagCount} score={note.confidenceScore} />
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {note.tags && note.tags.slice(0, 4).map(tag => (
                        <span key={tag} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '0.72rem',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: 'var(--bg-surface-elevated)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-subtle)'
                        }}>
                          <Tag size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Vote buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="btn btn-sm"
                      style={{
                        backgroundColor: userVote === 'confirm' ? '#10b981' : 'var(--bg-surface-elevated)',
                        color: userVote === 'confirm' ? '#fff' : 'var(--text-secondary)',
                        border: `1px solid ${userVote === 'confirm' ? '#10b981' : 'var(--border-subtle)'}`,
                        gap: '5px'
                      }}
                      onClick={e => handleVote(e, note.id, 'confirm')}
                      disabled={votingId === note.id}
                      title="Confirm this note is accurate"
                      id={`confirm-vote-btn-${note.id}`}
                    >
                      <ThumbsUp size={13} />
                      <span>{note.confirmCount || 0}</span>
                    </button>

                    <button
                      className="btn btn-sm"
                      style={{
                        backgroundColor: userVote === 'flag' ? '#ef4444' : 'var(--bg-surface-elevated)',
                        color: userVote === 'flag' ? '#fff' : 'var(--text-muted)',
                        border: `1px solid ${userVote === 'flag' ? '#ef4444' : 'var(--border-subtle)'}`,
                        gap: '5px'
                      }}
                      onClick={e => handleVote(e, note.id, 'flag')}
                      disabled={votingId === note.id}
                      title="Flag as inaccurate"
                      id={`flag-vote-btn-${note.id}`}
                    >
                      <Flag size={13} />
                      <span>{note.flagCount || 0}</span>
                    </button>

                    <button
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '6px 10px',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        background: 'transparent'
                      }}
                      onClick={e => { e.stopPropagation(); onSelectNote(note); }}
                    >
                      Read <ChevronRight size={13} />
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
