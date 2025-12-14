import Message from "../models/Message.js";

export const handleChatMessage = async (socket, io, { roomId, userName, content, id }) => {
  // Save to database
  const msg = await Message.create({ 
    roomId, 
    userName, 
    content,
    messageId: id  // Store the client-generated ID
  });

  const formatted = {
    id: id || msg._id.toString(),
    userName,
    content,
    timestamp: msg.timestamp,
  };

  io.to(roomId).emit("chatMessage", formatted);
};

export const handleDeleteMessage = async (socket, io, { roomId, id }) => {
  // Delete by messageId (client-generated) instead of _id
  await Message.deleteOne({ messageId: id }).catch(() => null);
  io.to(roomId).emit("messageDeleted", { id });
};
