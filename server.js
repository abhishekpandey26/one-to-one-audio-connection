const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});


app.use(express.static(path.join(__dirname, "client", "dist")));


app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});


const rooms = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);


  socket.on("join", ({ roomId }) => {

    if (rooms[roomId] && rooms[roomId].users.length >= 2) {
      socket.emit("error", { message: "Room is full. Only 2 users allowed." });
      console.log(" Room full:", roomId);
      return;
    }

    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        users: [],
        createdAt: new Date(),
      };
    }

    rooms[roomId].users.push({
      socketId: socket.id,
      status: "waiting",
    });

    console.log(`User ${socket.id} joined room: ${roomId}`);
    console.log(`Room ${roomId} now has ${rooms[roomId].users.length} user(s)`);


    socket.emit("joined", { roomId, userCount: rooms[roomId].users.length });


    if (rooms[roomId].users.length === 2) {
      io.to(roomId).emit("ready", {
        message: "Both users present. Ready to call.",
      });
      console.log(` Room ${roomId} is ready for call (2 users)`);
    }
  });


  socket.on("offer", ({ roomId, sdp, callType }) => {
    console.log(` Offer sent in room: ${roomId}, type: ${callType}`);
    socket.to(roomId).emit("offer", { sdp, callType });
  });

  socket.on("answer", ({ roomId, sdp }) => {
    console.log(` Answer sent in room: ${roomId}`);
    socket.to(roomId).emit("answer", { sdp });
  });


  socket.on("ice", ({ roomId, candidate }) => {
    console.log(` ICE candidate sent in room: ${roomId}`);
    socket.to(roomId).emit("ice", { candidate });
  });


  socket.on("leave", ({ roomId }) => {
    socket.leave(roomId);

    if (rooms[roomId]) {
      rooms[roomId].users = rooms[roomId].users.filter(
        (user) => user.socketId !== socket.id
      );


      socket.to(roomId).emit("peer-left", {
        message: "Other user left the room",
      });

      console.log(` User ${socket.id} left room: ${roomId}`);


      if (rooms[roomId].users.length === 0) {
        delete rooms[roomId];
        console.log(`  Room ${roomId} deleted (empty)`);
      }
    }
  });


  socket.on("disconnect", () => {
    console.log(" Disconnected:", socket.id);


    for (let roomId in rooms) {
      const userIndex = rooms[roomId].users.findIndex(
        (user) => user.socketId === socket.id
      );

      if (userIndex !== -1) {
        rooms[roomId].users.splice(userIndex, 1);


        socket.to(roomId).emit("peer-left", {
          message: "Other user disconnected",
        });

        console.log(` User ${socket.id} removed from room: ${roomId}`);


        if (rooms[roomId].users.length === 0) {
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted (empty)`);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n Socket.IO signaling server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser\n`);
});
