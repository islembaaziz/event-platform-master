// statisticsHelpers.js
import Event from "../../models/Event.js";
import Media from "../../models/Media.js";
import Publication from "../../models/Publication.js";
import Like from "../../models/Like.js";
import Comment from "../../models/Comment.js";
import User from "../../models/User.js";

// Get engagement statistics by day
export async function getEngagementByDay(
  startDate,
  endDate,
  eventFilter,
  userFilter
) {
  const days = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayStart = new Date(currentDate);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const [likes, comments, views] = await Promise.all([
      Like.countDocuments({
        createdAt: { $gte: dayStart, $lte: dayEnd },
        ...eventFilter,
      }),
      Comment.countDocuments({
        createdAt: { $gte: dayStart, $lte: dayEnd },
        ...eventFilter,
      }),
      Event.aggregate([
        {
          $match: {
            createdAt: { $gte: dayStart, $lte: dayEnd },
            ...userFilter,
          },
        },
        {
          $group: { _id: null, totalViews: { $sum: "$views" } },
        },
      ]),
    ]);

    days.push({
      date: dayStart.toISOString().split("T")[0],
      likes,
      comments,
      views: views[0]?.totalViews || 0,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
}

// Get top performing events
export async function getTopEvents(userFilter, limit) {
  const events = await Event.find(userFilter)
    .populate("createdBy", "name")
    .sort({ views: -1 })
    .limit(limit);

  const eventsWithEngagement = await Promise.all(
    events.map(async (event) => {
      const [likesCount, commentsCount] = await Promise.all([
        Like.countDocuments({ targetType: "Event", targetId: event._id }),
        Comment.countDocuments({ targetType: "Event", targetId: event._id }),
      ]);

      return {
        ...event.toObject(),
        likesCount,
        commentsCount,
        engagementScore: likesCount + commentsCount + event.views,
      };
    })
  );

  return eventsWithEngagement.sort(
    (a, b) => b.engagementScore - a.engagementScore
  );
}

// Get top performing media
export async function getTopMedia(userFilter, limit) {
  const media = await Media.find(userFilter)
    .populate("userId", "name")
    .limit(limit * 2);

  const mediaWithEngagement = await Promise.all(
    media.map(async (item) => {
      const [likesCount, commentsCount] = await Promise.all([
        Like.countDocuments({ targetType: "Media", targetId: item._id }),
        Comment.countDocuments({ targetType: "Media", targetId: item._id }),
      ]);

      return {
        ...item.toObject(),
        likesCount,
        commentsCount,
        engagementScore: likesCount + commentsCount,
      };
    })
  );

  return mediaWithEngagement
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, limit);
}

// Get top performing publications
export async function getTopPublications(userFilter, limit) {
  const publications = await Publication.find(userFilter)
    .populate("author", "name")
    .limit(limit * 2);

  const publicationsWithEngagement = await Promise.all(
    publications.map(async (pub) => {
      const [likesCount, commentsCount] = await Promise.all([
        Like.countDocuments({ targetType: "Publication", targetId: pub._id }),
        Comment.countDocuments({
          targetType: "Publication",
          targetId: pub._id,
        }),
      ]);

      return {
        ...pub.toObject(),
        likesCount,
        commentsCount,
        engagementScore: likesCount + commentsCount,
      };
    })
  );

  return publicationsWithEngagement
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, limit);
}

// Get user activity statistics
export async function getUserActivity(startDate, endDate) {
  const [newUsers, activeUsers] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
    Promise.all([
      Like.distinct("user", { createdAt: { $gte: startDate, $lte: endDate } }),
      Comment.distinct("user", {
        createdAt: { $gte: startDate, $lte: endDate },
      }),
    ]).then(([likeUsers, commentUsers]) => {
      const activeUserIds = new Set([...likeUsers, ...commentUsers]);
      return activeUserIds.size;
    }),
  ]);

  return {
    newUsers,
    activeUsers,
  };
}

// Get content type distribution
export async function getContentDistribution(userFilter) {
  const [events, images, videos, publications] = await Promise.all([
    Event.countDocuments(userFilter),
    Media.countDocuments({ ...userFilter, type: "image" }),
    Media.countDocuments({ ...userFilter, type: "video" }),
    Publication.countDocuments(userFilter),
  ]);

  return {
    events,
    images,
    videos,
    publications,
  };
}
