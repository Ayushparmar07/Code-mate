import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  userName: { type: String, required: true },
  content: { type: String, required: true },
  messageId: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Message", MessageSchema);
