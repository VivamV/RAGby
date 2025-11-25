import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  systemPrompt: { type: String, default: "You are a helpful AI assistant." },
  isPublic: { type: Boolean, default: false },
  documents: [{
    filename: String,
    originalName: String,
    filePath: String,
    fileType: String,
    content: String, // extracted text content
    uploadedAt: { type: Date, default: Date.now },
    vectorized: { type: Boolean, default: false }, // whether embeddings have been generated
    chunkCount: { type: Number, default: 0 } // number of vector chunks for this document
  }],
  totalChats: { type: Number, default: 0 },
  lastUsed: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Project", ProjectSchema);
