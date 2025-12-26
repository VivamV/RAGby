import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Project from "../models/Project.js";
import ChatSession from "../models/ChatSession.js";
import { authenticateToken } from "../middleware/auth.js";
import { extractTextFromFile } from "../utils/fileProcessor.js";
import vectorService from "../services/vectorService.js";

// Configure multer for file uploads, // 1️⃣ Define storage (where and how to save)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);//folder to save files
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));//rename file
  }
});
//initialising upload middleware
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Accept documents and spreadsheets
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/x-vnd.oasis.opendocument.spreadsheet' // .ods
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, TXT, XLSX, XLS, CSV, and ODS files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const router = express.Router();

// GET public projects
router.get("/public", authenticateToken, async (req, res) => {
  try {
    const publicProjects = await Project.find({ isPublic: true })
      .populate('userId', 'name email')
      .select('name description createdAt totalChats')
      .sort({ createdAt: -1 });//Sorts the projects in descending order of creation date.,newest project comes first
    
    res.json(publicProjects);
  } catch (error) {
    console.error("Error fetching public projects:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET my projects (requires authentication)
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const myProjects = await Project.find({ userId: req.user._id })
      .sort({ lastUsed: -1 });
    
    res.json(myProjects);
  } catch (error) {
    console.error("Error fetching user projects:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new project
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, description, systemPrompt, isPublic } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const project = new Project({
      userId: req.user._id,
      name,
      description,
      systemPrompt: systemPrompt || "You are a helpful AI assistant.",
      isPublic: !!isPublic
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get project details with chat sessions
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user has access (owner or public project)
    if (project.userId.toString() !== req.user._id.toString() && !project.isPublic) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get chat sessions for this project
    const chatSessions = await ChatSession.find({ 
      projectId: req.params.id,
      userId: req.user._id
    }).sort({ updatedAt: -1 });

    res.json({ project, chatSessions });
  } catch (error) {
    console.error("Error fetching project by id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update project (edit system prompt, name, etc.)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user is the owner
    if (project.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update allowed fields
    const { name, description, systemPrompt, isPublic } = req.body;
    
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (systemPrompt) project.systemPrompt = systemPrompt;
    if (isPublic !== undefined) project.isPublic = isPublic;

    await project.save();
    res.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//imp
// Upload document to project,upload.single("file") is multer middleware to handle single file upload with field name 'file'
router.post("/:id/upload", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user is the owner
    if (project.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    console.log("[uploadAPI+projects]: req file received",req.file);

    // Extract text from the uploaded file
    const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);

    console.log(`[uploadAPI+projects]: Extracted Text for document: ${req.file.originalname} with extracted(${extractedText.length} characters)`);

    // Generate vector embeddings for the document and store in Pinecone Vector DB
    let vectorized = false;
    let chunkCount = 0;
    let chunks=[];
    try {
      console.log('[uploadAPI+projects]: Generating vector embeddings...');
       chunks = await vectorService.storeDocument(
        project._id.toString(), 
        req.file.originalname, 
        extractedText
      );
      vectorized = true;
      chunkCount = chunks.length;
      console.log(`[uploadAPI+projects]: Generated ${chunkCount} vector embeddings for document`);
    } catch (vectorError) {
      console.error('[uploadAPI+projects]: Error generating vector embeddings:', vectorError);
    }

    // Add document to project
    project.documents.push({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      content: extractedText,
      vectorized,
      chunkCount
    });

    await project.save();

    res.json({ 
      success: true, 
      message: `File "${req.file.originalname}" uploaded successfully`,
      documentCount: project.documents.length,
      vectorized,
      chunkCount,
      chunks
    });
  } catch (error) {
    console.error("[uploadAPI+projects]: Error uploading file:", error);

    // Clean up uploaded file if processing failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // Check if it's an unsupported file type error
    if (error.message && error.message.includes('Unsupported file type')) {
      return res.status(400).json({ 
        error: error.message
      });
    }
    
    res.status(500).json({ error: "Failed to process uploaded file" });
  }
});

// Delete project
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user is the owner
    if (project.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Delete associated files
    project.documents.forEach(doc => {
      if (fs.existsSync(doc.filePath)) {
        fs.unlinkSync(doc.filePath);
      }
    });

    // Delete vector embeddings from Pinecone
    try {
      await vectorService.deleteProjectVectors(req.params.id);
      console.log(`[DeleteProjectAPI]: Successfully cleaned up vectors for project: ${req.params.id}`);
    } catch (vectorError) {
      console.error('[DeleteProjectAPI]: Error deleting vectors from Pinecone:', vectorError);
      // Continue with deletion even if vector cleanup fails
    }

    // Delete chat sessions
    await ChatSession.deleteMany({ projectId: req.params.id });

    // Delete project
    await Project.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("[DeleteProjectAPI]: Error deleting project:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


export default router;