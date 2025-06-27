import Publication from "../models/Publication.js";
import Like from "../models/Like.js";
import Comment from "../models/Comment.js";

// Get publications (public - all users can view)
export const getAllPublications = async (req, res) => {
  try {
    const { eventId, status } = req.query;

    let query = Publication.find();

    if (eventId) {
      query = query.where("eventId").equals(eventId);
    }

    if (status) {
      query = query.where("status").equals(status);
    }

    const publications = await query
      .populate("author", "name email")
      .populate("eventId", "title")
      .sort({ createdAt: -1 });

    const publicationsWithComments = await Promise.all(
      publications.map(async (publication) => {
        const [likesCount, commentsCount, comments] = await Promise.all([
          Like.countDocuments({
            targetType: "Publication",
            targetId: publication._id,
          }),
          Comment.countDocuments({
            targetType: "Publication",
            targetId: publication._id,
            approved: true,
          }),
          Comment.find({
            targetType: "Publication",
            targetId: publication._id,
            approved: true,
          })
            .populate("user", "name")
            .sort({ createdAt: -1 })
            .lean(),
        ]);

        const formattedComments = comments.map((c) => ({
          _id: c._id,
          content: c.content,
          user: c.user?.name || c.user,
          date: c.createdAt,
          approved: c.approved,
        }));

        return {
          ...publication.toObject(),
          likesCount,
          commentsCount,
          comments: formattedComments,
        };
      })
    );

    res.json(publicationsWithComments);
  } catch (error) {
    console.error("Error in getAllPublications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single publication (public - all users can view)
export const getPublicationById = async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id)
      .populate("author", "name email")
      .populate("eventId", "title");

    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }

    // Get like and comment counts
    const [likesCount, commentsCount, comments] = await Promise.all([
      Like.countDocuments({
        targetType: "Publication",
        targetId: publication._id,
      }),
      Comment.countDocuments({
        targetType: "Publication",
        targetId: publication._id,
        approved: true,
      }),
      Comment.find({
        targetType: "Publication",
        targetId: publication._id,
        approved: true,
      })
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({
      ...publication.toObject(),
      likesCount,
      commentsCount,
      comments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create publication (only organizers and administrators)
export const createPublication = async (req, res) => {
  try {
    const publication = new Publication({
      ...req.body,
      author: req.user._id,
      publishDate: req.body.status === "published" ? new Date() : null,
    });

    await publication.save();
    res.status(201).json(publication);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update publication (only organizers and administrators, and only own content)
export const updatePublication = async (req, res) => {
  try {
    let publication = await Publication.findById(req.params.id);

    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }

    // Check if user owns this publication or is administrator
    if (
      publication.author.toString() !== req.user._id.toString() &&
      !["administrator"].includes(req.user.role)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this publication" });
    }

    const isNewlyPublished =
      publication.status !== "published" && req.body.status === "published";

    publication = await Publication.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        author: publication.author,
        publishDate: isNewlyPublished ? new Date() : publication.publishDate,
      },
      { new: true, runValidators: true }
    );

    res.json(publication);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete publication (only organizers and administrators, and only own content)
export const deletePublication = async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);

    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }

    // Check if user owns this publication or is administrator
    if (
      publication.author.toString() !== req.user._id.toString() &&
      !["administrator"].includes(req.user.role)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this publication" });
    }

    // Delete associated likes and comments
    await Promise.all([
      Like.deleteMany({ targetType: "Publication", targetId: publication._id }),
      Comment.deleteMany({
        targetType: "Publication",
        targetId: publication._id,
      }),
    ]);

    await publication.deleteOne();
    res.json({ message: "Publication deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Like publication (all authenticated users can like)
export const likePublication = async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);

    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }

    // Check if user already liked this publication
    const existingLike = await Like.findOne({
      user: req.user._id,
      targetType: "Publication",
      targetId: publication._id,
    });

    if (existingLike) {
      // Unlike - remove the like
      await existingLike.deleteOne();
      const likesCount = await Like.countDocuments({
        targetType: "Publication",
        targetId: publication._id,
      });
      res.json({
        message: "Publication unliked successfully",
        liked: false,
        likesCount,
      });
    } else {
      // Like - add the like
      await Like.create({
        user: req.user._id,
        targetType: "Publication",
        targetId: publication._id,
      });
      const likesCount = await Like.countDocuments({
        targetType: "Publication",
        targetId: publication._id,
      });
      res.json({
        message: "Publication liked successfully",
        liked: true,
        likesCount,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Comment on publication (all authenticated users can comment)
export const commentOnPublication = async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);

    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }

    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const comment = await Comment.create({
      content: content.trim(),
      user: req.user._id,
      targetType: "Publication",
      targetId: publication._id,
    });

    await comment.populate("user", "name");

    const commentsCount = await Comment.countDocuments({
      targetType: "Publication",
      targetId: publication._id,
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

// Check if user liked publication
export const checkLikeStatus = async (req, res) => {
  try {
    const like = await Like.findOne({
      user: req.user._id,
      targetType: "Publication",
      targetId: req.params.id,
    });

    const likesCount = await Like.countDocuments({
      targetType: "Publication",
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
