# RAGby - Build Your Own RAG System

A comprehensive RAG (Retrieval-Augmented Generation) system that allows users to create personalized AI assistants using their own documents.

## Features

**Complete RAG System**
- Upload PDF, DOCX, and TXT documents
- Intelligent document search and context retrieval
- AI-powered responses using Google Gemini API
- Chat history with multiple sessions per project

**Project Management**
- Create public or private RAG projects
- Custom system prompts for different AI personalities
- Document management with upload/delete capabilities
- Project sharing and discovery

**Advanced Chat Interface**
- Multiple chat sessions per project
- Message context awareness
- Document source attribution
- Real-time responses

**User Management**
- Secure authentication with JWT
- User profiles and project ownership
- Public project discovery

## Tech Stack

### Backend
- **Node.js + Express** - Server framework
- **MongoDB + Mongoose** - Database
- **Google Gemini API** - AI responses (Free tier available)
- **JWT** - Authentication
- **Multer** - File upload handling
- **pdf-parse, mammoth** - Document text extraction

### Frontend
- **React 19 + Vite** - Modern React development
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hot Toast** - Notification system
- **Lucide React** - Beautiful icons

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- Google Gemini API key (free at https://makersuite.google.com/app/apikey)

### Backend Setup

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/ragby
   JWT_SECRET=your-super-secret-jwt-key-here
   GEMINI_API_KEY=your-gemini-api-key-here
   PORT=5000
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

### Database Setup

1. **Install MongoDB** (if running locally)
   - Download and install MongoDB Community Edition
   - Start MongoDB service

2. **Or use MongoDB Atlas** (cloud)
   - Create a free cluster at https://cloud.mongodb.com
   - Get your connection string and update `MONGODB_URI` in `.env`

## Usage Guide

### 1. **Sign Up / Sign In**
- Create a new account or sign in
- All data is securely stored per user

### 2. **Create Your First RAG Project**
- Click "Create Project" in the navbar
- Set a project name and description
- Define your AI's personality with a system prompt
- Upload documents (PDF, DOCX, TXT)
- Choose visibility (Private or Public)

### 3. **Chat with Your RAG**
- Click on your project to open the chat interface
- Create new chat sessions for different conversations
- Ask questions about your documents
- Get intelligent responses with source attribution

### 4. **Manage Projects**
- View all your projects in "MyGPTs"
- Edit system prompts and project details
- Upload additional documents
- Delete projects you no longer need

### 5. **Discover Public RAGs**
- Browse public RAG systems on the Home page
- Try out RAGs created by other users
- Get inspired for your own projects

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Projects
- `GET /api/projects/public` - Get public projects
- `GET /api/projects/my` - Get user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/upload` - Upload document

### Chat
- `POST /api/chat/:projectId/sessions` - Create chat session
- `GET /api/chat/:projectId/sessions` - Get chat sessions
- `POST /api/chat/:projectId/sessions/:sessionId/messages` - Send message
- `GET /api/chat/:projectId/sessions/:sessionId/messages` - Get messages
- `DELETE /api/chat/:projectId/sessions/:sessionId` - Delete session

## Features Explained

### RAG Implementation
- **Document Processing**: Extracts text from uploaded files
- **Semantic Search**: Finds relevant document chunks for user queries
- **Context Building**: Combines relevant documents with conversation history
- **AI Integration**: Uses Google Gemini for intelligent responses
- **Source Attribution**: Shows which documents were used for responses

### Security Features
- **Input Validation**: Prevents malicious content
- **Content Filtering**: Basic guardrails against harmful requests
- **Access Control**: Users can only access their own private projects
- **File Type Validation**: Only allows safe document types
- **Size Limits**: Prevents abuse with file size restrictions

### User Experience
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Instant chat responses
- **Error Handling**: Graceful error messages
- **Loading States**: Clear feedback during operations
- **Toast Notifications**: Non-intrusive success/error messages

## Deployment

### Backend Deployment (Railway/Render/Heroku)
1. Set environment variables in your hosting platform
2. Deploy the `/server` directory
3. Ensure MongoDB is accessible from your host

### Frontend Deployment (Vercel/Netlify)
1. Update API URLs to point to your backend
2. Deploy the `/client` directory
3. Set up environment variables if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have questions:
1. Check the GitHub issues
2. Create a new issue with detailed information
3. Join our community discussions

---
