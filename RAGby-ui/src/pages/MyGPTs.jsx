import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Eye, 
  Edit3, 
  Upload, 
  Trash2, 
  Brain, 
  FileText, 
  MessageCircle, 
  Calendar,
  Globe,
  Lock
} from "lucide-react";
import toast from "react-hot-toast";
import { projectsAPI } from "../utils/api";

function ProjectCard({ project, onRefresh }) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: project.name,
    description: project.description,
    systemPrompt: project.systemPrompt,
    isPublic: project.isPublic
  });
  const [uploading, setUploading] = useState(false);

  const handleView = () => {
    navigate(`/project/${project._id}`);
  };

  const handleEdit = async () => {
    if (isEditing) {
      try {
        await projectsAPI.update(project._id, editData);
        toast.success("Project updated successfully!");
        setIsEditing(false);
        onRefresh();
      } catch (error) {
        toast.error("Failed to update project");
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleUpload = () => {
    document.getElementById(`file-${project._id}`).click();
  };
//this below function is not being used in this project
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await projectsAPI.uploadDocument(project._id, file);
      toast.success(`File "${file.name}" uploaded successfully!`);
      onRefresh();
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      try {
        await projectsAPI.delete(project._id);
        toast.success("Project deleted successfully!");
        onRefresh();
      } catch (error) {
        toast.error("Failed to delete project");
      }
    }
  };

  const cancelEdit = () => {
    setEditData({
      name: project.name,
      description: project.description,
      systemPrompt: project.systemPrompt,
      isPublic: project.isPublic
    });
    setIsEditing(false);
  };

  return (
    <div className="card project-card">
      {isEditing ? (
        // Edit Mode
        <div className="project-edit-form">
          <div className="form-row">
            <label className="small-muted">Project Name</label>
            <input
              className="input"
              value={editData.name}
              onChange={(e) => setEditData({...editData, name: e.target.value})}
            />
          </div>
          
          <div className="form-row">
            <label className="small-muted">Description</label>
            <textarea
              className="input"
              rows="2"
              value={editData.description}
              onChange={(e) => setEditData({...editData, description: e.target.value})}
            />
          </div>
          
          <div className="form-row">
            <label className="small-muted">System Prompt</label>
            <textarea
              className="input"
              rows="3"
              value={editData.systemPrompt}
              onChange={(e) => setEditData({...editData, systemPrompt: e.target.value})}
            />
          </div>
          
          <div className="form-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={editData.isPublic}
                onChange={(e) => setEditData({...editData, isPublic: e.target.checked})}
              />
              Make this project public
            </label>
          </div>
          
          <div className="project-actions">
            <button className="btn primary small" onClick={handleEdit}>Save</button>
            <button className="btn secondary small" onClick={cancelEdit}>Cancel</button>
          </div>
        </div>
      ) : (
        // View Mode
        <>
          <div className="project-header">
            <div className="project-icon">
              <Brain size={24} />
            </div>
            <div className="project-info">
              <div className="project-title-row">
                <h3 className="project-title">{project.name}</h3>
                <div className="project-visibility">
                  {project.isPublic ? (
                    <Globe size={14} className="public-icon" title="Public" />
                  ) : (
                    <Lock size={14} className="private-icon" title="Private" />
                  )}
                </div>
              </div>
              <p className="project-description">
                {project.description || "No description provided"}
              </p>
            </div>
          </div>

          <div className="project-meta">
            <div className="meta-item">
              <FileText size={14} />
              <span>{project.documents?.length || 0} documents</span>
            </div>
            <div className="meta-item">
              <MessageCircle size={14} />
              <span>{project.totalChats || 0} chats</span>
            </div>
            <div className="meta-item">
              <Calendar size={14} />
              <span>{new Date(project.lastUsed || project.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="project-actions">
            <button className="btn primary small" onClick={handleView}>
              <Eye size={14} />
              View
            </button>
            <button className="btn secondary small" onClick={handleEdit}>
              <Edit3 size={14} />
              Edit
            </button>
            <button 
              className="btn secondary small" 
              onClick={handleUpload}
              disabled={uploading}
            >
              <Upload size={14} />
              {uploading ? "Uploading..." : "Upload"}
            </button>
            <button className="btn danger small" onClick={handleDelete}>
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </>
      )}

      {/* Hidden file input ,i dodnt understand what its use case*/}
      <input
        id={`file-${project._id}`}
        type="file"
        accept=".pdf,.docx,.txt,.xlsx,.xls,.csv,.ods"
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />
    </div>
  );
}

export default function MyGPTs() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const userProjects = await projectsAPI.getMy();
      setProjects(userProjects);
    } catch (error) {
      toast.error("Failed to load your projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    navigate("/create-project");
  };

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1>My RAG Projects</h1>
          <p className="small-muted">Manage your personalized AI assistants</p>
        </div>
        <div className="header-right">
          <button className="btn primary" onClick={handleCreateProject}>
            <Plus size={16} />
            Create Project
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="loading-state">
            <Brain size={32} className="loading-icon" />
            <p>Loading your projects...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="card empty-state">
          <Brain size={48} className="empty-icon" />
          <h3>No Projects Yet</h3>
          <p className="small-muted">
            Create your first RAG project to get started with personalized AI assistance.
          </p>
          <button className="btn primary" onClick={handleCreateProject}>
            <Plus size={16} />
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <ProjectCard 
              key={project._id} 
              project={project} 
              onRefresh={fetchProjects}
            />
          ))}
        </div>
      )}
    </div>
  );
}
