import { useState, useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";

const SOCKET_URL = import.meta.env.PROD
  ? window.location.origin
  : "http://localhost:4000";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const useWebRTC = () => {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState("disconnected");
  const [statusMessage, setStatusMessage] = useState("Disconnected");
  const [infoMessage, setInfoMessage] = useState(
    "Enter a room ID to get started",
  );
  const [currentRoom, setCurrentRoom] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [canCall, setCanCall] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const iceCandidatesQueue = useRef([]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setStatus("");
      setStatusMessage("Disconnected");
      setInfoMessage("Connected to server. Enter a room ID to start.");
    });

    newSocket.on("disconnect", () => {
      setStatus("");
      setStatusMessage("Disconnected");
      setInfoMessage("Disconnected from server. Reconnecting...");
      endCall();
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);


  useEffect(() => {
    if (!socket) return;

    socket.on("joined", ({ roomId, userCount: count }) => {
      setCurrentRoom(roomId);
      setUserCount(count);
      setStatus("connected");
      setStatusMessage("Connected");
      setInfoMessage(
        count === 1
          ? "Waiting for another user to join..."
          : "Both users present. Ready to call!",
      );
    });

    socket.on("ready", ({ message }) => {
      setCanCall(true);
      setUserCount(2);
      setInfoMessage(message);
    });

    socket.on("error", ({ message }) => {
      alert(message);
      setStatus("");
      setStatusMessage("Disconnected");
      setInfoMessage(message);
    });

    socket.on("offer", async ({ sdp, callType: type }) => {
      try {
        setCallType(type);
        setInfoMessage(`Incoming ${type} call! Requesting access...`);

        const constraints = {
          audio: true,
          video: type === "video",
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;

        setInfoMessage("Access granted. Answering call...");

        // Set local stream to appropriate ref based on call type
        if (type === "video" && localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        } else if (type === "audio" && localAudioRef.current) {
          localAudioRef.current.srcObject = stream;
        }

        createPeerConnection();
        stream.getTracks().forEach((track) => {
          peerConnectionRef.current.addTrack(track, stream);
        });

        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(sdp),
        );
        processIceQueue();
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        socket.emit("answer", {
          roomId: currentRoom,
          sdp: answer,
        });

        setIsCalling(true);
        setStatus("calling");
        setStatusMessage("In call");
        setInfoMessage("Call connected! Speaking with peer...");
      } catch (error) {
        console.error("Error answering call:", error);
        alert("Failed to answer call: " + error.message);
      }
    });

    socket.on("answer", async ({ sdp }) => {
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        processIceQueue();
        setStatus("calling");
        setStatusMessage("In call");
        setInfoMessage("Call connected! Speaking with peer...");
      } catch (error) {
        console.error("Error setting remote description:", error);
      }
    });

    socket.on("ice", async ({ candidate }) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("Added ICE candidate immediately");
        } else {
          iceCandidatesQueue.current.push(candidate);
          console.log("Queued ICE candidate (remote description not ready)");
        }
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });

    socket.on("peer-left", ({ message }) => {
      alert(message);
      endCall();
      setUserCount(1);
      setCanCall(false);
      setInfoMessage("Waiting for another user to join...");
    });

    return () => {
      socket.off("joined");
      socket.off("ready");
      socket.off("error");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice");
      socket.off("peer-left");
    };
  }, [socket, currentRoom]);

  const createPeerConnection = () => {
    if (peerConnectionRef.current) {
      console.warn("Closing existing peer connection before creating new one");
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice", {
          roomId: currentRoom,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind, event.streams[0].id);

      // Set remote stream to appropriate ref based on track kind
      if (event.track.kind === "video" && remoteVideoRef.current) {
        if (remoteVideoRef.current.srcObject !== event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          console.log("Set remote video srcObject to stream:", event.streams[0].id);
        }
        setInfoMessage("Video stream connected!");
      } else if (event.track.kind === "audio" && remoteAudioRef.current) {
        if (remoteAudioRef.current.srcObject !== event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          console.log("Set remote audio srcObject to stream:", event.streams[0].id);
        }
        setInfoMessage("Audio stream connected!");
      }

      // For video calls, also set audio to remoteVideoRef if it has audio track
      if (callType === "video" && remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state changed:", pc.connectionState);

      switch (pc.connectionState) {
        case "connected":
          setStatus("calling");
          setStatusMessage("In call");
          setInfoMessage("Call connected! Video streaming...");
          break;
        case "disconnected":
        case "failed":
        case "closed":
          console.error("Connection failed or closed:", pc.connectionState);
          setInfoMessage(`Connection ${pc.connectionState}. Please try again.`);
          endCall();
          break;
        default:
          break;
      }
    };
  };

  const processIceQueue = async () => {
    if (!peerConnectionRef.current || !iceCandidatesQueue.current.length) return;

    while (iceCandidatesQueue.current.length > 0) {
      const candidate = iceCandidatesQueue.current.shift();
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("Processed queued ICE candidate");
      } catch (error) {
        console.error("Error processing queued ICE candidate:", error);
      }
    }
  };

  const joinRoom = useCallback(
    (roomId) => {
      if (!socket || !roomId.trim()) {
        alert("Please enter a room ID");
        return;
      }

      socket.emit("join", { roomId: roomId.trim() });
      setStatus("connected");
      setStatusMessage("Joining room...");
      setInfoMessage("Connecting to room...");
    },
    [socket],
  );

  const startCall = useCallback(async (type) => {
    if (!socket || !currentRoom) return;

    try {
      setCallType(type);
      setInfoMessage(`Requesting ${type} access...`);

      const constraints = {
        audio: true,
        video: type === "video",
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      setInfoMessage("Access granted. Initiating call...");

      // Set local stream to appropriate ref based on call type
      if (type === "video" && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      } else if (type === "audio" && localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      createPeerConnection();
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socket.emit("offer", {
        roomId: currentRoom,
        sdp: offer,
        callType: type,
      });

      setIsCalling(true);
      setStatus("calling");
      setStatusMessage("Calling...");
      setInfoMessage("Waiting for peer to answer...");
    } catch (error) {
      console.error("Error starting call:", error);
      alert("Failed to access camera/microphone: " + error.message);
      setInfoMessage(
        "Failed to start call. Please check camera and microphone permissions.",
      );
    }
  }, [socket, currentRoom]);

  const toggleMuteAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleMuteVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  }, []);

  const endCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsCalling(false);
    setCallType(null);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
    setStatus("connected");
    setStatusMessage("Connected");

    if (userCount === 2) {
      setInfoMessage("Ready to call again!");
    }
  }, [userCount]);

  const leaveRoom = useCallback(() => {
    if (socket && currentRoom) {
      socket.emit("leave", { roomId: currentRoom });
    }

    endCall();
    setCurrentRoom(null);
    setUserCount(0);
    setCanCall(false);
    setStatus("");
    setStatusMessage("Disconnected");
    setInfoMessage("Enter a room ID to get started");
  }, [socket, currentRoom, endCall]);

  return {
    status,
    statusMessage,
    infoMessage,
    currentRoom,
    userCount,
    canCall,
    isCalling,
    callType,
    isAudioMuted,
    isVideoMuted,

    localVideoRef,
    remoteVideoRef,
    localAudioRef,
    remoteAudioRef,
    joinRoom,
    startCall,
    endCall,
    leaveRoom,
    toggleMuteAudio,
    toggleMuteVideo,
  };
};
