import Event from "../models/Event.js";
import Like from "../models/Like.js";
import Comment from "../models/Comment.js";

//Fetch all envents (public - all users can view)
export const getAllEvents = async (req, res) => {
  try {
    const { userId } = req.query;

    let events = await Event.find();

    if (userId) {
      events = events.filter((event) => event.createdBy.toString() === userId);
    }

    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const [likesCount, commentsCount] = await Promise.all([
          Like.countDocuments({ targetType: "Event", targetId: event._id }),
          Comment.countDocuments({
            targetType: "Event",
            targetId: event._id,
            approved: true,
          }),
        ]);

        return {
          ...event.toObject(),
          likesCount,
          commentsCount,
        };
      })
    );

    res.json(eventsWithCounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


//Fetch an envent (public - all users can view)
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Invalid or missing event ID" });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

//Create new event (only organizers and administrators)
export const createEvent = async (req, res) => {
  try {
    const event = new Event({
      ...req.body,
      createdBy: req.user._id,
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update event (only organizers and administrators, and only own content)
export const updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user owns this event or is admin/administrator
    if (
      event.createdBy.toString() !== req.user._id.toString() &&
      !["administrator"].includes(req.user.role)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this event" });
    }

    event = await Event.findByIdAndUpdate(
      req.params.id,
      { ...req.body, createdBy: event.createdBy },
      { new: true, runValidators: true }
    );

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete event (only organizers and administrators, and only own content)
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user owns this event or is admin/administrator
    if (
      event.createdBy.toString() !== req.user._id.toString() &&
      !["administrator"].includes(req.user.role)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this event" });
    }

    // Delete associated likes and comments
    await Promise.all([
      Like.deleteMany({ targetType: "Event", targetId: event._id }),
      Comment.deleteMany({ targetType: "Event", targetId: event._id }),
    ]);

    await event.deleteOne();
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Like event (all authenticated users can like)
export const likeEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user already liked this event
    const existingLike = await Like.findOne({
      user: req.user._id,
      targetType: "Event",
      targetId: event._id,
    });

    if (existingLike) {
      // Unlike - remove the like
      await existingLike.deleteOne();
      const likesCount = await Like.countDocuments({
        targetType: "Event",
        targetId: event._id,
      });
      res.json({
        message: "Event unliked successfully",
        liked: false,
        likesCount,
      });
    } else {
      // Like - add the like
      await Like.create({
        user: req.user._id,
        targetType: "Event",
        targetId: event._id,
      });
      const likesCount = await Like.countDocuments({
        targetType: "Event",
        targetId: event._id,
      });
      res.json({
        message: "Event liked successfully",
        liked: true,
        likesCount,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Comment on event (all authenticated users can comment)
export const commentOnEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!req.params.id || req.params.id === "undefined") {
      return res.status(400).json({ message: "Invalid or missing event ID" });
    }

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const comment = await Comment.create({
      content: content.trim(),
      user: req.user._id,
      targetType: "Event",
      targetId: event._id,
    });

    await comment.populate("user", "name");

    const commentsCount = await Comment.countDocuments({
      targetType: "Event",
      targetId: event._id,
      approved: true,
    });

    res.status(201).json({
      message: "Comment added successfully",
      comment,
      commentsCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get event comments (public)
export const getEventComments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const comments = await Comment.find({
      targetType: "Event",
      targetId: req.params.id,
      approved: true,
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Comment.countDocuments({
      targetType: "Event",
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
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Check if user liked event (requires authentication)
export const checkLikeStatus = async (req, res) => {
  try {
    const like = await Like.findOne({
      user: req.user._id,
      targetType: "Event",
      targetId: req.params.id,
    });

    const likesCount = await Like.countDocuments({
      targetType: "Event",
      targetId: req.params.id,
    });

    res.json({
      liked: !!like,
      likesCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};