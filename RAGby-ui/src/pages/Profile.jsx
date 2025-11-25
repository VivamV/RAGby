import React from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin");
  };

  return (
    <div style={{ maxWidth: 600, margin: "30px auto" }}>
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <User size={32} style={{ marginRight: 16 }} />
          <div>
            <h2>My Profile</h2>
            <p className="small-muted">Manage your account settings</p>
          </div>
        </div>

        <div className="profile-info">
          <div className="form-row">
            <label className="small-muted">Name</label>
            <div className="input-display">{user.name || "Not provided"}</div>
          </div>

          <div className="form-row">
            <label className="small-muted">Email</label>
            <div className="input-display">{user.email || "Not provided"}</div>
          </div>

          <div className="form-row">
            <label className="small-muted">Member Since</label>
            <div className="input-display">
              {new Date().toLocaleDateString()} {/* In real app, this would come from user.createdAt */}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #eee" }}>
          <button 
            className="btn outline" 
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center" }}
          >
            <LogOut size={16} style={{ marginRight: 8 }} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
