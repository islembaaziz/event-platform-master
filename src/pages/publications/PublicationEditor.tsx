import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, ArrowLeft, Calendar, Globe, Lock } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";
import toast from "react-hot-toast";

interface Event {
  _doc: {
    _id: string;
    title: string;
  };
}

interface Publication {
  title: string;
  content: string;
  status: "draft" | "published";
  eventId: string;
  publishDate: string | null;
}

const PublicationEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [initialContent, setInitialContent] = useState("");

  const [publication, setPublication] = useState<Publication>({
    title: "",
    content: "",
    status: "draft",
    eventId: "",
    publishDate: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsResponse, publicationResponse] = await Promise.all([
          api.get("/events"),
          isEditing ? api.get(`/publications/${id}`) : Promise.resolve(null),
        ]);

        setEvents(eventsResponse.data);

        if (publicationResponse) {
          const pub = publicationResponse.data;
          setInitialContent(pub.content);
          setPublication({
            title: pub.title,
            content: pub.content,
            status: pub.status,
            eventId: pub.eventId._id,
            publishDate: pub.publishDate,
          });
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load data");
        navigate("/publications");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isEditing, navigate]);

  const handleSubmit = async () => {
    if (!publication.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!publication.eventId) {
      toast.error("Please select an event");
      return;
    }

    try {
      setIsSaving(true);

      if (isEditing) {
        await api.put(`/publications/${id}`, publication);
      } else {
        await api.post("/publications", publication);
      }

      toast.success(
        `Publication ${isEditing ? "updated" : "created"} successfully`
      );
      navigate("/publications");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} publication`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditorChange = (content: string) => {
    setPublication((prev) => ({
      ...prev,
      content: content || initialContent,
    }));
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Publication Editor">
        <div className="flex items-center justify-center h-96">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
          <p className="ml-4 text-dark-500">Loading publication data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Publication Editor">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-dark-100 p-4 rounded-lg">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/publications")}
                className="btn-ghost"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
              <h2 className="text-lg font-semibold text-white">
                {isEditing ? "Edit Publication" : "New Publication"}
              </h2>
            </div>

            <div className="flex gap-3">
              <select
                value={publication.status}
                onChange={(e) =>
                  setPublication({
                    ...publication,
                    status: e.target.value as "draft" | "published",
                  })
                }
                className="input bg-dark-200 h-9 text-sm"
              >
                <option value="draft">Save as Draft</option>
                <option value="published">Publish Now</option>
              </select>

              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="btn-primary"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 mr-2 rounded-full border-2 border-dark border-r-transparent animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-dark-100 p-4 rounded-lg">
              <label className="label">Title</label>
              <input
                type="text"
                value={publication.title}
                onChange={(e) =>
                  setPublication({ ...publication, title: e.target.value })
                }
                placeholder="Enter publication title"
                className="input mb-4"
              />

              <label className="label">Content</label>
              <ReactQuill
                value={publication.content || initialContent}
                onChange={handleEditorChange}
                className="bg-dark-200 rounded-lg text-white"
                theme="snow"
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link", "image"],
                    ["clean"],
                  ],
                }}
                preserveWhitespace
              />
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            <div className="bg-dark-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">
                Publication Settings
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="label">Event</label>
                  <select
                    value={publication.eventId}
                    onChange={(e) =>
                      setPublication({
                        ...publication,
                        eventId: e.target.value,
                      })
                    }
                    className="input"
                  >
                    <option value="">Select an event</option>
                    {events.map((event) => {
                      const id = event._doc?._id || event._id;
                      const title = event._doc?.title || event.title;

                      return (
                        <option key={id} value={id}>
                          {title}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="label">Status</label>
                  <div className="space-y-2">
                    <label className="flex items-center p-2 rounded hover:bg-dark-200 cursor-pointer">
                      <input
                        type="radio"
                        checked={publication.status === "draft"}
                        onChange={() =>
                          setPublication({ ...publication, status: "draft" })
                        }
                        className="mr-2"
                      />
                      <Lock className="h-4 w-4 mr-2 text-warning" />
                      <div>
                        <p className="font-medium text-white">Draft</p>
                        <p className="text-sm text-dark-500">
                          Only visible to you
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center p-2 rounded hover:bg-dark-200 cursor-pointer">
                      <input
                        type="radio"
                        checked={publication.status === "published"}
                        onChange={() =>
                          setPublication({
                            ...publication,
                            status: "published",
                          })
                        }
                        className="mr-2"
                      />
                      <Globe className="h-4 w-4 mr-2 text-success" />
                      <div>
                        <p className="font-medium text-white">Published</p>
                        <p className="text-sm text-dark-500">
                          Visible to everyone
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {publication.status === "published" && (
                  <div>
                    <label className="label">Publish Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-500" />
                      <input
                        type="datetime-local"
                        value={
                          publication.publishDate ||
                          new Date().toISOString().slice(0, 16)
                        }
                        onChange={(e) =>
                          setPublication({
                            ...publication,
                            publishDate: e.target.value,
                          })
                        }
                        className="pl-10 input"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-dark-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
              <div className="aspect-video bg-dark-200 rounded-lg flex items-center justify-center">
                <p className="text-dark-500">Preview will be available soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PublicationEditor;
