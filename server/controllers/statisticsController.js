import Event from "../models/Event.js";
import Media from "../models/Media.js";
import Publication from "../models/Publication.js";
import Like from "../models/Like.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import {
  getEngagementByDay,
  getTopEvents,
  getTopMedia,
  getTopPublications,
  getUserActivity,
  getContentDistribution,
} from "./helpers/statisticsHelpers.js";

// Get overall statistics (organizers and administrators only)
export const getOverallStatistics = async (req, res) => {
  try {
    const { timeRange = "30days", eventId } = req.query;

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

    const dateFilter = { createdAt: { $gte: startDate } };
    let userFilter = {};
    let eventMatch = {};

    if (req.user.role === "organizer") {
      userFilter.createdBy = req.user._id;
    }

    if (eventId && eventId !== "all") {
      const eventObjectId = new mongoose.Types.ObjectId(eventId);
      eventMatch = { eventId: eventObjectId };
    }

    const combinedFilter = { ...userFilter, ...dateFilter };
    const combinedEventFilter = { ...eventMatch, ...dateFilter };

    const [
      totalEvents,
      totalMedia,
      totalPublications,
      totalUsers,
      totalLikes,
      totalComments,
    ] = await Promise.all([
      Event.countDocuments(combinedFilter),
      Media.countDocuments(combinedEventFilter),
      Publication.countDocuments(combinedEventFilter),
      User.countDocuments(dateFilter),
      Like.countDocuments({ ...eventMatch, ...dateFilter }),
      Comment.countDocuments({ ...eventMatch, ...dateFilter }),
    ]);

    const engagementByDay = await getEngagementByDay(
      startDate,
      now,
      eventMatch,
      userFilter
    );

    const topEvents = await getTopEvents(userFilter, 5);
    const topMedia = await getTopMedia(userFilter, 5);
    const topPublications = await getTopPublications(userFilter, 5);
    const userActivity = await getUserActivity(startDate, now);
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
