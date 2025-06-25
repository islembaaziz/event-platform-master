import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['Event', 'Media', 'Publication'],
    required: true
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true,  refPath: 'targetType' },
}, {
  timestamps: true
});

// Ensure a user can only like something once
likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

const Like = mongoose.model('Like', likeSchema);

export default Like;