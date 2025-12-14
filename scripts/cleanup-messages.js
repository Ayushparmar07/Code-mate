import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    
    // Delete all messages without messageId field
    const result = await mongoose.connection.db
      .collection("messages")
      .deleteMany({ messageId: { $exists: false } });
    
    console.log(`Deleted ${result.deletedCount} old messages without messageId`);
    
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
