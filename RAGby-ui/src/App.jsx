import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import './App.css';
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";
import MyGPTs from "./pages/MyGPTs";
import ProjectView from "./pages/ProjectView";
import Navbar from "./components/Navbar";
import CreateProject from "./pages/CreateProject";
import Profile from "./pages/Profile";

// Protected Route component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/signin" />;
}

// Auth Route component (redirects to home if already logged in)
function AuthRoute({ children }) {
  const token = localStorage.getItem("token");
  return !token ? children : <Navigate to="/" />;
}

function App(){
  
  const token = localStorage.getItem("token");
  
  return (
    <>
      <Navbar />
      <div className={`container ${!token ? 'auth-container' : ''}`}>
        <Routes>
          <Route path="/signin" element={<AuthRoute><SignIn /></AuthRoute>} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/mygpts" element={<ProtectedRoute><MyGPTs /></ProtectedRoute>} />
          <Route path="/create-project" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
          <Route path="/project/:id" element={<ProtectedRoute><ProjectView /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<div className="card">Page not found</div>} />
        </Routes>
      </div>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
