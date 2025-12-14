import mongoose from "mongoose";

const CodeHistorySchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  code: { type: String, required: true },
  language: { type: String, default: "javascript" },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("CodeHistory", CodeHistorySchema);
