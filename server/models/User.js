import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['organizer', 'participant', 'administrator'],
    default: 'participant'
  },
  organization: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  settings: {
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      eventReminders: { type: Boolean, default: true },
      commentNotifications: { type: Boolean, default: true },
      newsletterSubscription: { type: Boolean, default: false }
    },
    securitySettings: {
      twoFactorAuth: { type: Boolean, default: false },
      sessionTimeout: { type: String, default: '30' },
      loginNotifications: { type: Boolean, default: true }
    },
    appearanceSettings: {
      theme: { type: String, default: 'dark' },
      fontSize: { type: String, default: 'medium' },
      compactMode: { type: Boolean, default: false },
      animationsEnabled: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;