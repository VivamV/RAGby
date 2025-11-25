import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import copy from 'copy-to-clipboard';
import { 
  Send, 
  Plus, 
  Brain, 
  FileText, 
  Trash2, 
  ArrowLeft,
  MessageCircle,
  User,
  Bot,
  Copy,
  Check,
  Edit3
} from "lucide-react";
import toast from "react-hot-toast";
import { projectsAPI, chatAPI } from "../utils/api";
import { ChatNameModal } from "../components/Modal";

//right side wala component
function ChatMessage({ message, sources = [] }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  
  const handleCopy = () => {
    copy(message.content);
    setCopied(true);
    toast.success('Message copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>
      <div className="message-content">
        <div className="message-text">
          {isUser ? (
            <p>{message.content}</p>
          ) : ( //this ReactMarkdown is for styling chat message of bot
            <ReactMarkdown
              components={{
                // Custom styling for markdown elements
                h1: ({children}) => <h1 className="markdown-h1">{children}</h1>,
                h2: ({children}) => <h2 className="markdown-h2">{children}</h2>,
                h3: ({children}) => <h3 className="markdown-h3">{children}</h3>,
                h4: ({children}) => <h4 className="markdown-h4">{children}</h4>,
                p: ({children}) => <p className="markdown-p">{children}</p>,
                ul: ({children}) => <ul className="markdown-ul">{children}</ul>,
                ol: ({children}) => <ol className="markdown-ol">{children}</ol>,
                li: ({children}) => <li className="markdown-li">{children}</li>,
                blockquote: ({children}) => <blockquote className="markdown-blockquote">{children}</blockquote>,
                code: ({children, className}) => {
                  const isCodeBlock = className?.includes('language-');
                  return isCodeBlock ? (
                    <pre className="markdown-code-block">
                      <code>{children}</code>
                    </pre>
                  ) : (
                    <code className="markdown-inline-code">{children}</code>
                  );
                },
                strong: ({children}) => <strong className="markdown-strong">{children}</strong>,
                em: ({children}) => <em className="markdown-em">{children}</em>,
                hr: () => <hr className="markdown-hr" />
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        
        <div className="message-actions">
          <button 
            className="copy-button"
            onClick={handleCopy}
            title="Copy message"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        
        {sources && sources.length > 0 && (
          <div className="message-sources">
            <FileText size={14} />
            <span>Sources: {sources.join(', ')}</span>
          </div>
        )}
        
        <div className="message-time">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

//left side wala component
function ChatSession({ session, isActive, onClick, onDelete, onEdit }) {
  //onClick ka matlab load chat session,onEdit ka matlab name change
  return (
    <div 
      className={`chat-session ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="session-info">
        <MessageCircle size={16} />
        <span className="session-title">{session.title}</span>
      </div>
      <div className="session-meta">
        <span className="message-count">{session.messages?.length || 0}</span>
        <div className="session-actions">
          <button 
            className="btn-icon small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit chat name"
          >
            <Edit3 size={12} />
          </button>
          <button 
            className="btn-icon danger small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete chat"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);

  //loadind state setProject hone tak
  const [loading, setLoading] = useState(true);

  const [chatSessions, setChatSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);//nahut saare sessions mei se koi 1 session hi toh active hoga
  const [messages, setMessages] = useState([]);//for messages inside a session

  const [message, setMessage] = useState("");//jo uss inputbar mei type karte hain ,send button se pehle

  const [sending, setSending] = useState(false);//send button ke liye

  const [showChatNameModal, setShowChatNameModal] = useState(false);//startfirstChat krne pr ye modal open 

  const [editingSession, setEditingSession] = useState(null);

  //for scrolling behaviour inside chat
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
//api call done
  const fetchProjectData = async () => {
    try {
      const data = await projectsAPI.getById(id);
      setProject(data.project);
      setChatSessions(data.chatSessions || []);
      
      // If there are existing sessions, load the first one
      if (data.chatSessions && data.chatSessions.length > 0) {
        loadChatSession(data.chatSessions[0]);
      }
    } catch (error) {
      toast.error("Failed to load project");
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

//left side chat session loaded,aur right side mei uske messages
  const loadChatSession = async (session) => {
    try {
      setActiveSession(session);
      setMessages(session.messages || []);
    } catch (error) {
      toast.error("Failed to load chat session");
    }
  };

  //creating new chat session,api call done
  const createNewChatSession = async (title = "New Chat") => {
    try {
      const session = await chatAPI.createSession(id, title);
      setChatSessions(prev => [session, ...prev]);
      setActiveSession(session);
      setMessages([]);
      toast.success("New chat session created!");
    } catch (error) {
      console.error("Error creating chat session:", error);
      toast.error("Failed to create new chat session");
    }
  };

//first time chat session create karne par,calls create new chat session ,above one
  const handleCreateChat = (title) => {
    createNewChatSession(title);
    setShowChatNameModal(false);
  };

  //maan lo session already hai,then we click edit and update the name,api call done
  const handleEditChat = async (title) => {
    if (!editingSession) return;
    
    try {
      await chatAPI.updateChatTitle(id, editingSession._id, title);
      
      // Update the session in the list
      setChatSessions(prev => 
        prev.map(session => 
          session._id === editingSession._id 
            ? { ...session, title } 
            : session
        )
      );
      
      // Update active session if it's the one being edited
      if (activeSession?._id === editingSession._id) {
        setActiveSession(prev => ({ ...prev, title }));
      }
      
      toast.success("Chat name updated!");
    } catch (error) {
      console.error("Error updating chat title:", error);
      toast.error("Failed to update chat name");
    } finally {
      setEditingSession(null);
      setShowChatNameModal(false);
    }
  };

  // To update the chat name,bas modal open kr dia,and setEditing session
  const startEditingChat = (session) => {
    setEditingSession(session);
    setShowChatNameModal(true);
  };

  //to delete chat session,api call done
  const deleteChatSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this chat session?")) {
      return;
    }

    try {
      await chatAPI.deleteSession(id, sessionId);
      setChatSessions(prev => prev.filter(s => s._id !== sessionId));
      
      // If deleted session was active, clear it
      if (activeSession?._id === sessionId) {
        setActiveSession(null);
        setMessages([]);
      }
      
      toast.success("Chat session deleted");
    } catch (error) {
      toast.error("Failed to delete chat session");
    }
  };

  //chat mei send button click karne par,api call done
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    // If no active session, create one
    if (!activeSession) {
      await createNewChatSession();
      return; // The useEffect will trigger and we can send the message then
    }

    setSending(true);
    const userMessage = { role: 'user', content: message, timestamp: new Date() };
    
    // Optimistically add user message
    setMessages(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage("");

    try {
      const response = await chatAPI.sendMessage(id, activeSession._id, currentMessage);
      
      // Add AI response
      const aiMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        sources: response.sources
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Update session in list (refresh to get updated title if it's the first message)
      if (messages.length === 0) {
        fetchProjectData();
      }
      
    } catch (error) {
      toast.error("Failed to send message");
      // Remove the optimistically added user message on error
      setMessages(prev => prev.slice(0, -1));
      setMessage(currentMessage); // Restore the message
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading-state">
          <Brain size={32} className="loading-icon" />
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  //i dont understand where this project is not found condition will arise
  if (!project) {
    return (
      <div className="card">
        <h3>Project not found</h3>
        <p>The project you're looking for doesn't exist or you don't have access to it.</p>
        <button className="btn primary" onClick={() => navigate("/mygpts")}>
          Back to My Projects
        </button>
      </div>
    );
  }

  return (
    <div className="project-view">
      {/* Header */}
      <div className="project-header">
        <button 
          className="btn secondary small" 
          onClick={() => navigate("/mygpts")}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="project-info">
          <h1>{project.name}</h1>
          <p className="project-description">{project.description}</p>
          <div className="project-stats">
            <span><FileText size={14} /> {project.documents?.length || 0} documents</span>
            <span><MessageCircle size={14} /> {project.totalChats || 0} total chats</span>
          </div>
        </div>
      </div>

      <div className="chat-layout">
        {/* Chat Sessions Sidebar */}
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <h3>Chat Sessions</h3>
            <button className="btn primary small" onClick={() => setShowChatNameModal(true)}>
              <Plus size={16} />
              New Chat
            </button>
          </div>
          
          <div className="chat-sessions-list">
            {chatSessions.length === 0 ? ( 
              <div className="empty-sessions">
                <MessageCircle size={24} />
                <p>No chat sessions yet</p>
                <button className="btn secondary small" onClick={() => setShowChatNameModal(true)}>
                  Start First Chat
                </button>
              </div>
            ) : (
              chatSessions.map(session => (
                <ChatSession //easy
                  session={session}
                  isActive={activeSession?._id === session._id}
                  onClick={() => loadChatSession(session)}
                  onDelete={() => deleteChatSession(session._id)}
                  onEdit={() => startEditingChat(session)}//for name change only
                />
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-main">
          {activeSession ? (
            <>
              <div className="chat-messages">
                {messages.length === 0 ? (//if active session active and 0/no messages send till now
                  <div className="empty-chat">
                    <Bot size={48} />
                    <h3>Start a conversation</h3>
                    <p>Ask questions about your documents or anything else!</p>
                    <div className="system-prompt-preview">
                      <strong>AI Personality:</strong> {project.systemPrompt}
                    </div>
                  </div>
                ) : (//messages length not zero,then show all messages
                  messages.map((msg, index) => (
                    <ChatMessage 
                      key={index} 
                      message={msg} 
                      sources={msg.sources}
                    />
                  ))
                )}
                
                {/* Simple loading indicator when AI is responding */}
                {sending && (
                  <div className="chat-message assistant">
                    <div className="message-avatar">
                      <Bot size={20} />
                    </div>
                    <div className="message-content">
                      <div className="message-text">
                        <p style={{fontStyle: 'italic', opacity: 0.7}}>
                          <Bot size={16} style={{marginRight: '8px', animation: 'spin 2s linear infinite'}} />
                          AI is thinking...
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                 {/* //messages wala yaha end ho gya */}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-form" onSubmit={sendMessage}>
                <div className="input-container">
                  <input
                    type="text"
                    className="chat-input"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={sending}
                  />
                  <button 
                    type="submit" 
                    className="send-button"
                    disabled={!message.trim() || sending}
                  >
                    {sending ? (
                      <div className="spinner-small"></div>
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>
              </form>
            </>//yahan par active session agar hai tab tak ka,if no session then below one
          ) : (
            <div className="no-session-selected">
              <MessageCircle size={48} />
              <h3>No chat session selected</h3>
              <p>Create a new chat session or select an existing one to start chatting.</p>
              <button className="btn primary" onClick={() => setShowChatNameModal(true)}>
                <Plus size={16} />
                Start New Chat
              </button>
            </div>
          )}
        </div>
      </div>
      
      {showChatNameModal && (
        <ChatNameModal
          onSubmit={editingSession ? handleEditChat : handleCreateChat}
          onCancel={() => {
            setShowChatNameModal(false);
            setEditingSession(null);
          }}
          initialValue={editingSession?.title || ""}
          isEdit={!!editingSession}
        />
      )}
    </div>
  );
}
