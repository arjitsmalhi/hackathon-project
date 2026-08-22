import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, SkipForward, Video, VideoOff, 
  Mic, MicOff, Users, MessageSquare, Share2, LogOut, Settings, 
  Check, Sparkles, AlertCircle, Volume2, FastForward, Activity 
} from 'lucide-react';
import { io } from 'socket.io-client';
import { getAnonymousSessionId } from '../services/api';
import { soundEffects } from '../services/audio';

export function StudyRoomPage({ 
  roomCode, 
  onLeaveRoom, 
  onTriggerPostSession 
}) {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [pomodoro, setPomodoro] = useState({
    phase: 'focus',
    timeRemaining: 25 * 60,
    duration: 25 * 60,
    isRunning: false,
    cycleCount: 0,
    settings: { focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, cyclesBeforeLongBreak: 4 }
  });

  // Media States
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [mediaError, setMediaError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // In-room Panels
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'participants' | 'settings'
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Custom Settings Modal
  const [tempFocusMins, setTempFocusMins] = useState(25);
  const [tempBreakMins, setTempBreakMins] = useState(5);

  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  const sessionId = getAnonymousSessionId();

  // Socket Connection & Realtime Sync
  useEffect(() => {
    const socket = const socket = io(import.meta.env.VITE_API_URL || '/', {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.emit('join-room', {
      roomCode,
      sessionId
    });

    socket.on('room-state', ({ room }) => {
      setRoom(room);
      setParticipants(room.participants || []);
      if (room.pomodoro) {
        setPomodoro(room.pomodoro);
        if (room.pomodoro.settings) {
          setTempFocusMins(room.pomodoro.settings.focusMinutes);
          setTempBreakMins(room.pomodoro.settings.breakMinutes);
        }
      }
    });

    socket.on('pomodoro-sync', (updatedPomodoro) => {
      setPomodoro(updatedPomodoro);
    });

    socket.on('pomodoro-phase-changed', ({ pomodoro: updated, transition }) => {
      setPomodoro(updated);
      if (transition.includes('focus->') || transition === 'skip') {
        soundEffects.playBreakStart();
      } else {
        soundEffects.playFocusStart();
      }
    });

    // Signature Feature Bridge Event
    socket.on('focus-cycle-ended', (cycleData) => {
      onTriggerPostSession(cycleData);
    });

    socket.on('room-chat-message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    socket.on('participant-media-toggled', ({ sessionId: pSessionId, type, enabled }) => {
      setParticipants(prev =>
        prev.map(p => {
          if (p.sessionId === pSessionId) {
            return {
              ...p,
              [type === 'camera' ? 'isCameraOn' : 'isMicOn']: enabled
            };
          }
          return p;
        })
      );
    });

    socket.on('room-error', (err) => {
      alert(err.message || 'Room error');
      onLeaveRoom();
    });

    return () => {
      if (socket) {
        socket.emit('leave-room');
        socket.disconnect();
      }
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [roomCode]);

  // Smooth Local 1-Second Countdown Ticker
  useEffect(() => {
    if (!pomodoro.isRunning) return;

    const interval = setInterval(() => {
      setPomodoro(prev => {
        if (!prev.isRunning || prev.timeRemaining <= 0) return prev;
        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pomodoro.isRunning]);

  // Attach local video stream whenever video element mounts or localStream changes
  useEffect(() => {
    if (localVideoRef.current && localStream && isCameraOn) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [isCameraOn, localStream]);

  // Setup Realtime Microphone Visualizer to detect sound input
  const setupAudioAnalyser = (stream) => {
    try {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);
        setIsSpeaking(normalized > 12);

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('Microphone analyzer setup skipped', e);
    }
  };

  // Robust Camera Toggle with MediaStream track management
  const toggleCamera = async () => {
    setMediaError(null);

    if (isCameraOn) {
      // Turn camera off
      if (localStream) {
        localStream.getVideoTracks().forEach(t => {
          t.stop();
          localStream.removeTrack(t);
        });
      }
      setIsCameraOn(false);
      if (socketRef.current) {
        socketRef.current.emit('toggle-media', { type: 'camera', enabled: false });
      }
    } else {
      // Turn camera on
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });

        const newVideoTrack = videoStream.getVideoTracks()[0];

        let combinedStream = localStream;
        if (!combinedStream) {
          combinedStream = new MediaStream([newVideoTrack]);
        } else {
          combinedStream.addTrack(newVideoTrack);
        }

        setLocalStream(combinedStream);
        setIsCameraOn(true);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = combinedStream;
          localVideoRef.current.play().catch(() => {});
        }

        if (socketRef.current) {
          socketRef.current.emit('toggle-media', { type: 'camera', enabled: true });
        }
      } catch (err) {
        console.error('Camera access error:', err);
        setMediaError('Camera permission was denied or device is not available. Please allow camera access in browser settings.');
        setIsCameraOn(false);
      }
    }
  };

  // Robust Microphone Toggle with Audio Analyzer
  const toggleMic = async () => {
    setMediaError(null);

    if (isMicOn) {
      // Mute mic
      if (localStream) {
        localStream.getAudioTracks().forEach(t => {
          t.stop();
          localStream.removeTrack(t);
        });
      }
      setIsMicOn(false);
      setIsSpeaking(false);
      setAudioLevel(0);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (socketRef.current) {
        socketRef.current.emit('toggle-media', { type: 'mic', enabled: false });
      }
    } else {
      // Unmute mic
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newAudioTrack = audioStream.getAudioTracks()[0];

        let combinedStream = localStream;
        if (!combinedStream) {
          combinedStream = new MediaStream([newAudioTrack]);
        } else {
          combinedStream.addTrack(newAudioTrack);
        }

        setLocalStream(combinedStream);
        setIsMicOn(true);

        // Start live volume/speech detector
        setupAudioAnalyser(combinedStream);

        if (socketRef.current) {
          socketRef.current.emit('toggle-media', { type: 'mic', enabled: true });
        }
      } catch (err) {
        console.error('Microphone access error:', err);
        setMediaError('Microphone permission was denied or no microphone found. Please allow microphone access in browser settings.');
        setIsMicOn(false);
      }
    }
  };

  // Pomodoro Controls
  const handleTimerAction = (action) => {
    if (socketRef.current) {
      socketRef.current.emit('pomodoro-control', { action });
    }
  };

  const handleUpdateTimerSettings = (e) => {
    e.preventDefault();
    if (socketRef.current) {
      socketRef.current.emit('pomodoro-control', {
        action: 'update-settings',
        settings: {
          focusMinutes: Number(tempFocusMins),
          breakMinutes: Number(tempBreakMins),
          longBreakMinutes: 15
        }
      });
      setActiveTab('chat');
    }
  };

  const handleFastForward = () => {
    if (socketRef.current) {
      socketRef.current.emit('pomodoro-control', { action: 'skip' });
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit('room-chat', { message: chatInput.trim() });
    setChatInput('');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyRoomLink = () => {
    const url = `${window.location.origin}/?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Timer Math for Circular Progress
  const minutes = Math.floor(pomodoro.timeRemaining / 60);
  const seconds = pomodoro.timeRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalDuration = pomodoro.duration || (25 * 60);
  const progressRatio = Math.max(0, Math.min(1, (totalDuration - pomodoro.timeRemaining) / totalDuration));
  const strokeDashoffset = 2 * Math.PI * 90 * (1 - progressRatio);

  const isBreak = pomodoro.phase === 'short_break' || pomodoro.phase === 'long_break';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Room Header Strip */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '14px',
        padding: '12px 20px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)'
      }}>
        {/* Course Info, Room Name & Code */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-code" style={{ fontSize: '0.85rem' }}>{room?.courseCode || 'Course'}</span>
              <span style={{ fontWeight: 700, fontSize: '1.15rem' }}>{room?.roomName || room?.courseName || 'Focus Room'}</span>
              {room?.roomName && room?.roomName !== `${room?.courseCode} Focus Session` && (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>({room?.courseName})</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Code:</span>
            <button
              onClick={copyRoomCode}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--accent-primary)',
                fontSize: '0.9rem'
              }}
              title="Click to copy 6-character room code"
            >
              <span>{roomCode}</span>
              {copiedCode ? <Check size={13} color="#10b981" /> : <Share2 size={13} />}
            </button>
          </div>
        </div>

        {/* Action Controls: Share Link & Leave Room */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={copyRoomLink}
            id="copy-room-link-btn"
          >
            {copiedLink ? <Check size={14} color="#10b981" /> : <Share2 size={14} />}
            <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
          </button>

          <button 
            className="btn btn-danger btn-sm"
            onClick={onLeaveRoom}
            id="leave-room-btn"
          >
            <LogOut size={14} />
            <span>Leave Room</span>
          </button>
        </div>
      </div>

      {mediaError && (
        <div style={{ 
          padding: '10px 16px', 
          borderRadius: 'var(--radius-sm)', 
          background: 'var(--accent-warning-bg)', 
          border: '1px solid var(--accent-warning-border)',
          color: '#fbbf24',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={17} />
          <span>{mediaError}</span>
        </div>
      )}

      {/* Main Study Room Layout: Left (Pomodoro & Video) | Right (Chat & Participants) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Column: Synced Pomodoro & Video Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Server-Synced Pomodoro Display Card */}
          <div className="card" style={{ 
            textAlign: 'center', 
            padding: '24px 20px', 
            background: isBreak ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.08), var(--bg-surface))' : 'linear-gradient(180deg, rgba(99, 102, 241, 0.08), var(--bg-surface))',
            borderColor: isBreak ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'
          }}>
            {/* Phase Badge */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
              <span className={`badge ${isBreak ? 'badge-phase-break' : 'badge-phase-focus'}`}>
                {pomodoro.phase === 'focus' 
                  ? `Focus Block (Cycle #${pomodoro.cycleCount + 1})` 
                  : pomodoro.phase === 'long_break' 
                  ? 'Long Break (15m)' 
                  : 'Short Break (5m)'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {pomodoro.isRunning ? '● Realtime Synced' : 'Paused'}
              </span>
            </div>

            {/* Circular Gauge */}
            <div className="timer-gauge-container">
              <svg className="timer-svg" viewBox="0 0 200 200">
                <circle className="timer-circle-bg" cx="100" cy="100" r="90" />
                <circle 
                  className={`timer-circle-progress ${isBreak ? 'break-mode' : ''}`}
                  cx="100" 
                  cy="100" 
                  r="90" 
                  style={{
                    strokeDasharray: 2 * Math.PI * 90,
                    strokeDashoffset: strokeDashoffset,
                    transition: 'stroke-dashoffset 0.8s ease'
                  }}
                />
              </svg>

              <div className="timer-center-content">
                <div className="timer-time-digits">{formattedTime}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {pomodoro.phase.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Pomodoro Shared Control Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
              {pomodoro.isRunning ? (
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleTimerAction('pause')}
                  id="pomodoro-pause-btn"
                >
                  <Pause size={16} />
                  <span>Pause</span>
                </button>
              ) : (
                <button 
                  className="btn btn-primary"
                  onClick={() => handleTimerAction('start')}
                  id="pomodoro-start-btn"
                >
                  <Play size={16} />
                  <span>Start Cycle</span>
                </button>
              )}

              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => handleTimerAction('reset')}
                title="Reset timer to start of current phase"
                id="pomodoro-reset-btn"
              >
                <RotateCcw size={15} />
                <span>Reset</span>
              </button>

              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleFastForward}
                title="Complete current cycle and trigger post-session prompt"
                id="pomodoro-skip-btn"
              >
                <FastForward size={15} color="var(--accent-primary)" />
                <span>Finish Cycle (Demo)</span>
              </button>
            </div>
          </div>

          {/* Video & Media Experience */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video size={17} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.05rem' }}>Live Study Pod ({participants.length} Active)</h3>
              </div>

              {/* Media Toggles */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className={`btn btn-sm ${isCameraOn ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={toggleCamera}
                  id="toggle-camera-btn"
                >
                  {isCameraOn ? <Video size={14} /> : <VideoOff size={14} />}
                  <span>{isCameraOn ? 'Camera On' : 'Turn Camera On'}</span>
                </button>

                <button 
                  className={`btn btn-sm ${isMicOn ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={toggleMic}
                  id="toggle-mic-btn"
                >
                  {isMicOn ? <Mic size={14} /> : <MicOff size={14} />}
                  <span>{isMicOn ? 'Mic On' : 'Turn Mic On'}</span>
                </button>
              </div>
            </div>

            {/* Video Tiles Grid */}
            <div className="video-grid">
              {/* Local Participant Tile */}
              <div 
                className="video-tile"
                style={{
                  border: isSpeaking 
                    ? '2px solid var(--accent-success)' 
                    : isCameraOn 
                    ? '1px solid var(--accent-primary)' 
                    : '1px solid var(--border-subtle)',
                  boxShadow: isSpeaking ? '0 0 16px rgba(16, 185, 129, 0.4)' : 'none',
                  transition: 'border 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {isCameraOn ? (
                  <video 
                    ref={(el) => {
                      localVideoRef.current = el;
                      if (el && localStream && isCameraOn && el.srcObject !== localStream) {
                        el.srcObject = localStream;
                      }
                    }}
                    autoPlay 
                    playsInline 
                    muted 
                    className="video-element" 
                  />
                ) : (
                  <div className="video-tile-placeholder">
                    <div className="avatar-circle">You</div>
                    <span style={{ fontSize: '0.85rem' }}>Camera Off</span>
                  </div>
                )}

                {/* Local Status Overlay */}
                <div className="video-tile-overlay">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>You (Anonymous)</span>
                    {isMicOn ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: isSpeaking ? '#10b981' : '#a5b4fc', fontSize: '0.75rem', fontWeight: 600 }}>
                        <Mic size={12} color="#10b981" />
                        {isSpeaking ? 'Speaking' : 'Mic Active'}
                      </span>
                    ) : (
                      <MicOff size={12} color="#f87171" />
                    )}
                  </div>
                </div>
              </div>

              {/* Other Active Participants */}
              {participants.filter(p => p.sessionId !== sessionId).map(p => (
                <div key={p.socketId || p.sessionId} className="video-tile">
                  <div className="video-tile-placeholder">
                    <div className="avatar-circle">{p.displayName?.replace('Student ', 'S') || 'S'}</div>
                    <span style={{ fontSize: '0.85rem' }}>Focusing...</span>
                  </div>
                  <div className="video-tile-overlay">
                    <span>{p.displayName || 'Student'}</span>
                    {p.isMicOn ? <Mic size={12} color="#10b981" /> : <MicOff size={12} color="#f87171" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Chat, Participants & Settings Tabs */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '580px', padding: 0, overflow: 'hidden' }}>
          {/* Tab Header */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-elevated)' }}>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                flex: 1,
                padding: '12px 10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: activeTab === 'chat' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'chat' ? '2px solid var(--accent-primary)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <MessageSquare size={14} />
              <span>Check-in</span>
            </button>

            <button
              onClick={() => setActiveTab('participants')}
              style={{
                flex: 1,
                padding: '12px 10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: activeTab === 'participants' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'participants' ? '2px solid var(--accent-primary)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Users size={14} />
              <span>Roster ({participants.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              style={{
                flex: 1,
                padding: '12px 10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: activeTab === 'settings' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'settings' ? '2px solid var(--accent-primary)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Settings size={14} />
              <span>Timer</span>
            </button>
          </div>

          {/* Tab 1: Room Chat / Check-in */}
          {activeTab === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', padding: '16px' }}>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>
                  Share what you're working on for accountability.
                </div>

                {chatMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '40px' }}>
                    No messages yet. Post your study goal!
                  </div>
                ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{msg.sender}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div style={{ 
                        background: 'var(--bg-surface-elevated)', 
                        padding: '8px 12px', 
                        borderRadius: 'var(--radius-sm)', 
                        fontSize: '0.88rem',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <input
                  type="text"
                  placeholder="Set goal e.g. review lecture 4..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.88rem' }}
                  id="room-chat-input"
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={!chatInput.trim()}>
                  Send
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: Participants Roster */}
          {activeTab === 'participants' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                All participants are anonymized to eliminate performance anxiety.
              </div>

              {participants.map((p, idx) => (
                <div key={p.socketId || idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      background: p.sessionId === sessionId ? 'var(--accent-primary)' : '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: '#fff'
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                        {p.displayName} {p.sessionId === sessionId ? '(You)' : ''}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        In focus session
                      </div>
                    </div>
                  </div>

                  <span className="status-dot" />
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Timer Customization Settings */}
          {activeTab === 'settings' && (
            <form onSubmit={handleUpdateTimerSettings} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ fontSize: '0.95rem' }}>Pomodoro Settings</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Updates interval durations for everyone currently in this room.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '4px' }}>Focus Duration (minutes)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="90" 
                  value={tempFocusMins} 
                  onChange={e => setTempFocusMins(e.target.value)} 
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '4px' }}>Break Duration (minutes)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="30" 
                  value={tempBreakMins} 
                  onChange={e => setTempBreakMins(e.target.value)} 
                  style={{ width: '100%' }}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: '10px' }}>
                Apply to Room
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
