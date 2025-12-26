import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Clock, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../utils/api";
import axios from "axios";

export default function SignIn(){
 const [isLogin, setIsLogin] = useState(true);
 const [formData, setFormData] = useState({
   email: "",
   password: "",
   name: ""
 });
 const [loading, setLoading] = useState(false);
 const [healthChecking, setHealthChecking] = useState(false);
 const [lastHealthCheck, setLastHealthCheck] = useState(null);
 const navigate = useNavigate();


 const handleHealthCheck = async () => {
   setHealthChecking(true);
   try {
     const API_BASE_URL = import.meta.env.VITE_RAGBY_SVC_API_BASE_URL;
     const startTime = Date.now();
     await axios.get(`${API_BASE_URL}/healthCheck`, { timeout: 30000 });
     const endTime = Date.now();
     const responseTime = endTime - startTime;
    
     setLastHealthCheck(Date.now());
     toast.success(`Server warmed up! (${responseTime}ms)`);
   } catch (error) {
     toast.error("Health check failed. Server might be starting up...");
   } finally {
     setHealthChecking(false);
   }
 };
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
   //basic password validation
   if (!formData.password || formData.password.length < 6) {
     toast.error("Password must be at least 6 characters long");
     return;
   }
   if (!isLogin && !formData.name) {// it will not get checked for signin page
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
     {/* Added spin animation style */}
     <style>
       {`
         .spin {
           animation: spin 1s linear infinite;
         }
         @keyframes spin {
           from { transform: rotate(0deg); }
           to { transform: rotate(360deg); }
         }
       `}
     </style>
    
     {/* Server Status Banner */}
     <div className="card" style={{
       backgroundColor: "#fff3cd",
       borderColor: "#ffeaa7",
       marginBottom: "20px",
       padding: "16px"
     }}>
       <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
         <Clock size={20} style={{ color: "#856404" }} />
         <div style={{ flex: 1 }}>
           <h4 style={{ margin: "0 0 4px 0", color: "#856404" }}>
             Hosted on Free Tier (Render)
           </h4>
           <p style={{ margin: 0, fontSize: "14px", color: "#856404" }}>
             First request may take 30-60s to wake up the server
             {lastHealthCheck && (
               <span style={{ fontSize: "12px", opacity: 0.8 }}>
                 {" • "}Warmed {Math.floor((Date.now() - lastHealthCheck) / 1000)}s ago
               </span>
             )}
           </p>
         </div>
         <button
           type="button"
           className="btn secondary small"
           onClick={handleHealthCheck}
           disabled={healthChecking}
           style={{
             display: "flex",
             alignItems: "center",
             gap: "6px",
             minWidth: "100px"
           }}
         >
           {healthChecking ? (
             <>
               <Activity size={14} className="spin" />
               Warming...
             </>
           ) : (
             <>
               <Zap size={14} />
               Warm Up
             </>
           )}
         </button>
       </div>
     </div>
     <div className="card">
       <div className="auth-header">
         <h2>{isLogin ? "Sign In" : "Sign Up"} to RAGby</h2>
         <p className="small-muted">Build your personalized RAG system</p>
       </div>

       <form onSubmit={handleSubmit}>
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
             type="submit"
             className="btn primary"
             disabled={loading}
           >
             {loading ? "Processing..." : (isLogin ? "Sign In" : "Sign Up")}
           </button>
         </div>
       </form>

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
