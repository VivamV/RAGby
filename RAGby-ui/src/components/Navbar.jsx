import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, Plus, Home, Brain } from "lucide-react";

export default function Navbar(){
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  function logout(){
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin");
  }

  if (location.pathname === "/signin" && token) {
  navigate("/");
  return null;
}
  // Don't show navbar on sign-in page
  if (location.pathname === "/signin") {
    return null;
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-left">
          <Link to={token ? "/" : "/signin"} className="logo-link">
            <div className="logo">RAGby</div>
            <div className="small-muted">Build your personalized RAG</div>
          </Link>
        </div>

        <div className="nav-links">
          {token ? (
            <>
              <Link to="/">
                <button className={isActive("/") ? "btn active" : "btn secondary"}>
                  <Home size={16} />
                  Home
                </button>
              </Link>
              
              <Link to="/mygpts">
                <button className={isActive("/mygpts") ? "btn active" : "btn secondary"}>
                  <Brain size={16} />
                  MyGPTs
                </button>
              </Link>
              
              <Link to="/create-project">
                <button className={isActive("/create-project") ? "btn active" : "btn secondary"}>
                  <Plus size={16} />
                  Create Project
                </button>
              </Link>
              
              <Link to="/profile">
                <button className={isActive("/profile") ? "btn active" : "btn secondary"}>
                  <User size={16} />
                  {user.name || "Profile"}
                </button>
              </Link>
              
              <button onClick={logout} className="btn small danger">
                Logout
              </button>
            </>
          ) : (
            <Link to="/signin">
              <button className="btn primary">
                Sign In
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
