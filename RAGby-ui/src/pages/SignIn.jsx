import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI } from "../utils/api";

export default function SignIn(){
  console.log("SignIn component rendered");
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.email || !formData.password) {
      toast.error("Email and password are required");
      return;
    }
    
    if (!isLogin && !formData.name) {
      toast.error("Name is required for signup");
      return;
    }
    
    setLoading(true);

    try {
      let response;
      
      if (isLogin) {
        response = await authAPI.login(formData.email, formData.password);
        toast.success("Welcome back!");
      } else {
        response = await authAPI.signup(formData.email, formData.password, formData.name);
        toast.success("Account created successfully!");
      }

      if (response && response.token) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        navigate("/");
      } else {
        toast.error("Authentication failed - no token received");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "Authentication failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{maxWidth:480, margin:"30px auto"}}>
      <div className="card">
        <div className="auth-header">
          <h2>{isLogin ? "Sign In" : "Sign Up"} to RAGby</h2>
          <p className="small-muted">Build your personalized RAG system</p>
        </div>

        <div>
          {!isLogin && (
            <div className="form-row">
              <label className="small-muted">Full Name</label>
              <input 
                type="text" 
                name="name"
                className="input"
                value={formData.name} 
                onChange={handleChange} 
              />
            </div>
          )}

          <div className="form-row">
            <label className="small-muted">Email</label>
            <input 
              type="email" 
              name="email"
              className="input"
              value={formData.email} 
              onChange={handleChange} 
            />
          </div>

          <div className="form-row">
            <label className="small-muted">Password</label>
            <input 
              type="password" 
              name="password"
              className="input"
              value={formData.password} 
              onChange={handleChange} 
            />
          </div>

          <div className="row" style={{marginTop:16}}>
            <button 
              type="button" 
              className="btn primary" 
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? "Processing..." : (isLogin ? "Sign In" : "Sign Up")}
            </button>
            <button 
              type="button" 
              className="btn secondary small" 
              onClick={() => alert("TEST BUTTON WORKS!")}
              style={{marginLeft: 8}}
            >
              TEST
            </button>
          </div>
        </div>

        <div className="auth-switch" style={{marginTop:16, textAlign:"center"}}>
          <span className="small-muted">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button 
            type="button" 
            className="btn secondary small" 
            style={{marginLeft:8}}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
