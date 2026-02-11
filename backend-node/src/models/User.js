const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
    required: true,
    index: true 
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password_hash: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false, // We're handling created_at manually to match Python
  versionKey: false
});

// Hide _id and password_hash in JSON responses
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.password_hash;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
