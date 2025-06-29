import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  Image as ImageIcon,
  Video,
  Upload,
  X,
  Search,
  Plus,
  Trash2,
  Edit2,
  
  MessageSquare,
  List,
} from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

interface MediaItem {
  _id: string;
  type: "image" | "video";
  url: string;
  name: string;
  size: number;
  uploadDate: string;
  tags: string[];
  eventId?: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
}

const MediaManager = () => {
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {}
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editingTag, setEditingTag] = useState<{
    id: string;
    tag: string;
  } | null>(null);
  const [newTag, setNewTag] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch comments for a given media ID
  const fetchComments = async (mediaId: string) => {
    try {
      const { data } = await api.get(`/media/${mediaId}/comments`);
      setComments((prev) => ({ ...prev, [mediaId]: data.comments || [] }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load comments");
    }
  };

  // Add a comment to a given media item
  const addComment = async (mediaId: string, content: string) => {
    if (!content.trim()) return;
    try {
      const { data } = await api.post(`/media/${mediaId}/comment`, {
        content,
        targetType: "Media",
        targetId: mediaId,
      });
      setComments((prev) => ({
        ...prev,
        [mediaId]: [...(prev[mediaId] || []), data],
      }));
      toast.success("Comment added");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add comment");
    }
  };

  // Fetch media items, optionally filtered by tags
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedTags.length > 0) {
          params.append("tags", selectedTags.join(","));
        }
        const { data } = await api.get(`/media?${params}`);
        setMediaItems(data);
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to load media items"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchMedia();
  }, [selectedTags]);

  // Upload files handler
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      try {
        const formData = new FormData();
        acceptedFiles.forEach((file) => {
          formData.append("files", file);
        });
        if (selectedTags.length > 0) {
          formData.append("tags", selectedTags.join(","));
        }
        const { data } = await api.post("/media/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        setMediaItems((prev) => [...data, ...prev]);
        toast.success(`${acceptedFiles.length} files uploaded successfully!`);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to upload files");
      }
    },
    [selectedTags]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
      "video/*": [],
    },
  });

  const allTags = Array.from(new Set(mediaItems.flatMap((item) => item.tags)));

  const filteredItems = mediaItems.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => item.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  // Add tag to selected items
  const addTagToItems = async () => {
    if (newTag.trim() === "" || selectedItems.length === 0) return;
    try {
      const updatedItems = await Promise.all(
        selectedItems.map(async (itemId) => {
          const item = mediaItems.find((m) => m._id === itemId);
          if (!item) return null;
          const updatedTags = [...new Set([...item.tags, newTag])];
          const { data } = await api.put(`/media/${itemId}`, {
            tags: updatedTags,
          });
          return data;
        })
      );
      setMediaItems((prev) =>
        prev.map((item) => {
          const updated = updatedItems.find((u) => u?._id === item._id);
          return updated || item;
        })
      );
      setNewTag("");
      toast.success(`Tag added to ${selectedItems.length} items`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add tag");
    }
  };

  // Remove a tag from an item
  const removeTagFromItem = async (itemId: string, tagToRemove: string) => {
    try {
      const item = mediaItems.find((m) => m._id === itemId);
      if (!item) return;
      const updatedTags = item.tags.filter((tag) => tag !== tagToRemove);
      const { data } = await api.put(`/media/${itemId}`, { tags: updatedTags });
      setMediaItems((prev) =>
        prev.map((item) => (item._id === itemId ? data : item))
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove tag");
    }
  };

  // Update tag text
  const updateTag = async (
    itemId: string,
    oldTag: string,
    newTagValue: string
  ) => {
    if (newTagValue.trim() === "") return;
    try {
      const item = mediaItems.find((m) => m._id === itemId);
      if (!item) return;
      const updatedTags = item.tags.map((tag) =>
        tag === oldTag ? newTagValue : tag
      );
      const { data } = await api.put(`/media/${itemId}`, { tags: updatedTags });
      setMediaItems((prev) =>
        prev.map((item) => (item._id === itemId ? data : item))
      );
      setEditingTag(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update tag");
    }
  };

  // Delete selected items
  const deleteSelectedItems = async () => {
    if (selectedItems.length === 0) return;
    try {
      await Promise.all(
        selectedItems.map((itemId) => api.delete(`/media/${itemId}`))
      );
      setMediaItems((prev) =>
        prev.filter((item) => !selectedItems.includes(item._id))
      );
      setSelectedItems([]);
      toast.success(`${selectedItems.length} items deleted`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete items");
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map((item) => item._id));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <DashboardLayout title="Media Manager">
      <div className="space-y-6">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary-500 bg-dark-200"
              : "border-dark-300 hover:border-primary-500"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-dark-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </h3>
            <p className="text-dark-500 mb-4">
              or <span className="text-primary-500">browse</span> to upload
            </p>
            <p className="text-xs text-dark-500">
              Supports images and videos up to 50MB
            </p>
          </div>
        </div>

        {/* Filter and Controls */}
        <div className="bg-dark-100 p-4 rounded-lg">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex-1 min-w-72">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-500" />
                <input
                  type="text"
                  placeholder="Search by filename or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 input bg-dark-200 h-10 w-full"
                />
                {searchQuery && (
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4 text-dark-500 hover:text-white" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative group">
                
                <div className="absolute right-0 top-full mt-1 bg-dark-100 rounded-md shadow-lg z-10 w-60 py-2 border border-dark-300 hidden group-hover:block">
                  <div className="px-3 py-2">
                    <p className="text-xs text-dark-500 mb-2">
                      Select tags to filter
                    </p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {allTags.map((tag) => (
                        <label
                          key={tag}
                          className="flex items-center p-1 hover:bg-dark-200 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag)}
                            onChange={() => {
                              setSelectedTags((prev) =>
                                prev.includes(tag)
                                  ? prev.filter((t) => t !== tag)
                                  : [...prev, tag]
                              );
                            }}
                            className="mr-2"
                          />
                          <span className="text-dark-600 text-sm">{tag}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

             
            </div>
          </div>

          {/* Active tag filters */}
          {selectedTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <div
                  key={tag}
                  className="bg-dark-200 text-white text-xs py-1 px-2 rounded-full flex items-center"
                >
                  <span>{tag}</span>
                  <button
                    className="ml-1.5 hover:text-primary-500"
                    onClick={() =>
                      setSelectedTags((prev) => prev.filter((t) => t !== tag))
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                className="text-xs text-primary-500 hover:text-primary-400"
                onClick={() => setSelectedTags([])}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Selection Controls */}
        {filteredItems.length > 0 && (
          <div className="bg-dark-100 p-3 rounded-lg flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center">
              <label className="flex items-center mr-4">
                <input
                  type="checkbox"
                  checked={
                    selectedItems.length === filteredItems.length &&
                    filteredItems.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="mr-2"
                />
                <span className="text-sm text-dark-500">
                  {selectedItems.length > 0
                    ? `${selectedItems.length} selected`
                    : "Select all"}
                </span>
              </label>
            </div>

            {selectedItems.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="Add tag to selected"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="input bg-dark-200 h-8 text-sm w-40"
                  />
                  <button
                    onClick={addTagToItems}
                    className="ml-2 p-1.5 bg-primary-500 rounded text-dark"
                    disabled={newTag.trim() === ""}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={deleteSelectedItems}
                  className="btn-secondary text-sm h-8 bg-dark-200 hover:bg-error hover:text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        {/* Media Items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-dark-100 rounded-lg">
            <ImageIcon className="h-12 w-12 text-dark-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No media found
            </h3>
            <p className="text-dark-500">
              {searchQuery || selectedTags.length > 0
                ? "Try changing your search or filters"
                : "Upload media to get started"}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className="bg-dark-100 rounded-lg overflow-hidden flex flex-col transition-transform hover:transform hover:scale-[1.02]"
              >
                <div className="relative">
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item._id)}
                      onChange={() => toggleItemSelection(item._id)}
                      className="h-4 w-4"
                    />
                  </div>

                  <div className="h-40 bg-dark-200 relative">
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Video className="h-12 w-12 text-dark-500" />
                      </div>
                    )}
                    {item.type === "video" && (
                      <div className="absolute bottom-2 right-2 bg-dark bg-opacity-75 rounded px-1.5 py-0.5 text-xs text-white">
                        Video
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 flex flex-col flex-grow">
                  <h4 className="text-white font-semibold truncate">
                    {item.name}
                  </h4>
                  <p className="text-dark-500 text-xs mb-2">
                    {formatFileSize(item.size)} • {formatDate(item.uploadDate)}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags.map((tag) =>
                      editingTag &&
                      editingTag.id === item._id &&
                      editingTag.tag === tag ? (
                        <input
                          key={tag}
                          type="text"
                          autoFocus
                          defaultValue={tag}
                          onBlur={(e) =>
                            updateTag(item._id, tag, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                          className="input input-xs bg-dark-300 text-white px-2 py-1 rounded"
                        />
                      ) : (
                        <span
                          key={tag}
                          className="bg-primary-600 text-dark-900 text-xs px-2 py-0.5 rounded cursor-pointer flex items-center"
                        >
                          {tag}
                          <Edit2
                            className="ml-1 h-3 w-3 text-primary-900 hover:text-primary-700"
                            onClick={() => setEditingTag({ id: item._id, tag })}
                          />
                          <X
                            className="ml-1 h-3 w-3 text-primary-900 hover:text-error cursor-pointer"
                            onClick={() => removeTagFromItem(item._id, tag)}
                          />
                        </span>
                      )
                    )}
                  </div>

                  {/* Comments Section */}
                  <div className="mt-auto pt-2 border-t border-dark-300">
                    <div className="flex items-center mb-2">
                      <MessageSquare className="h-4 w-4 text-dark-500 mr-2" />
                      <span className="text-sm text-dark-500">
                        {comments[item._id]?.length || 0} Comments
                      </span>
                    </div>

                    {Array.isArray(comments[item._id]) && (
                      <div className="max-h-32 overflow-y-auto bg-dark-200 rounded p-2 mb-2 text-xs text-white">
                        {comments[item._id].map((comment) => (
                          <div key={comment._id} className="mb-1">
                            <strong>
                              {comment.user?.name || "Anonymous"}:{" "}
                            </strong>
                            <span>{comment.content}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (
                          !commentDrafts[item._id] ||
                          commentDrafts[item._id].trim() === ""
                        )
                          return;
                        await addComment(item._id, commentDrafts[item._id]);
                        setCommentDrafts((prev) => ({
                          ...prev,
                          [item._id]: "",
                        }));
                      }}
                      className="flex"
                    >
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentDrafts[item._id] || ""}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({
                            ...prev,
                            [item._id]: e.target.value,
                          }))
                        }
                        className="input input-xs flex-grow bg-dark-300 text-white px-2 py-1 rounded-l"
                      />
                      <button
                        type="submit"
                        className="bg-primary-500 hover:bg-primary-600 px-3 rounded-r text-dark font-semibold"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List view (you can expand this part if needed)
          <div>
            {/* List mode implementation here */}
            <p className="text-dark-500 text-center py-8">
              List view coming soon...
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MediaManager;
