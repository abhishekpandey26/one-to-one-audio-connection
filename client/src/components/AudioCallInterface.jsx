import { useState, useEffect } from 'react';
import './AudioCallInterface.css';

const AudioCallInterface = ({
    currentRoom,
    onEndCall,
    isAudioMuted,
    onToggleMuteAudio,
    localAudioRef,
    remoteAudioRef,
}) => {
    const [callDuration, setCallDuration] = useState(0);
    const [isPulsing, setIsPulsing] = useState(true);

    // Call duration timer
    useEffect(() => {
        const interval = setInterval(() => {
            setCallDuration((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Format duration as MM:SS
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="audio-call-container">
            {/* Hidden audio elements */}
            <audio ref={localAudioRef} autoPlay muted />
            <audio ref={remoteAudioRef} autoPlay />

            <div className="audio-call-content">
                {/* Audio visualization */}
                <div className="audio-visual">
                    <div className={`audio-pulse ${isPulsing ? 'active' : ''}`}>
                        <div className="pulse-ring pulse-ring-1"></div>
                        <div className="pulse-ring pulse-ring-2"></div>
                        <div className="pulse-ring pulse-ring-3"></div>
                        <div className="audio-icon">🎤</div>
                    </div>
                </div>

                {/* Call info */}
                <div className="audio-call-info">
                    <h2>Audio Call in Progress</h2>
                    <p className="room-name">Room: {currentRoom}</p>
                    <p className="call-duration">{formatDuration(callDuration)}</p>
                </div>

                {/* Call controls */}
                <div className="audio-controls">
                    <button
                        className={`control-btn ${isAudioMuted ? 'muted' : ''}`}
                        onClick={onToggleMuteAudio}
                        title={isAudioMuted ? 'Unmute' : 'Mute'}
                    >
                        {isAudioMuted ? '🔇' : '🎤'}
                        <span>{isAudioMuted ? 'Unmute' : 'Mute'}</span>
                    </button>

                    <button
                        className="control-btn end-call-btn"
                        onClick={onEndCall}
                        title="End Call"
                    >
                        📞
                        <span>End Call</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AudioCallInterface;
