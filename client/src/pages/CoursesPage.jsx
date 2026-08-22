import React, { useState, useEffect } from 'react';
import { Search, Plus, BookOpen, Users, FileText, Sparkles, Filter } from 'lucide-react';
import { api } from '../services/api';

export function CoursesPage({ onSelectCourse, onStartRoomForCourse }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await api.getCourses();
      setCourses(data);
    } catch (err) {
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCode || !newName) return;
    try {
      setCreating(true);
      const created = await api.createCourse({
        code: newCode,
        name: newName,
        department: newDept,
        description: newDesc
      });
      setCourses(prev => [...prev, { ...created, noteCount: 0, topScore: 0 }]);
      setShowAddCourse(false);
      setNewCode('');
      setNewName('');
      setNewDept('');
      setNewDesc('');
      onSelectCourse(created);
    } catch (err) {
      alert(err.message || 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  const departments = ['All', ...new Set(courses.map(c => c.department || 'General'))];

  const filteredCourses = courses.filter(c => {
    const matchesSearch = 
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = selectedDept === 'All' || (c.department || 'General') === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>Course Catalog</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Select a course to view anonymous crowd-verified notes or start a study room.
          </p>
        </div>

        <button 
          className="btn btn-secondary"
          onClick={() => setShowAddCourse(true)}
          id="add-course-btn"
        >
          <Plus size={16} />
          <span>Add Course</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
          <Search size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by course code or title (e.g. CS 101, Linear Algebra)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '40px' }}
            id="course-search-input"
          />
        </div>

        {/* Department Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 500,
                backgroundColor: selectedDept === dept ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                color: selectedDept === dept ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Course List Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div className="pulse-active" style={{ fontSize: '1.1rem' }}>Loading verified course database...</div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>No matching courses found.</p>
          <button 
            className="btn btn-primary btn-sm" 
            style={{ marginTop: '16px' }}
            onClick={() => setShowAddCourse(true)}
          >
            Create Course "{search}"
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {filteredCourses.map(course => (
            <div 
              key={course.id}
              className="card card-clickable"
              onClick={() => onSelectCourse(course)}
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}
              id={`course-card-${course.code.replace(/\s+/g, '-').toLowerCase()}`}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="badge badge-code">{course.code}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{course.department || 'General'}</span>
                </div>

                <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', lineHeight: 1.3 }}>{course.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {course.description || 'Verified course study pool and active focus sessions.'}
                </p>
              </div>

              {/* Bottom Actions & Metadata */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <FileText size={15} color="var(--accent-primary)" />
                  <span><strong>{course.noteCount || 0}</strong> {course.noteCount === 1 ? 'note' : 'notes'}</span>
                </div>

                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartRoomForCourse(course);
                  }}
                  title="Start a study room for this course"
                  id={`start-room-btn-${course.code.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <Users size={14} />
                  <span>Start Room</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Course Modal */}
      {showAddCourse && (
        <div className="modal-backdrop" onClick={() => setShowAddCourse(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '8px' }}>Add a New Course</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Create an open study hub for your course where peers can share and verify notes.
            </p>

            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Course Code <span style={{ color: 'var(--accent-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS 330, CHEM 102"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Course Name <span style={{ color: 'var(--accent-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Operating Systems & Kernel Architecture"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science, Mathematics"
                  value={newDept}
                  onChange={e => setNewDept(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Short Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Key topics covered in this course..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddCourse(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={creating || !newCode || !newName}
                >
                  {creating ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
