import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, MapPin, Share2, Users } from "lucide-react";
import { api } from "../../lib/api";
import toast from "react-hot-toast";

interface Event {
  _id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  coverImage: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
  };
  attendees?: number;
}

const EventPreview = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data } = await api.get<Event>(`/events/${eventId}`);
        console.log("Fetched event data:", data);
        if (!data) {
          toast.error("Missing event theme data.");
          return navigate("/dashboard");
        }
        setEvent(data);
      } catch (error) {
        console.error("Error fetching event:", error);
        toast.error("Failed to load event");
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) fetchEvent();
  }, [eventId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
          <p className="mt-4 text-dark-600 font-medium">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Event Not Found
          </h1>
          <p className="text-dark-500">
            The event you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: event.theme?.backgroundColor || "#000000",
        color: event.theme?.textColor || "#FFFFFF",
        fontFamily: event.theme?.fontFamily || "sans-serif",
      }}
    >
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[400px]">
        <div className="absolute inset-0">
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent" />
        </div>

        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {event.title}
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-6">
              {event.description}
            </p>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 mr-2" />
                <span>
                  {new Date(event.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center">
                <MapPin className="h-6 w-6 mr-2" />
                <span>{event.location}</span>
              </div>

              <div className="flex items-center">
                <Users className="h-6 w-6 mr-2" />
                <span>
                  {event.attendees?.toLocaleString() || "0"} attending
                </span>
              </div>

              <button
                className="flex items-center hover:text-primary-500 transition-colors"
                onClick={() => {
                  if (navigator.share) {
                    navigator
                      .share({
                        title: event.title,
                        text: event.description,
                        url: window.location.href,
                      })
                      .catch(() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Link copied to clipboard!");
                      });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard!");
                  }
                }}
              >
                <Share2 className="h-6 w-6 mr-2" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: event.theme?.backgroundColor || "#000000",
        }}
        className="py-8 px-4 border-t border-dark-300"
      >
        <div className="container mx-auto text-center">
          <p className="text-dark-500">
            &copy; {new Date().getFullYear()} {event.title}. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default EventPreview;
