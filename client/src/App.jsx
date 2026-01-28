import { useWebRTC } from './hooks/useWebRTC';
import RoomJoin from './components/RoomJoin';
import CallInterface from './components/CallInterface';
import './App.css';

function App() {
  const {
    status,
    statusMessage,
    infoMessage,
    currentRoom,
    userCount,
    canCall,
    isCalling,

    localVideoRef,
    remoteVideoRef,
    localAudioRef,
    remoteAudioRef,
    joinRoom,
    startCall,
    endCall,
    leaveRoom,
    callType,
    isAudioMuted,
    isVideoMuted,
    toggleMuteAudio,
    toggleMuteVideo,
  } = useWebRTC();

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">📹 WebRTC Video Call</h1>

        <div className={`status-badge ${status}`}>
          <span className="status-dot"></span>
          <span>{statusMessage}</span>
        </div>

        {!currentRoom ? (
          <RoomJoin onJoin={joinRoom} />
        ) : (
          <CallInterface
            currentRoom={currentRoom}
            userCount={userCount}
            canCall={canCall}
            isCalling={isCalling}
            onStartCall={startCall}
            onEndCall={endCall}
            onLeaveRoom={leaveRoom}

            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            localAudioRef={localAudioRef}
            remoteAudioRef={remoteAudioRef}
            callType={callType}
            isAudioMuted={isAudioMuted}
            isVideoMuted={isVideoMuted}
            onToggleMuteAudio={toggleMuteAudio}
            onToggleMuteVideo={toggleMuteVideo}
          />
        )}

        <div className="info-section">
          <p className="info-text">{infoMessage}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
