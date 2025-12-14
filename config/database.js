import mongoose from "mongoose";

export const connectDatabase = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    // Add production-specific options
    if (process.env.NODE_ENV === 'production') {
      options.maxPoolSize = 10; // Maintain up to 10 socket connections
      options.serverSelectionTimeoutMS = 5000; // Keep trying to send operations for 5 seconds
      options.socketTimeoutMS = 45000; // Close sockets after 45 seconds of inactivity
      options.bufferMaxEntries = 0; // Disable mongoose buffering
      options.bufferCommands = false; // Disable mongoose buffering
    }

    await mongoose.connect(process.env.MONGO_URI, options);
    console.log("MongoDB connected successfully");
    console.log(`Database: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
