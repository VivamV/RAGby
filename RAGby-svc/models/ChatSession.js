import mongoose from "mongoose";

const ChatSessionSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "New Chat" },
  messages: [{
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    sources: [String] // documents that were used for context
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("ChatSession", ChatSessionSchema);
