import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export function UploadNoteModal({ 
  prefilledCourseId, 
  onClose, 
  onNoteUploaded 
}) {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(prefilledCourseId || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['Summary', 'Key Concept']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getCourses().then(data => {
      setCourses(data);
      if (!selectedCourseId && data.length > 0) {
        setSelectedCourseId(prefilledCourseId || data[0].id);
      }
    }).catch(() => {});
  }, [prefilledCourseId]);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/,/g, '');
      if (val && !tags.includes(val) && tags.length < 5) {
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      setError('Please select a course');
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError('Please enter both a title and note content');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const newNote = await api.createNote({
        courseId: selectedCourseId,
        title: title.trim(),
        content: content.trim(),
        tags
      });
      onNoteUploaded(newNote);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to upload note. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem' }}>Upload Study Note</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Contribute anonymous notes. Peer votes determine visibility.
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ color: 'var(--text-muted)', padding: '6px', borderRadius: 'var(--radius-sm)' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '10px 14px', 
            borderRadius: 'var(--radius-sm)', 
            background: 'var(--accent-danger-bg)', 
            border: '1px solid var(--accent-danger-border)',
            color: '#f87171',
            fontSize: '0.88rem',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Course Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Target Course <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              style={{ width: '100%' }}
              required
              id="upload-course-select"
            >
              <option value="" disabled>Select a course...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Note Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Note Title / Topic <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Master Theorem Formulas & Complexity Shortcuts"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              style={{ width: '100%' }}
              id="upload-note-title"
            />
          </div>

          {/* Note Content */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Key Concepts & Content <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <textarea
              rows={7}
              placeholder="Write your study notes, formulas, step-by-step solutions, or exam reminders..."
              value={content}
              onChange={e => setContent(e.target.value)}
              required
              style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
              id="upload-note-content"
            />
          </div>

          {/* Tags */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Topic Tags (Press Enter or comma)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {tags.map(tag => (
                <span 
                  key={tag}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {tag}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeTag(tag)} />
                </span>
              ))}
            </div>
            {tags.length < 5 && (
              <input
                type="text"
                placeholder="Add tag (e.g. Exam Prep, Cheat Sheet)..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                style={{ width: '100%' }}
              />
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting || !title.trim() || !content.trim()}
              id="submit-note-btn"
            >
              {submitting ? 'Publishing...' : 'Publish to Course Hub'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
