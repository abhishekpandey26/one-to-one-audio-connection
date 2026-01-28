import { useState, useEffect } from 'react';
import './VideoCallInterface.css';

const VideoCallInterface = ({
    currentRoom,
    onEndCall,
    isAudioMuted,
    isVideoMuted,
    onToggleMuteAudio,
    onToggleMuteVideo,
    localVideoRef,
    remoteVideoRef,
}) => {
    const [callDuration, setCallDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);

    // Call duration timer
    useEffect(() => {
        const interval = setInterval(() => {
            setCallDuration((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Auto-hide controls after 3 seconds of no mouse movement
    useEffect(() => {
        let timeout;
        const handleMouseMove = () => {
            setShowControls(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => setShowControls(false), 3000);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(timeout);
        };
    }, []);

    // Format duration as MM:SS
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="video-call-container">
            {/* Remote video (peer's camera) - main display */}
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="remote-video"
            />

            {/* Local video (your camera) - picture-in-picture */}
            <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`local-video ${isVideoMuted ? 'video-off' : ''}`}
            />

            {/* Video off overlay for local video */}
            {isVideoMuted && (
                <div className="local-video-off-overlay">
                    <div className="video-off-icon">📹</div>
                </div>
            )}

            {/* Top bar with room info and duration */}
            <div className={`video-top-bar ${showControls ? 'visible' : ''}`}>
                <div className="top-bar-info">
                    <span className="room-badge">Room: {currentRoom}</span>
                    <span className="duration-badge">{formatDuration(callDuration)}</span>
                </div>
            </div>

            {/* Bottom controls */}
            <div className={`video-controls ${showControls ? 'visible' : ''}`}>
                <button
                    className={`video-control-btn ${isAudioMuted ? 'muted' : ''}`}
                    onClick={onToggleMuteAudio}
                    title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                    {isAudioMuted ? '🔇' : '🎤'}
                </button>

                <button
                    className={`video-control-btn ${isVideoMuted ? 'muted' : ''}`}
                    onClick={onToggleMuteVideo}
                    title={isVideoMuted ? 'Turn On Video' : 'Turn Off Video'}
                >
                    {isVideoMuted ? '📹' : '📹'}
                </button>

                <button
                    className="video-control-btn end-call"
                    onClick={onEndCall}
                    title="End Call"
                >
                    📞
                </button>
            </div>
        </div>
    );
};

export default VideoCallInterface;
