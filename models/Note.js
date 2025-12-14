import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    default: '',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for efficient queries
noteSchema.index({ roomId: 1, userName: 1 });

export default mongoose.model('Note', noteSchema);
