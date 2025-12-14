import Note from '../models/Note.js';

// Save or update note
export const saveNote = async (io, socket, { roomId, userName, content }) => {
  try {
    await Note.findOneAndUpdate(
      { roomId, userName },
      { content, updatedAt: Date.now() },
      { upsert: true, new: true }
    );

    console.log(`Note saved for ${userName} in room ${roomId}`);
  } catch (error) {
    console.error('Error saving note:', error);
    socket.emit('noteError', { message: 'Failed to save note' });
  }
};

// Load note for user
export const loadNote = async (io, socket, { roomId, userName }) => {
  try {
    const note = await Note.findOne({ roomId, userName });
    
    const content = note ? note.content : '';
    socket.emit('loadNote', content);
    
    console.log(`Note loaded for ${userName} in room ${roomId}`);
  } catch (error) {
    console.error('Error loading note:', error);
    socket.emit('noteError', { message: 'Failed to load note' });
  }
};
