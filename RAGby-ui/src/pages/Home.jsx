import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Brain, Users, MessageCircle, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { projectsAPI } from "../utils/api";

function PublicProjectCard({ project }) {
  const navigate = useNavigate();

  const handleUseProject = () => {
    navigate(`/project/${project._id}`);
  };

  return (
    <div className="card project-card">
      <div className="project-header">
        <div className="project-icon">
          <Brain size={24} />
        </div>
        <div className="project-info">
          <h3 className="project-title">{project.name}</h3>
          <p className="project-description">
            {project.description || "No description provided"}
          </p>
        </div>
      </div>

      <div className="project-meta">
        <div className="meta-item">
          <Users size={14} />
          <span>by {project.userId?.name || "Anonymous"}</span>
        </div>
        <div className="meta-item">
          <MessageCircle size={14} />
          <span>{project.totalChats || 0} chats</span>
        </div>
        <div className="meta-item">
          <Calendar size={14} />
          <span>{new Date(project.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="project-actions">
        <button className="btn primary small" onClick={handleUseProject}>
          Try It Out
        </button>
      </div>
    </div>
  );
}

export default function Home(){
  const [publicProjects, setPublicProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchPublicProjects();
  }, []);

  const fetchPublicProjects = async () => {
    try {
      const projects = await projectsAPI.getPublic();
      setPublicProjects(projects);
    } catch (error) {
      toast.error("Failed to load public projects");
      console.error("Error fetching public projects:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="card hero">
        <div className="hero-left">
          <h1>Welcome back, {user.name}!</h1>
          <p className="hero-subtitle">
            Discover amazing RAG systems created by the community, or build your own personalized AI assistant.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <Brain size={20} />
              <span>{publicProjects.length} Public RAGs</span>
            </div>
          </div>
        </div>
        <div className="hero-right">
          <button 
            className="btn primary large"
            onClick={() => navigate("/create-project")}
          >
            <Plus size={20} />
            Create Your RAG
          </button>
          <button 
            className="btn secondary"
            onClick={() => navigate("/mygpts")}
          >
            My Projects
          </button>
        </div>
      </div>

      {/* Public Projects Section */}
      <div style={{ marginTop: 32 }}>
        <div className="section-header">
          <h2>Public RAG Systems</h2>
          <p className="small-muted">
            Explore and try out RAG systems created by the community
          </p>
        </div>

        {loading ? (
          <div className="card">
            <div className="loading-state">
              <Brain size={32} className="loading-icon" />
              <p>Loading public RAG systems...</p>
            </div>
          </div>
        ) : publicProjects.length > 0 ? (
          <div className="projects-grid">
            {publicProjects.map(project => (
              <PublicProjectCard key={project._id} project={project} />
            ))}
          </div>
        ) : (
          <div className="card empty-state">
            <Brain size={48} className="empty-icon" />
            <h3>No Public RAG Systems Yet</h3>
            <p className="small-muted">
              Be the first to create and share a public RAG system with the community!
            </p>
            <button 
              className="btn primary"
              onClick={() => navigate("/create-project")}
            >
              <Plus size={16} />
              Create First Public RAG
            </button>
          </div>
        )}
      </div>

      {/* Getting Started Section */}
      <div style={{ marginTop: 32 }}>
        <div className="card info-section">
          <h3> Get Started with RAGby</h3>
          <div className="getting-started-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Create a Project</h4>
                <p>Set up your RAG system with a custom system prompt</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Upload Documents</h4>
                <p>Add PDFs, DOCX, or TXT files to build your knowledge base</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Start Chatting</h4>
                <p>Ask questions and get intelligent responses based on your documents</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
