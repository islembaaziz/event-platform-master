import Event from "../models/Event.js";
import Media from "../models/Media.js";
import Publication from "../models/Publication.js";
import Like from "../models/Like.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";

// Get overall statistics (organizers and administrators only)
export const getOverallStatistics = async (req, res) => {
  try {
    const { timeRange = "30days", eventId } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case "7days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90days":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "12months":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build query filters
    const dateFilter = { createdAt: { $gte: startDate } };
    let eventFilter = {};

    if (eventId && eventId !== "all") {
      eventFilter = { eventId };
    }

    // If user is organizer, only show their content
    let userFilter = {};
    if (req.user.role === "organizer") {
      userFilter = { createdBy: req.user._id };
    }

    // Get basic counts
    const [
      totalEvents,
      totalMedia,
      totalPublications,
      totalUsers,
      totalLikes,
      totalComments,
    ] = await Promise.all([
      Event.countDocuments({ ...userFilter, ...dateFilter }),
      Media.countDocuments({ ...userFilter, ...dateFilter }),
      Publication.countDocuments({ ...userFilter, ...dateFilter }),
      User.countDocuments(dateFilter),
      Like.countDocuments(dateFilter),
      Comment.countDocuments(dateFilter),
    ]);

    // Get engagement data by day
    const engagementByDay = await getEngagementByDay(
      startDate,
      now,
      eventFilter,
      userFilter
    );

    // Get top performing content
    const topEvents = await getTopEvents(userFilter, 5);
    const topMedia = await getTopMedia(userFilter, 5);
    const topPublications = await getTopPublications(userFilter, 5);

    // Get user activity
    const userActivity = await getUserActivity(startDate, now);

    // Get content type distribution
    const contentDistribution = await getContentDistribution(userFilter);

    res.json({
      summary: {
        totalEvents,
        totalMedia,
        totalPublications,
        totalUsers,
        totalLikes,
        totalComments,
        timeRange,
        startDate,
        endDate: now,
      },
      engagementByDay,
      topPerforming: {
        events: topEvents,
        media: topMedia,
        publications: topPublications,
      },
      userActivity,
      contentDistribution,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

