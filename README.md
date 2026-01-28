# one-to-one-audio-connection
# 🎤 WebRTC One-to-One Audio Call (React)

A real-time audio communication system using WebRTC for peer-to-peer audio streaming, Socket.IO for signaling, and React for the frontend.

## Features

- ✅ **One-to-one audio calls** using WebRTC
- ✅ **React frontend** with Vite for fast development
- ✅ **Custom WebRTC hook** for clean state management
- ✅ **Component-based architecture**
- ✅ **Socket.IO signaling** for SDP and ICE exchange
- ✅ **Room-based calling** - join the same room ID to connect
- ✅ **No media server required** - direct peer-to-peer streaming
- ✅ **Cross-device support** via ngrok
- ✅ **Modern, responsive UI** with real-time status updates

## Project Structure

```
socket.io/
├── server.js              # Socket.IO signaling server
├── package.json           # Backend dependencies
├── client/                # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main component
│   │   ├── App.css        # App styles
│   │   ├── components/
│   │   │   ├── RoomJoin.jsx       # Room joining UI
│   │   │   ├── RoomJoin.css
│   │   │   ├── CallInterface.jsx  # Call controls
│   │   │   └── CallInterface.css
│   │   ├── hooks/
│   │   │   └── useWebRTC.js       # WebRTC logic
│   │   └── main.jsx       # Entry point
│   ├── vite.config.js     # Vite configuration
│   └── package.json       # Frontend dependencies
└── README.md
```

## Setup & Installation

### 1. Install Backend Dependencies

```bash
npm install
```

### 2. Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

## Development

Run the backend and frontend separately for development:

### Terminal 1: Start Backend Server

```bash
npm start
```

The Socket.IO server will run on `http://localhost:3000`

### Terminal 2: Start React Dev Server

```bash
cd client
npm run dev
```

The React app will run on `http://localhost:5173` (or 5174 if port is busy)

### Test Locally

1. Open `http://localhost:5173` in two browser tabs
2. Enter the same room ID in both tabs (e.g., "room123")
3. Click "Join Room" in both tabs
4. Click "Start Call" in one tab
5. The call should connect automatically
6. You should hear audio from the other tab

## Production Build

### 1. Build React App

```bash
cd client
npm run build
cd ..
```

This creates optimized production files in `client/dist/`

### 2. Start Production Server

```bash
npm start
```

The server will serve both the Socket.IO backend and React frontend on `http://localhost:3000`

## Cross-Device Testing with ngrok

To test across different devices:

### 1. Install ngrok

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

### 2. Build and Start Production Server

```bash
cd client && npm run build && cd ..
npm start
```

### 3. Expose Server with ngrok

```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding   https://abc123.ngrok.io -> http://localhost:3000
```

### 4. Access from Any Device

1. Copy the ngrok HTTPS URL (e.g., `https://abc123.ngrok.io`)
2. Open it on any device (phone, tablet, another computer)
3. Both users enter the same room ID
4. Start the call!

> **Note**: Use the HTTPS URL. Microphone access requires HTTPS (except for localhost).

## How It Works

### Component Architecture

- **App.jsx**: Main component managing state via `useWebRTC` hook
- **RoomJoin**: UI for entering and joining a room
- **CallInterface**: Call controls and status display
- **useWebRTC**: Custom hook managing WebRTC, Socket.IO, and state

### WebRTC Flow

1. **Join Room**: User joins via Socket.IO
2. **Start Call**: Caller requests microphone access
3. **Create Offer**: Caller creates SDP offer and sends via Socket.IO
4. **Answer**: Receiver gets offer, creates answer, sends back
5. **ICE Exchange**: Both peers exchange ICE candidates
6. **Connected**: Peer-to-peer audio stream established

### Signaling Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `join` | Client → Server | Join a room |
| `joined` | Server → Client | Confirm room joined |
| `ready` | Server → Client | Room has 2 users, ready to call |
| `offer` | Client ↔ Server ↔ Client | Send SDP offer |
| `answer` | Client ↔ Server ↔ Client | Send SDP answer |
| `ice` | Client ↔ Server ↔ Client | Exchange ICE candidates |
| `leave` | Client → Server | Leave room |
| `peer-left` | Server → Client | Other user left |

## Troubleshooting

### Port Already in Use

If Vite can't start on port 5173, it will automatically try 5174, 5175, etc.

### Microphone Not Working

- Allow microphone access when prompted
- Check browser permissions (requires HTTPS or localhost)
- Try Chrome/Edge for best compatibility

### Call Not Connecting

- Ensure both users are in the same room
- Check browser console for errors
- Try refreshing both browsers
- Verify ICE candidates are being exchanged

### Development: Frontend Can't Connect to Backend

- Make sure backend is running on port 3000
- Vite proxy is configured in `vite.config.js`
- Check Vite console for proxy errors

## Technologies Used

- **React** - UI library
- **Vite** - Build tool and dev server
- **Node.js** - Runtime
- **Express** - Web server
- **Socket.IO** - WebSocket signaling
- **WebRTC** - Peer-to-peer audio streaming

## Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari (macOS/iOS)
- ✅ Mobile browsers (Chrome, Safari)

## License

ISC
