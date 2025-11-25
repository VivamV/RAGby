import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Brain, 
  Upload, 
  FileText, 
  Globe, 
  Lock, 
  Sparkles,
  ArrowLeft,
  Plus
} from "lucide-react";
import toast from "react-hot-toast";
import { projectsAPI } from "../utils/api";

export default function CreateProject() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemPrompt: "You are a helpful AI assistant. Answer questions based on the provided documents and context.",
    isPublic: false
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    console.log("handleChange in create Project",e.target);
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setLoading(true);

    try {
      // Create the project
      const project = await projectsAPI.create(formData);
      toast.success("Project created successfully!");

      // Upload files if any
      if (files.length > 0) {
        const uploadPromises = files.map(file => 
          projectsAPI.uploadDocument(project._id, file)
        );
        
        await Promise.all(uploadPromises);
        toast.success(`${files.length} file(s) uploaded successfully!`);
      }

      // Navigate to the project
      navigate(`/project/${project._id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(error.response?.data?.error || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const systemPromptExamples = [
    {
      title: "Senior Software Engineer",
      prompt: "You are a senior software engineer with 10+ years of experience. Provide detailed technical solutions, code examples, and best practices. Focus on clean, maintainable, and scalable solutions."
    },
    {
      title: "Travel Planner",
      prompt: "You are an expert travel planner. Help create detailed itineraries, suggest accommodations, activities, and provide practical travel advice based on the destination information provided."
    },
    {
      title: "Research Assistant",
      prompt: "You are a research assistant. Analyze documents thoroughly, provide detailed summaries, extract key insights, and answer questions with citations to specific sources."
    },
    {
      title: "Customer Support",
      prompt: "You are a helpful customer support agent. Provide clear, friendly, and solution-oriented responses. Use the documentation to answer questions accurately and guide users step by step."
    }
  ];

  const useExamplePrompt = (prompt) => {
    setFormData(prev => ({ ...prev, systemPrompt: prompt }));
  };

  return (
    <div style={{ maxWidth: 800, margin: "20px auto" }}>
      {/* Header */}
      <div className="page-header">
        <button 
          className="btn secondary small" 
          onClick={() => navigate("/mygpts")}
        >
          <ArrowLeft size={16} />
          Back to My Projects
        </button>
        <div>
          <h1>Create New RAG Project</h1>
          <p className="small-muted">Build your personalized AI assistant</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="section-header">
            <Brain size={24} />
            <div>
              <h3>Project Details</h3>
              <p className="small-muted">Basic information about your RAG system</p>
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">
              Project Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="name"
              className="input"
              placeholder="e.g., My Travel Planner, Code Assistant, Research Helper"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="input"
              rows="3"
              placeholder="Describe what your RAG system does and how it helps users..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <Sparkles size={24} />
            <div>
              <h3>AI Personality & Behavior</h3>
              <p className="small-muted">Define how your AI assistant should behave</p>
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">
              System Prompt <span className="required">*</span>
            </label>
            <textarea
              name="systemPrompt"
              className="input"
              rows="4"
              placeholder="You are a helpful AI assistant..."
              value={formData.systemPrompt}
              onChange={handleChange}
              required
            />
            <p className="form-help">
              This defines your AI's personality, expertise, and how it should respond to users.
            </p>
          </div>

          <div className="prompt-examples">
            <h4>Quick Examples:</h4>
            <div className="examples-grid">
              {systemPromptExamples.map((example, index) => (
                <div key={index} className="example-card">
                  <h5>{example.title}</h5>
                  <p className="small-muted">{example.prompt.substring(0, 100)}...</p>
                  <button
                    type="button"
                    className="btn secondary small"
                    onClick={() => useExamplePrompt(example.prompt)}
                  >
                    Use This
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <Upload size={24} />
            <div>
              <h3>Knowledge Base</h3>
              <p className="small-muted">Upload documents to build your RAG knowledge base</p>
            </div>
          </div>

          <div className="upload-area">
            <input
              type="file"
              id="file-upload"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" className="upload-zone">
              <FileText size={32} />
              <h4>Upload Documents</h4>
              <p>Drag & drop files here or click to browse</p>
              <p className="small-muted">Supports PDF, DOCX, and TXT files (Max 10MB each)</p>
            </label>
          </div>

          {files.length > 0 && (
            <div className="uploaded-files">
              <h4>Selected Files:</h4>
              {files.map((file, index) => (
                <div key={index} className="file-item">
                  <FileText size={16} />
                  <span>{file.name}</span>
                  <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button
                    type="button"
                    className="btn danger small"
                    onClick={() => removeFile(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <Globe size={24} />
            <div>
              <h3>Visibility Settings</h3>
              <p className="small-muted">Choose who can access your RAG system</p>
            </div>
          </div>

          <div className="visibility-options">
            <label className="radio-option">
              <input
                type="radio"
                name="isPublic"
                checked={!formData.isPublic}
                onChange={() => setFormData(prev => ({ ...prev, isPublic: false }))}
              />
              <div className="radio-content">
                <Lock size={20} />
                <div>
                  <h4>Private</h4>
                  <p className="small-muted">Only you can access this project</p>
                </div>
              </div>
            </label>

            <label className="radio-option">
              <input
                type="radio"
                name="isPublic"
                checked={formData.isPublic}
                onChange={() => setFormData(prev => ({ ...prev, isPublic: true }))}
              />
              <div className="radio-content">
                <Globe size={20} />
                <div>
                  <h4>Public</h4>
                  <p className="small-muted">Anyone can view and use this project</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn secondary"
            onClick={() => navigate("/mygpts")}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn primary"
            disabled={loading}
          >
            {loading ? (
              "Creating Project..."
            ) : (
              <>
                <Plus size={16} />
                Create Project
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
