import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseNotesFeedPage } from './pages/CourseNotesFeedPage';
import { StudyRoomLandingPage } from './pages/StudyRoomLandingPage';
import { StudyRoomPage } from './pages/StudyRoomPage';
import { StreaksPage } from './pages/StreaksPage';
import { UploadNoteModal } from './components/UploadNoteModal';
import { NoteDetailModal } from './components/NoteDetailModal';
import { PostSessionModal } from './components/PostSessionModal';
import { api } from './services/api';

export function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeRoomCode, setActiveRoomCode] = useState(null);
  
  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCourseId, setUploadCourseId] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const [postSessionData, setPostSessionData] = useState(null);

  // Check URL params on initial load and initialize signed session
  useEffect(() => {
    api.initSession().then(() => {
      api.getUserVotes().then(votes => setUserVotes(votes || {})).catch(() => {});
    });

    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const courseParam = params.get('course');

    if (roomParam) {
      setActiveRoomCode(roomParam.toUpperCase());
      setCurrentView('in-room');
    } else if (courseParam) {
      api.getCourse(courseParam).then(course => {
        if (course) {
          setSelectedCourse(course);
          setCurrentView('notes-feed');
        }
      }).catch(() => {});
    }
  }, []);

  const handleNavigate = (view) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setCurrentView('notes-feed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartRoomForCourse = (course) => {
    setSelectedCourse(course);
    setCurrentView('rooms');
  };

  const handleJoinRoom = (code) => {
    setActiveRoomCode(code);
    setCurrentView('in-room');
    window.history.pushState({}, '', `?room=${code}`);
  };

  const handleLeaveRoom = () => {
    setActiveRoomCode(null);
    setCurrentView('rooms');
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleOpenUpload = (courseId) => {
    setUploadCourseId(courseId || (selectedCourse ? selectedCourse.id : null));
    setShowUploadModal(true);
  };

  const handleNoteUploaded = (newNote) => {
    setShowUploadModal(false);
    // If currently on notes feed for that course, will refresh
    if (selectedCourse && selectedCourse.id === newNote.courseId) {
      setCurrentView('notes-feed');
    } else {
      api.getCourse(newNote.courseId).then(course => {
        if (course) {
          setSelectedCourse(course);
          setCurrentView('notes-feed');
        }
      });
    }
  };

  // Post Session Bridge Handlers (Signature Connective Flow!)
  const handleTriggerPostSession = (cycleData) => {
    setPostSessionData(cycleData);
  };

  const handlePostSessionAddNote = (courseId) => {
    setPostSessionData(null);
    handleOpenUpload(courseId);
  };

  const handlePostSessionConfirmNotes = (courseId) => {
    setPostSessionData(null);
    api.getCourse(courseId).then(course => {
      if (course) {
        setSelectedCourse(course);
        setCurrentView('notes-feed');
      }
    });
  };

  return (
    <div className="app-container">
      <Header currentView={currentView} onNavigate={handleNavigate} />

      <main className="main-content">
        {currentView === 'landing' && (
          <LandingPage onNavigate={handleNavigate} />
        )}

        {currentView === 'courses' && (
          <CoursesPage 
            onSelectCourse={handleSelectCourse}
            onStartRoomForCourse={handleStartRoomForCourse}
          />
        )}

        {currentView === 'notes-feed' && selectedCourse && (
          <CourseNotesFeedPage 
            course={selectedCourse}
            onBack={() => setCurrentView('courses')}
            onOpenUpload={handleOpenUpload}
            onStartRoom={handleStartRoomForCourse}
            onSelectNote={(note) => setSelectedNote(note)}
          />
        )}

        {currentView === 'rooms' && (
          <StudyRoomLandingPage 
            onJoinRoom={handleJoinRoom}
            prefilledCourse={selectedCourse}
          />
        )}

        {currentView === 'in-room' && activeRoomCode && (
          <StudyRoomPage 
            roomCode={activeRoomCode}
            onLeaveRoom={handleLeaveRoom}
            onTriggerPostSession={handleTriggerPostSession}
          />
        )}

        {currentView === 'streaks' && (
          <StreaksPage onNavigate={handleNavigate} />
        )}
      </main>

      {/* Upload Note Modal */}
      {showUploadModal && (
        <UploadNoteModal 
          prefilledCourseId={uploadCourseId}
          onClose={() => setShowUploadModal(false)}
          onNoteUploaded={handleNoteUploaded}
        />
      )}

      {/* Note Detail Modal */}
      {selectedNote && (
        <NoteDetailModal 
          note={selectedNote}
          userVote={userVotes[selectedNote.id]}
          onClose={() => setSelectedNote(null)}
          onVoteUpdated={(updatedNote, updatedUserVote) => {
            setSelectedNote(updatedNote);
            setUserVotes(prev => ({ ...prev, [updatedNote.id]: updatedUserVote }));
          }}
        />
      )}

      {/* Signature Feature: Post-Session Notes Bridge Modal */}
      {postSessionData && (
        <PostSessionModal 
          cycleData={postSessionData}
          onAddNote={handlePostSessionAddNote}
          onConfirmNotes={handlePostSessionConfirmNotes}
          onSkip={() => setPostSessionData(null)}
        />
      )}
    </div>
  );
}
export default App;
