import CodeHistory from "../models/CodeHistory.js";
import axios from "axios";

export const handleCodeChange = async (socket, io, { roomId, code }) => {
  socket.to(roomId).emit("codeUpdate", code);

  if (code && code.trim() && code.trim().length > 2) {
    await CodeHistory.findOneAndUpdate(
      { roomId },
      { code, updatedAt: new Date() },
      { upsert: true }
    ).catch(err => console.error("Code save error:", err));
  }
};

export const handleLanguageChange = (socket, io, { roomId, language }) => {
  io.to(roomId).emit("languageUpdate", language);
};

export const handleTyping = (socket, io, { roomId, userName }) => {
  socket.to(roomId).emit("userTyping", userName);
};

export const handleCompileCode = async (socket, io, { code, roomId, language }) => {
  try {
    const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
      language,
      version: "*",
      files: [{ content: code }],
    });

    io.to(roomId).emit("codeResponse", response.data);
  } catch (err) {
    io.to(roomId).emit("codeResponse", {
      run: { output: "Error running code: " + err.message },
    });
  }
};
