import mongoose from "mongoose";
import dotenv from "dotenv";
import CodeHistory from "../models/CodeHistory.js";

dotenv.config();

// Get room ID from command line argument
const roomId = process.argv[2];

if (!roomId) {
  console.error("Usage: node clear-room-code.js <roomId>");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    
    // Delete code history for the specified room
    const result = await CodeHistory.deleteMany({ roomId });
    
    console.log(`Deleted ${result.deletedCount} code history entries for room: ${roomId}`);
    
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
