import express from "express";
import Project from "../models/Project.js";
import ChatSession from "../models/ChatSession.js";
import { authenticateToken } from "../middleware/auth.js";
import { searchDocuments } from "../utils/fileProcessor.js";
import geminiService from "../services/geminiService.js";
import vectorService from "../services/vectorService.js";

const router = express.Router();

// Simple guardrails
function preCheck(question) {
  if (!question || question.length < 1) return "Question empty";
  if (question.length > 3000) return "Question too long";
  const banned = ["bomb", "kill", "illegal", "terror", "hack", "attack"];
  const low = question.toLowerCase();
  for (const b of banned) if (low.includes(b)) return "Disallowed content";
  return null;
}

// Postprocess to remove PII (basic implementation)
function postCheck(answer) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi;
  const phoneRegex = /(\+?\d{10,15})/g;
  let cleaned = answer.replace(emailRegex, "[redacted email]").replace(phoneRegex, "[redacted phone]");
  return cleaned;
}

// Create new chat session
router.post("/:projectId/sessions", authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check access rights
    if (project.userId.toString() !== req.user._id.toString() && !project.isPublic) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { title } = req.body;
    const chatSession = new ChatSession({
      projectId: req.params.projectId,
      userId: req.user._id,
      title: title || "New Chat"
    });

    await chatSession.save();
    res.status(201).json(chatSession);
  } catch (error) {
    console.error("[CreateChatSessionAPI]:Error creating chat session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//imp
// Send message in chat session (RAG functionality),most imp
router.post("/:projectId/sessions/:sessionId/messages", authenticateToken, async (req, res) => {
  try {

    const { message } = req.body;
    console.log("[messagesAPI]: Message received in chat session:", message);

    // Apply guardrails
    const preCheckResult = preCheck(message);//question length restricted to 3000 and disallowed words

    if (preCheckResult) {
      return res.status(400).json({ error: preCheckResult });
    }
    console.log("[messagesAPI]: Pre-check passed for message:");

    // Get project and chat session
    const project = await Project.findById(req.params.projectId);
    const chatSession = await ChatSession.findById(req.params.sessionId);

    if (!project || !chatSession) {
      return res.status(404).json({ error: "Project or chat session not found" });
    }

    // Check access rights
    if (project.userId.toString() !== req.user._id.toString() && !project.isPublic) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (chatSession.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied to chat session" });
    }

    // Add user message to chat session
    chatSession.messages.push({
      role: "user",
      content: message,
      timestamp: new Date()
    });

    // Search through project documents for relevant context using vector similarity
    let relevantDocs = [];
    let context = "";
    let sources = [];

    try {
      console.log(`[messagesAPI]: Searching for relevant documents using vector similarity...`);
      const vectorResults = await vectorService.searchSimilarDocuments(
        project._id.toString(),
        message,
        5 // Top 5 most similar chunks
      );

      if (vectorResults.length > 0) {
        context = vectorResults.map(chunk =>
          `From "${chunk.documentName}" (similarity: ${(chunk.similarity * 100).toFixed(1)}%): ${chunk.text}`
        ).join('\n\n');

        sources = [...new Set(vectorResults.map(chunk => chunk.documentName))]; // Unique document names
        console.log(`[messagesAPI]: Found ${vectorResults.length} relevant chunks from ${sources.length} documents`);
      } else {
        console.log('[messagesAPI]: No vector embeddings found, falling back to keyword search...');
        // Fallback to old keyword search if no vectors exist,i dont think we should ever use this
        //decide this
        relevantDocs = searchDocuments(message, project.documents);
        context = relevantDocs.map(doc =>
          `From "${doc.documentName}": ${doc.content}`
        ).join('\n\n');
        sources = relevantDocs.map(doc => doc.documentName);
      }
    } catch (vectorError) {
      console.error('[messagesAPI]: Vector search failed, falling back to keyword search:', vectorError);
      // Fallback to old keyword search,i dont think we should ever use this
      relevantDocs = searchDocuments(message, project.documents);
      context = relevantDocs.map(doc =>
        `From "${doc.documentName}": ${doc.content}`
      ).join('\n\n');
      sources = relevantDocs.map(doc => doc.documentName);
    }

    console.log("[messagesAPI]: Context prepared for AI response:", context.substring(0, 500));
    // Prepare conversation history for context
    const recentMessages = chatSession.messages.slice(-10); // Last 10 messages for context
    const conversationContext = recentMessages.map(msg =>
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');
    console.log("[messagesAPI]:  conversationContext", conversationContext);

    // Generate AI response using Gemini
    let aiResponse;

    try {
      // Create enhanced prompt with context
      let enhancedPrompt = message;

      if (context) {
        enhancedPrompt = `Based on the following context from the user's documents and our conversation history, please answer the user's question.

Context from documents:
${context}

Recent conversation:
${conversationContext}

Please provide a helpful response. If the answer can be found in the provided context, reference it. If not, provide a general helpful response and mention that you don't have specific information about this topic in the uploaded documents.`;
      }
      else {
        enhancedPrompt = `Based on our conversation history, please answer the user's question:

Recent conversation:
${conversationContext}

Current question: ${message}

Note: I don't have access to specific documents for this question, so I'll provide a general helpful response.`;
      }

      console.log("[messagesAPI]: Enhanced prompt prepared for AI:", enhancedPrompt.substring(0, 500), '...');
     
      aiResponse = await geminiService.generateResponse(
        enhancedPrompt,
        "",
        project.systemPrompt
      );

      // Apply post-processing guardrails
      aiResponse = postCheck(aiResponse);
    } catch (aiError) {
      console.error("[messagesAPI]: AI generation error:", aiError);
      aiResponse = "I apologize, but I'm having trouble generating a response right now. Please try again later.";
    }

    // Add AI response to chat session
    chatSession.messages.push({
      role: "assistant",
      content: aiResponse,
      timestamp: new Date(),
      sources: sources
    });

    // Update chat title if this is the first exchange,par aisa karna galat hoga kyuki title user ne pehle de dia hoga,and we are overriding it
    //have to think about keeping this functionality or not,i think just comment out this
    // if (chatSession.messages.length === 2) {
    //   try {
    //     const title = await geminiService.generateTitle([{ role: 'user', content: message }]);
    //     chatSession.title = title;
    //   } catch (titleError) {
    //     console.error("[messagesAPI]: Error generating title:", titleError);
    //   }
    // }

    await chatSession.save();

    // Update project's last used time and total chats
    project.lastUsed = new Date();
    project.totalChats = await ChatSession.countDocuments({ projectId: req.params.projectId });
    await project.save();

    res.json({
      message: aiResponse,
      sources: sources,
      sessionId: chatSession._id
    });

  } catch (error) {
    console.error("[messagesAPI]: Error processing chat message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete chat session
router.delete("/:projectId/sessions/:sessionId", authenticateToken, async (req, res) => {
  try {
    const chatSession = await ChatSession.findById(req.params.sessionId);

    if (!chatSession) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    if (chatSession.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    await ChatSession.findByIdAndDelete(req.params.sessionId);
    res.json({ success: true, message: "Chat session deleted" });
  } catch (error) {
    console.error("[DeleteChatSessionAPI]:Error deleting chat session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update chat session title
router.put("/:projectId/sessions/:sessionId/title", authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (title.length > 100) {
      return res.status(400).json({ error: "Title too long (max 100 characters)" });
    }

    // Find the chat session
    const chatSession = await ChatSession.findById(req.params.sessionId);
    if (!chatSession) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    // Check if user owns this chat session
    if (chatSession.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update the title
    chatSession.title = title.trim();
    await chatSession.save();

    res.json({
      success: true,
      message: "Chat title updated successfully",
      session: chatSession
    });
  } catch (error) {
    console.error("[UpdateChatTitleAPI]:Error updating chat title:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
