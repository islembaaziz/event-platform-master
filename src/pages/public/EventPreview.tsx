import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Share2, Users } from "lucide-react";
import { api } from "../../lib/api";
import toast from "react-hot-toast";

interface SectionSettings {
  backgroundColor?: string;
  textColor?: string;
  layout?: "grid" | "carousel" | "list";
  columns?: number;
}

interface Section {
  id: string;
  type: string;
  title: string;
  content: any;
  settings: SectionSettings;
}

interface Theme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
}

interface Event {
  _id: string;
  title: string;
  date: string; // ISO string
  location: string;
  description: string;
  coverImage: string;
  theme: Theme;
  sections: Section[];
  attendees?: number;
  shares?: number;
  views?: number;
}

const defaultTheme: Theme = {
  primaryColor: "#FFEB3B",
  secondaryColor: "#7E57C2",
  backgroundColor: "#121212",
  textColor: "#FFFFFF",
  fontFamily: "Inter, sans-serif",
};

const EventPreview = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/events/${eventId}`);

        // Defensive: fill missing theme with defaults if needed
        if (!data.theme) data.theme = defaultTheme;
        else data.theme = { ...defaultTheme, ...data.theme };

        // Defensive: make sure sections is an array
        if (!Array.isArray(data.sections)) data.sections = [];

        setEvent(data);

        if (data.sections.length > 0) {
          setActiveSection(data.sections[0].id);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load event");
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
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
          <h1 className="text-2xl font-bold text-white mb-2">Event Not Found</h1>
          <p className="text-dark-500">
            The event you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
        </div>
      </div>
    );
  }

  // Helper to safely format date or show fallback
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "Date not specified";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderSection = (section: Section) => {
    const commonStyles = {
      backgroundColor:
        section.settings.backgroundColor || event.theme.backgroundColor,
      color: section.settings.textColor || event.theme.textColor,
    };

    switch (section.type) {
      case "header":
        return (
          <div style={commonStyles} className="py-20 px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{section.title}</h2>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {section.content?.subtitle || ""}
            </p>
            {section.content?.actionUrl && section.content?.actionText && (
              <a
                href={section.content.actionUrl}
                style={{ backgroundColor: event.theme.primaryColor }}
                className="inline-block px-8 py-3 rounded-full text-dark font-semibold text-lg transition-transform hover:scale-105"
              >
                {section.content.actionText}
              </a>
            )}
          </div>
        );

      case "gallery":
        return (
          <div style={commonStyles} className="py-16 px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">{section.title}</h2>
            <div
              className={`grid gap-4 ${
                section.settings.columns === 2
                  ? "grid-cols-1 md:grid-cols-2"
                  : section.settings.columns === 3
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
              }`}
            >
              {(section.content?.images || []).map(
                (image: string, index: number) => (
                  <div key={index} className="aspect-video rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`Gallery image ${index + 1}`}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                )
              )}
            </div>
          </div>
        );

      case "text":
        return (
          <div style={commonStyles} className="py-16 px-4">
            <div className="max-w-4xl mx-auto">
              <div
                className="prose prose-lg prose-invert"
                dangerouslySetInnerHTML={{ __html: section.content?.text || "" }}
              />
            </div>
          </div>
        );

      case "schedule":
        return (
          <div style={commonStyles} className="py-16 px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">{section.title}</h2>
            <div className="max-w-3xl mx-auto">
              {(section.content?.items || []).map((item: any, index: number) => (
                <div key={index} className="flex items-start space-x-4 mb-8 last:mb-0">
                  <div
                    style={{ backgroundColor: event.theme.primaryColor }}
                    className="flex-shrink-0 w-24 px-3 py-2 rounded-full text-dark font-medium text-center"
                  >
                    {item.time}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{item.title}</h3>
                    <p className="opacity-80">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        backgroundColor: event.theme.backgroundColor,
        color: event.theme.textColor,
        fontFamily: event.theme.fontFamily,
      }}
    >
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[400px]">
        <div className="absolute inset-0">
          <img
            src={event.coverImage || ""}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent" />
        </div>

        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{event.title}</h1>
            <p className="text-xl md:text-2xl opacity-90 mb-6">{event.description}</p>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 mr-2" />
                <span>{formatDate(event.date)}</span>
              </div>

              <div className="flex items-center">
                <MapPin className="h-6 w-6 mr-2" />
                <span>{event.location}</span>
              </div>

              <div className="flex items-center">
                <Users className="h-6 w-6 mr-2" />
                <span>{event.attendees?.toLocaleString() || "0"}+ attending</span>
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
                type="button"
              >
                <Share2 className="h-6 w-6 mr-2" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Event Sections */}
      {event.sections.length === 0 ? (
        <div className="container mx-auto px-4 py-12 text-center text-white">
          No sections available for this event.
        </div>
      ) : (
        event.sections.map((section) => (
          <section key={section.id} className="relative">
            {renderSection(section)}
          </section>
        ))
      )}

      {/* Footer */}
      <footer
        style={{ backgroundColor: event.theme.backgroundColor }}
        className="py-8 px-4 border-t border-dark-300"
      >
        <div className="container mx-auto text-center">
          <p className="text-dark-500">
            &copy; {new Date().getFullYear()} {event.title}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default EventPreview;
