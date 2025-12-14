import { handleJoinRoom, handleLeaveRoom } from "../controllers/roomController.js";
import { handleChatMessage, handleDeleteMessage } from "../controllers/chatController.js";
import { 
  handleCodeChange, 
  handleLanguageChange, 
  handleTyping, 
  handleCompileCode 
} from "../controllers/codeController.js";
import { saveNote, loadNote } from "../controllers/noteController.js";
import { handleAIChat, handleCodeSuggestion } from "../controllers/aiController.js";
import User from "../models/User.js";

export const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log("Socket connected:", socket.id);
    }

    // Room events
    socket.on("join", (data) => handleJoinRoom(socket, io, data));
    socket.on("leaveRoom", () => handleLeaveRoom(socket, io));

    // Chat events
    socket.on("chatMessage", (data) => handleChatMessage(socket, io, data));
    socket.on("deleteMessage", (data) => handleDeleteMessage(socket, io, data));

    // Code events
    socket.on("codeChange", (data) => handleCodeChange(socket, io, data));
    socket.on("languageChange", (data) => handleLanguageChange(socket, io, data));
    socket.on("typing", (data) => handleTyping(socket, io, data));
    socket.on("compileCode", (data) => handleCompileCode(socket, io, data));

    // Note events
    socket.on("saveNote", (data) => saveNote(io, socket, data));
    socket.on("loadNote", (data) => loadNote(io, socket, data));

    // AI events
    socket.on("aiChat", (data) => handleAIChat(io, socket, data));
    socket.on("codeSuggestion", (data) => handleCodeSuggestion(io, socket, data));

    // Disconnect event
    socket.on("disconnect", async () => {
      const room = socket.roomId;
      const userName = socket.userName;

      console.log(`Socket disconnected: ${socket.id}, User: ${userName}, Room: ${room}`);

      // Remove this socket from DB
      await User.deleteOne({ socketId: socket.id }).catch(() => null);

      if (room && userName) {
        // Wait a bit to allow for quick reconnects (refresh case)
        setTimeout(async () => {
          // Check if user has any other active sockets in this room
          const remainingSockets = await User.find({ roomId: room, userName });
          
          if (remainingSockets.length === 0) {
            console.log(`User ${userName} completely disconnected from room ${room}`);
            
            // User completely disconnected - get updated user list
            const allUsers = await User.find({ roomId: room }).sort({ joinedAt: 1 });
            const uniqueUsers = [];
            const seenUsers = new Set();
            
            for (const user of allUsers) {
              if (!seenUsers.has(user.userName)) {
                uniqueUsers.push(user.userName);
                seenUsers.add(user.userName);
              }
            }
            
            console.log(`Updated user list for room ${room}:`, uniqueUsers);
            io.to(room).emit("userJoined", uniqueUsers);
          }
        }, 1000); // 1 second delay to handle quick reconnects
      }
    });
  });
};
