import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  socketId: { type: String },
  roomId: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", UserSchema);
