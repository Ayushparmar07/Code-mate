import { Server } from "socket.io";

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : "*",
      methods: ["GET", "POST"],
      credentials: true
    },
  });

  return io;
};
