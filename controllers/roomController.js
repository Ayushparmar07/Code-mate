import User from "../models/User.js";
import Message from "../models/Message.js";
import CodeHistory from "../models/CodeHistory.js";

export const handleJoinRoom = async (socket, io, { roomId, userName }) => {
  socket.join(roomId);

  // Store username on socket for easy disconnection cleanup
  socket.userName = userName;
  socket.roomId = roomId;

  // Check if user exists in DB for this room (to preserve join order)
  let existingDbUser = await User.findOne({ userName, roomId });
  
  if (!existingDbUser) {
    // First time joining this room - create with current timestamp
    await User.create({ userName, socketId: socket.id, roomId, joinedAt: new Date() });
  } else {
    // User rejoining - just update socket ID but keep original joinedAt
    await User.create({ userName, socketId: socket.id, roomId, joinedAt: existingDbUser.joinedAt });
  }

  // Get all unique users in this room, sorted by first join time
  const allUsers = await User.find({ roomId }).sort({ joinedAt: 1 });
  const uniqueUsers = [];
  const seenUsers = new Set();
  
  for (const user of allUsers) {
    if (!seenUsers.has(user.userName)) {
      uniqueUsers.push(user.userName);
      seenUsers.add(user.userName);
    }
  }

  // Load previous chat messages
  const previousChat = await Message.find({ roomId }).sort({ timestamp: 1 });
  const formattedChat = previousChat.map(msg => ({
    id: msg.messageId || msg._id.toString(),
    userName: msg.userName,
    content: msg.content,
    timestamp: msg.timestamp
  }));
  socket.emit("previousMessages", formattedChat);

  // Load last saved code
  const lastCode = await CodeHistory.findOne({ roomId }).sort({ updatedAt: -1 });
  if (lastCode) socket.emit("loadPreviousCode", lastCode.code);

  // Send user list
  console.log(`Room ${roomId} users:`, uniqueUsers);
  io.to(roomId).emit("userJoined", uniqueUsers);
};

export const handleLeaveRoom = async (socket, io) => {
  const room = socket.roomId;
  const userName = socket.userName;

  if (room && userName) {
    // Remove ALL user entries for this user in this room
    await User.deleteMany({ roomId: room, userName }).catch(() => null);

    // Get updated user list
    const allUsers = await User.find({ roomId: room }).sort({ joinedAt: 1 });
    const uniqueUsers = [];
    const seenUsers = new Set();
    
    for (const user of allUsers) {
      if (!seenUsers.has(user.userName)) {
        uniqueUsers.push(user.userName);
        seenUsers.add(user.userName);
      }
    }
    
    io.to(room).emit("userJoined", uniqueUsers);
    socket.leave(room);
    console.log(`${userName} left room ${room}`);
  }
};
