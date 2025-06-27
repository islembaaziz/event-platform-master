import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  Calendar,
  Users,
  Image as ImageIcon,
  MessageSquare,
  ChevronRight,
  Eye,
  Share2,
  Trash2,
  Edit2,
  Heart,
  ThumbsUp,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import RoleGuard from "../../components/common/RoleGuard";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

interface Event {
  attendees: number;
  _doc: {
    _id: string;
    title: string;
    date: string;
    location: string;
    coverImage?: string;
    createdBy?: {
      _id: string;
      name: string;
    };
    attendees?: number;
    mediaCount?: number;
    commentsCount?: number;
    likesCount?: number;
    shares?: number;
  };
  _id: string;
  title: string;
  date: string;
  location: string;
  coverImage: string;
  createdBy: {
    _id: string;
    name: string;
  };
  mediaCount: number;
  commentsCount: number;
  likesCount: number;
  shares: number;
  isPublished: boolean;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedEvents, setLikedEvents] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalAttendees: 0,
    totalMedia: 0,
    totalShares: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [eventsResponse, mediaResponse] = await Promise.all([
        api.get("/events"),
        api.get("/media"),
      ]);

      const fetchedEvents = eventsResponse.data;
      setEvents(fetchedEvents);

      setStats({
        totalEvents: fetchedEvents.length,
        totalAttendees: fetchedEvents.reduce(
          (sum: number, event: Event) => sum + (event.attendees || 0),
          0
        ),
        totalMedia: mediaResponse.data.length,
        totalShares: fetchedEvents.reduce(
          (sum: number, event: Event) => sum + (event.shares || 0),
          0
        ),
      });

      // Check which events the user has liked
      if (user) {
        const likeStatuses = await Promise.all(
          fetchedEvents.map((event: Event) =>
            event._id
              ? api
                  .get(`/events/${event._id}/like-status`)
                  .catch(() => ({ data: { liked: false } }))
              : Promise.resolve({ data: { liked: false } })
          )
        );

        const likedEventIds: Set<string> = new Set(
          fetchedEvents
            .filter(
              (event: Event, index: number) => likeStatuses[index]?.data?.liked
            )
            .map((event: Event) => event._id)
        );

        setLikedEvents(likedEventIds);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to load dashboard data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await api.delete(`/events/${eventId}`);
      setEvents(events.filter((event) => event._id !== eventId));
      toast.success("Event deleted successfully");

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalEvents: prev.totalEvents - 1,
      }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete event");
    }
  };

  const likeEvent = async (eventId: string) => {
    try {
      const response = await api.post(`/events/${eventId}/like`);
      const { liked, likesCount } = response.data;

      // Update local state
      setLikedEvents((prev) => {
        const newSet = new Set(prev);
        if (liked) {
          newSet.add(eventId);
        } else {
          newSet.delete(eventId);
        }
        return newSet;
      });

      // Update the event's like count in the events list
      setEvents((prev) =>
        prev.map((event) =>
          event._id === eventId ? { ...event, likesCount } : event
        )
      );

      toast.success(liked ? "Event liked!" : "Event unliked!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to like event");
    }
  };

  const addComment = async (eventId: string) => {
    console.log("Received in addComment:", eventId); // <= ajoute ceci
    const content = prompt("Add a comment:");
    if (!content || content.trim() === "") return;

    try {
      const response = await api.post(`/events/${eventId}/comment`, {
        content: content.trim(),
      });
      const { commentsCount } = response.data;

      // Update the event's comment count in the events list
      setEvents((prev) =>
        prev.map((event) =>
          event._id === eventId ? { ...event, commentsCount } : event
        )
      );

      toast.success("Comment added successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add comment");
    }
  };

  const canManageContent =
    user?.role === "organizer" || user?.role === "administrator";

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Role-specific welcome messages */}
        {user?.role === "administrator" ? (
          <div className="bg-gradient-to-r from-purple-500/20 to-primary-500/20 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-6 w-6 text-purple-400 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Welcome, Administrator!
                </h3>
                <p className="text-dark-500">
                  You have full access to manage users, events, and system
                  settings.
                </p>
              </div>
            </div>
          </div>
        ) : user?.role === "organizer" ? (
          <div className="bg-gradient-to-r from-green-500/20 to-primary-500/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-green-400 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Welcome, Event Organizer!
                </h3>
                <p className="text-dark-500">
                  Create and manage amazing events, upload media, and publish
                  content.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-500/20 to-primary-500/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center">
              <Heart className="h-6 w-6 text-blue-400 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Welcome, Participant!
                </h3>
                <p className="text-dark-500">
                  Discover events, like content, and engage with the community.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overview stats */}
        <div className="flex justify-center items-center gap-4 ">
          <div className="stat-card w-full">
            <div className="flex justify-between items-start">
              <span className="stat-label">Total Events</span>
              <Calendar className="h-5 w-5 text-primary-500" />
            </div>
            <div className="stat-value">{stats.totalEvents}</div>
          </div>
          <div className="stat-card w-full">
            <div className="flex justify-between items-start">
              <span className="stat-label">Media Uploads</span>
              <ImageIcon className="h-5 w-5 text-primary-500" />
            </div>
            <div className="stat-value">
              {stats.totalMedia.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Event list section */}
        <div className="bg-dark-100 rounded-lg overflow-hidden">
          <div className="p-4 bg-dark-200 border-b border-dark-300 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">
              {canManageContent ? "Your Events" : "Available Events"}
            </h2>
            <RoleGuard allowedRoles={["organizer", "administrator"]}>
              <Link to="/editor/new" className="btn-primary">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Event
              </Link>
            </RoleGuard>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
              <p className="mt-4 text-dark-500">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mb-4 bg-dark-200 inline-flex items-center justify-center w-16 h-16 rounded-full">
                <Calendar className="h-8 w-8 text-dark-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No events yet
              </h3>
              <p className="text-dark-500 mb-6">
                {canManageContent
                  ? "Create your first event to get started"
                  : "No events available at the moment"}
              </p>
              <RoleGuard allowedRoles={["organizer", "administrator"]}>
                <Link to="/editor/new" className="btn-primary">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Event
                </Link>
              </RoleGuard>
            </div>
          ) : (
            <div className="divide-y divide-dark-300">
              {events.map((event) => {
                console.log("Event in map:", event); // Debugging line
                return (
                  <div
                    key={event._id}
                    className="p-4 hover:bg-dark-200 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                        <img
                          src={
                            event.coverImage ||
                            "https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg"
                          }
                          alt={event.title}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {event.title}
                          </h3>
                          <span className="text-xs text-dark-500 whitespace-nowrap ml-2">
                            {new Date(event.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-dark-500 text-sm truncate">
                          {event.location}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-3">
                          <div className="flex items-center text-dark-500 text-xs">
                            <Heart className="h-3 w-3 mr-1" />
                            {event.likesCount || 0} likes
                          </div>
                          <div className="flex items-center text-dark-500 text-xs">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {event.commentsCount || 0} comments
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex space-x-2">
                        {/* Like button */}
                        <button
                          onClick={() => likeEvent(event._id)}
                          className={`btn-secondary text-xs py-1 px-3 transition-colors ${
                            likedEvents.has(event._id)
                              ? "bg-red-500 text-white hover:bg-red-600"
                              : "text-red-500 hover:bg-red-500 hover:text-white"
                          }`}
                        >
                          <Heart
                            className={`h-4 w-4 mr-1 ${
                              likedEvents.has(event._id) ? "fill-current" : ""
                            }`}
                          />
                          Like
                        </button>

                        {/* Comment button with console log */}
                        <button
                          onClick={() => {
                            console.log("event in comment button:", event);
                            addComment(event._id || event._doc?._id);
                          }}
                          className="btn-secondary text-xs py-1 px-3 text-blue-500 hover:bg-blue-500 hover:text-white"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Comment
                        </button>

                        {/* Edit/Delete buttons */}
                        <RoleGuard
                          allowedRoles={["organizer", "administrator"]}
                        >
                          {canManageContent &&
                            event?.createdBy?._id &&
                            (event.createdBy._id === user?._id ||
                              user?.role === "administrator") && (
                              <>
                                <Link
                                  to={`/editor/${event._id}`}
                                  className="btn-secondary text-xs py-1 px-3"
                                >
                                  <Edit2 className="h-4 w-4 mr-1" />
                                  Edit
                                </Link>
                                <button
                                  onClick={() => deleteEvent(event._id)}
                                  className="btn-secondary text-xs py-1 px-3 text-error hover:bg-error hover:text-white"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </button>
                              </>
                            )}
                        </RoleGuard>

                        <Link
                          to={`/events/${event._id}`}
                          className="text-primary-500 hover:text-primary-400"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex justify-center items-center">
          <RoleGuard
            allowedRoles={["organizer", "administrator"]}
            fallback={
              <div className="card hover:shadow-lg transition-all w-full">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Read Publications
                </h3>
                <p className="text-dark-500 text-sm mb-4">
                  Stay updated with the latest news and announcements.
                </p>
                <Link
                  to="/publications"
                  className="text-primary-500 hover:text-primary-400 text-sm font-medium flex items-center"
                >
                  View Publications
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            }
          >
            <div className="card hover:shadow-lg transition-all">
              <h3 className="text-lg font-semibold text-white mb-2">
                Create Publication
              </h3>
              <p className="text-dark-500 text-sm mb-4">
                Write updates and announcements for your events.
              </p>
              <Link
                to="/publications"
                className="text-primary-500 hover:text-primary-400 text-sm font-medium flex items-center"
              >
                Go to Publications
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </RoleGuard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
