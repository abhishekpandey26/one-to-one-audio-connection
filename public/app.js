// Socket.IO connection
const socket = io();

// DOM Elements
const roomIdInput = document.getElementById("room-id");
const joinBtn = document.getElementById("join-btn");
const callBtn = document.getElementById("call-btn");
const endBtn = document.getElementById("end-btn");
const leaveBtn = document.getElementById("leave-btn");
const statusBadge = document.getElementById("status");
const statusText = document.getElementById("status-text");
const roomSection = document.getElementById("room-section");
const callSection = document.getElementById("call-section");
const currentRoomSpan = document.getElementById("current-room");
const userCountSpan = document.getElementById("user-count");
const infoText = document.getElementById("info-text");
const remoteAudio = document.getElementById("remote-audio");

// State
let currentRoom = null;
let localStream = null;
let peerConnection = null;
let isCalling = false;

// WebRTC Configuration
const configuration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ],
};

// Update status
function updateStatus(status, message) {
    statusBadge.className = "status-badge " + status;
    statusText.textContent = message;
}

// Update info text
function updateInfo(text) {
    infoText.textContent = text;
}

// Join room
joinBtn.addEventListener("click", () => {
    const roomId = roomIdInput.value.trim();
    if (!roomId) {
        alert("Please enter a room ID");
        return;
    }

    currentRoom = roomId;
    socket.emit("join", { roomId });
    updateStatus("connected", "Joining room...");
    updateInfo("Connecting to room...");
});

// Socket: Successfully joined
socket.on("joined", ({ roomId, userCount }) => {
    currentRoomSpan.textContent = roomId;
    userCountSpan.textContent = userCount;

    roomSection.classList.add("hidden");
    callSection.classList.remove("hidden");

    updateStatus("connected", "Connected");
    updateInfo(userCount === 1
        ? "Waiting for another user to join..."
        : "Both users present. Ready to call!");
});

// Socket: Room is ready (2 users present)
socket.on("ready", ({ message }) => {
    callBtn.disabled = false;
    updateInfo(message);
});

// Socket: Error
socket.on("error", ({ message }) => {
    alert(message);
    updateStatus("", "Disconnected");
    updateInfo(message);
});

// Start call
callBtn.addEventListener("click", async () => {
    try {
        updateInfo("Requesting microphone access...");

        // Get microphone access
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
        });

        updateInfo("Microphone access granted. Initiating call...");

        // Create peer connection
        createPeerConnection();

        // Add local audio track to peer connection
        localStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStream);
        });

        // Create and send offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit("offer", {
            roomId: currentRoom,
            sdp: offer,
        });

        isCalling = true;
        updateStatus("calling", "Calling...");
        updateInfo("Waiting for peer to answer...");

        callBtn.classList.add("hidden");
        endBtn.classList.remove("hidden");
    } catch (error) {
        console.error("Error starting call:", error);
        alert("Failed to access microphone: " + error.message);
        updateInfo("Failed to start call. Please check microphone permissions.");
    }
});

// Socket: Receive offer
socket.on("offer", async ({ sdp }) => {
    try {
        updateInfo("Incoming call! Requesting microphone access...");

        // Get microphone access
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
        });

        updateInfo("Microphone access granted. Answering call...");

        // Create peer connection
        createPeerConnection();

        // Add local audio track
        localStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStream);
        });

        // Set remote description and create answer
        await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit("answer", {
            roomId: currentRoom,
            sdp: answer,
        });

        isCalling = true;
        updateStatus("calling", "In call");
        updateInfo("Call connected! Speaking with peer...");

        callBtn.classList.add("hidden");
        endBtn.classList.remove("hidden");
    } catch (error) {
        console.error("Error answering call:", error);
        alert("Failed to answer call: " + error.message);
    }
});

// Socket: Receive answer
socket.on("answer", async ({ sdp }) => {
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
        updateStatus("calling", "In call");
        updateInfo("Call connected! Speaking with peer...");
    } catch (error) {
        console.error("Error setting remote description:", error);
    }
});

// Socket: Receive ICE candidate
socket.on("ice", async ({ candidate }) => {
    try {
        if (peerConnection) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    } catch (error) {
        console.error("Error adding ICE candidate:", error);
    }
});

// Create peer connection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    // Send ICE candidates to peer
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("ice", {
                roomId: currentRoom,
                candidate: event.candidate,
            });
        }
    };

    // Receive remote audio track
    peerConnection.ontrack = (event) => {
        console.log("Received remote track");
        remoteAudio.srcObject = event.streams[0];
        updateInfo("Audio stream connected!");
    };

    // Connection state changes
    peerConnection.onconnectionstatechange = () => {
        console.log("Connection state:", peerConnection.connectionState);

        if (peerConnection.connectionState === "connected") {
            updateStatus("calling", "In call");
            updateInfo("Call connected! Audio streaming...");
        } else if (peerConnection.connectionState === "disconnected" ||
            peerConnection.connectionState === "failed") {
            updateInfo("Connection lost. Please try again.");
            endCall();
        }
    };
}

// End call
endBtn.addEventListener("click", () => {
    endCall();
    updateInfo("Call ended. You can start a new call.");
});

function endCall() {
    // Stop local stream
    if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
    }

    // Close peer connection
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    // Reset UI
    isCalling = false;
    updateStatus("connected", "Connected");
    callBtn.classList.remove("hidden");
    callBtn.disabled = false;
    endBtn.classList.add("hidden");

    // Update user count
    const currentCount = parseInt(userCountSpan.textContent);
    if (currentCount === 2) {
        updateInfo("Ready to call again!");
    }
}

// Leave room
leaveBtn.addEventListener("click", () => {
    if (currentRoom) {
        socket.emit("leave", { roomId: currentRoom });
    }

    endCall();

    currentRoom = null;
    roomIdInput.value = "";

    roomSection.classList.remove("hidden");
    callSection.classList.add("hidden");

    updateStatus("", "Disconnected");
    updateInfo("Enter a room ID to get started");
});

// Socket: Peer left
socket.on("peer-left", ({ message }) => {
    alert(message);
    endCall();
    userCountSpan.textContent = "1";
    callBtn.disabled = true;
    updateInfo("Waiting for another user to join...");
});

// Socket: Connected to server
socket.on("connect", () => {
    updateStatus("", "Disconnected");
    updateInfo("Connected to server. Enter a room ID to start.");
});

// Socket: Disconnected from server
socket.on("disconnect", () => {
    updateStatus("", "Disconnected");
    updateInfo("Disconnected from server. Reconnecting...");
    endCall();
});
