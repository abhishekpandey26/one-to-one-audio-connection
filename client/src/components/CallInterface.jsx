import AudioCallInterface from './AudioCallInterface';
import VideoCallInterface from './VideoCallInterface';
import './CallInterface.css';

const CallInterface = ({
    currentRoom,
    userCount,
    canCall,
    isCalling,
    onStartCall,
    onEndCall,
    onLeaveRoom,

    localVideoRef,
    remoteVideoRef,
    localAudioRef,
    remoteAudioRef,
    callType,
    isAudioMuted,
    isVideoMuted,
    onToggleMuteAudio,
    onToggleMuteVideo,
}) => {
    return (
        <div className="call-section">
            {/* Show room info and controls only when not in a call */}
            {!isCalling && (
                <>
                    <div className="room-info">
                        <p>
                            Room: <strong>{currentRoom}</strong>
                        </p>
                        <p>
                            Users: <strong>{userCount}</strong>/2
                        </p>
                    </div>

                    <div className="call-controls">
                        <div className="button-group">
                            <button
                                className="btn btn-primary"
                                onClick={() => onStartCall("audio")}
                                disabled={!canCall}
                            >
                                📞 Start Audio Call
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={() => onStartCall("video")}
                                disabled={!canCall}
                            >
                                📹 Start Video Call
                            </button>
                        </div>

                        <button className="btn btn-secondary" onClick={onLeaveRoom}>
                            🚪 Leave Room
                        </button>
                    </div>
                </>
            )}

            {/* Render appropriate call interface based on call type */}
            {isCalling && callType === "audio" && (
                <AudioCallInterface
                    currentRoom={currentRoom}
                    onEndCall={onEndCall}
                    isAudioMuted={isAudioMuted}
                    onToggleMuteAudio={onToggleMuteAudio}
                    localAudioRef={localAudioRef}
                    remoteAudioRef={remoteAudioRef}
                />
            )}

            {isCalling && callType === "video" && (
                <VideoCallInterface
                    currentRoom={currentRoom}
                    onEndCall={onEndCall}
                    isAudioMuted={isAudioMuted}
                    isVideoMuted={isVideoMuted}
                    onToggleMuteAudio={onToggleMuteAudio}
                    onToggleMuteVideo={onToggleMuteVideo}
                    localVideoRef={localVideoRef}
                    remoteVideoRef={remoteVideoRef}
                />
            )}

            {/* Show leave room button during call */}
            {isCalling && (
                <div className="call-controls" style={{ marginTop: '20px' }}>
                    <button className="btn btn-secondary" onClick={onLeaveRoom}>
                        🚪 Leave Room
                    </button>
                </div>
            )}
        </div>
    );
};

export default CallInterface;
