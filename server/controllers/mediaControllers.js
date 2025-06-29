import Media from '../models/Media.js';
import Like from '../models/Like.js';
import Comment from '../models/Comment.js';
import { join } from 'path';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
//get all media 
export const getMediaItems = async (req, res) => {
  try {
    const { eventId, userId, tags } = req.query;
    
    let query = Media.find();
    
    if (eventId) query = query.where('eventId').equals(eventId);
    if (userId) query = query.where('userId').equals(userId);
    if (tags) {
      const tagList = tags.split(',');
      query = query.where('tags').all(tagList);
    }
    
    const mediaItems = await query
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    const mediaWithCounts = await Promise.all(
      mediaItems.map(async (media) => {
        const [likesCount, commentsCount] = await Promise.all([
          Like.countDocuments({ targetType: 'Media', targetId: media._id }),
          Comment.countDocuments({ targetType: 'Media', targetId: media._id, approved: true }),
        ]);
        return {
          ...media.toObject(),
          likesCount,
          commentsCount,
        };
      })
    );
    
    res.json(mediaWithCounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Upload media (only organizers and administrators)
export const uploadMediaItem = async (req, res) => {
  try {
    if (!req.files || !req.files.files) {
      return res.status(400).json({ message: 'No files were uploaded' });
    }

    const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
    const { eventId, tags } = req.body;

    const uploadedFiles = [];

    for (const file of files) {
      const fileName = Date.now() + '_' + file.name;
      const filePath = join(uploadsDir, fileName);
      await file.mv(filePath);

      const fileType = file.mimetype.startsWith("image/") ? "image" : "video";

      const mediaItem = new Media({
        type: fileType,
        url: `/uploads/${fileName}`,
        name: file.name,
        size: file.size,
        tags: tags ? tags.split(",") : [],
        eventId: eventId || null,
        userId: req.user._id,
      });

      await mediaItem.save();
      uploadedFiles.push(mediaItem);
    }

    res.status(201).json(uploadedFiles);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Server error during upload" });
  }
};


// Get media items (public - all users can view)
export const getMediaItemById = async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'No files were uploaded' });
    }
    
    const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
    const { eventId, tags } = req.body;
    
    const uploadedFiles = [];
    
    for (const file of files) {
      const fileName = Date.now() + '_' + file.name;
      const filePath = join(uploadsDir, fileName);
      
      // Save file
      await file.mv(filePath);
      
      // Determine file type
      const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
      
      // Create media item
      const mediaItem = new Media({
        type: fileType,
        url: `/uploads/${fileName}`,
        name: file.name,
        size: file.size,
        tags: tags ? tags.split(',') : [],
        eventId: eventId || null,
        userId: req.user._id
      });
      
      await mediaItem.save();
      uploadedFiles.push(mediaItem);
    }
    
    res.status(201).json(uploadedFiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Update media item (only organizers and administrators, and only own content)
export const updateMediaItem = async (req, res) => {
  try {
    let mediaItem = await Media.findById(req.params.id);
    
    if (!mediaItem) {
      return res.status(404).json({ message: 'Media item not found' });
    }
    
    // Check if user owns this media item or is administrator
    if (mediaItem.userId.toString() !== req.user._id.toString() && !['administrator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to update this media item' });
    }
    
    mediaItem = await Media.findByIdAndUpdate(
      req.params.id,
      { ...req.body, userId: mediaItem.userId },
      { new: true, runValidators: true }
    );
    
    res.json(mediaItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Delete media item (only organizers and administrators, and only own content)
export const deleteMediaItem = async (req, res) => {
  try {
    const mediaItem = await Media.findById(req.params.id);
    
    if (!mediaItem) {
      return res.status(404).json({ message: 'Media item not found' });
    }
    
    // Check if user owns this media item or is administrator
    if (mediaItem.userId.toString() !== req.user._id.toString() && !['administrator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to delete this media item' });
    }
    
    // Delete file from uploads directory
    const filePath = join(uploadsDir, mediaItem.url.split('/').pop());
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete associated likes and comments
    await Promise.all([
      Like.deleteMany({ targetType: 'Media', targetId: mediaItem._id }),
      Comment.deleteMany({ targetType: 'Media', targetId: mediaItem._id })
    ]);
    
    await mediaItem.deleteOne();
    res.json({ message: 'Media item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Like media (all authenticated users can like)
export const likeMediaItem = async (req, res) => {
  try {
    const mediaItem = await Media.findById(req.params.id);
    
    if (!mediaItem) {
      return res.status(404).json({ message: 'Media item not found' });
    }
    
    // Check if user already liked this media
    const existingLike = await Like.findOne({
      user: req.user._id,
      targetType: 'Media',
      targetId: mediaItem._id
    });
    
    if (existingLike) {
      // Unlike - remove the like
      await existingLike.deleteOne();
      const likesCount = await Like.countDocuments({ targetType: 'Media', targetId: mediaItem._id });
      res.json({ message: 'Media unliked successfully', liked: false, likesCount });
    } else {
      // Like - add the like
      await Like.create({
        user: req.user._id,
        targetType: 'Media',
        targetId: mediaItem._id
      });
      const likesCount = await Like.countDocuments({ targetType: 'Media', targetId: mediaItem._id });
      res.json({ message: 'Media liked successfully', liked: true, likesCount });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Comment on media (all authenticated users can comment)
export const commentOnMediaItem = async (req, res) => {
  try {
    const mediaItem = await Media.findById(req.params.id);
    
    if (!mediaItem) {
      return res.status(404).json({ message: 'Media item not found' });
    }
    
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    const comment = await Comment.create({
      content: content.trim(),
      user: req.user._id,
      targetType: 'Media',
      targetId: mediaItem._id
    });
    
    await comment.populate('user', 'name');
    
    const commentsCount = await Comment.countDocuments({ 
      targetType: 'Media', 
      targetId: mediaItem._id, 
      approved: true 
    });
    
    res.status(201).json({ 
      message: 'Comment added successfully', 
      comment,
      commentsCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get media comments (public)
export const getMediaComments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const comments = await Comment.find({
      targetType: "Media",
      targetId: req.params.id,
      approved: true,
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Comment.countDocuments({
      targetType: "Media",
      targetId: req.params.id,
      approved: true,
    });

    res.json({
      comments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Error fetching media comments:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Check if user liked media
export const checkLikeStatus = async (req, res) => {
  try {
    const like = await Like.findOne({
      user: req.user._id,
      targetType: 'Media',
      targetId: req.params.id
    });
    
    const likesCount = await Like.countDocuments({ 
      targetType: 'Media', 
      targetId: req.params.id 
    });
    
    res.json({ 
      liked: !!like,
      likesCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}