import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  theme: {
    primaryColor: { type: String, default: '#FFEB3B' },
    secondaryColor: { type: String, default: '#7E57C2' },
    backgroundColor: { type: String, default: '#121212' },
    textColor: { type: String, default: '#FFFFFF' },
    fontFamily: { type: String, default: 'Inter, sans-serif' }
  },
  sections: [{
    id: String,
    type: {
      type: String,
      enum: ['header', 'gallery', 'text', 'video', 'testimonial', 'schedule']
    },
    title: String,
    content: mongoose.Schema.Types.Mixed,
    settings: {
      layout: String,
      columns: Number,
      backgroundColor: String,
      textColor: String
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  mediaCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Event = mongoose.model('Event', eventSchema);

export default Event;