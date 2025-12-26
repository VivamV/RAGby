import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String, default: "" },
}, { timestamps: true });

// Hash the client-hashed password again on server side
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  // Hash the client-hashed password again for extra security
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method - compare client hash with server-hashed version
UserSchema.methods.comparePassword = async function(candidateHashedPassword) {
  const result = await bcrypt.compare(candidateHashedPassword, this.password);
  console.log("[PASSWORD DEBUG] Comparison result:", result);
  return result;
};

export default mongoose.model("User", UserSchema);