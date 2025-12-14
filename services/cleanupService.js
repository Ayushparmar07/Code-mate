import User from "../models/User.js";

export const startCleanupService = (io) => {
  // Check for disconnected sockets every 30 seconds
  setInterval(async () => {
    try {
      const allUsers = await User.find({});
      const connectedSockets = await io.fetchSockets();
      const connectedSocketIds = new Set(connectedSockets.map(s => s.id));
      
      // Find users with socket IDs that are no longer connected
      const staleUsers = allUsers.filter(user => !connectedSocketIds.has(user.socketId));
      
      if (staleUsers.length > 0) {
        console.log(`Cleaning up ${staleUsers.length} stale user entries`);
        
        // Group by room to update user lists
        const roomsToUpdate = new Set();
        
        for (const staleUser of staleUsers) {
          await User.deleteOne({ _id: staleUser._id });
          if (staleUser.roomId) {
            roomsToUpdate.add(staleUser.roomId);
          }
        }
        
        // Update user lists for affected rooms
        for (const roomId of roomsToUpdate) {
          const allUsers = await User.find({ roomId }).sort({ joinedAt: 1 });
          const uniqueUsers = [];
          const seenUsers = new Set();
          
          for (const user of allUsers) {
            if (!seenUsers.has(user.userName)) {
              uniqueUsers.push(user.userName);
              seenUsers.add(user.userName);
            }
          }
          
          io.to(roomId).emit("userJoined", uniqueUsers);
        }
      }
    } catch (err) {
      console.error("Cleanup error:", err);
    }
  }, 30000); // Run every 30 seconds
};
