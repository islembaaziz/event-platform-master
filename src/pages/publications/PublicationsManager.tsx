import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Filter,
  Search,
  Calendar,
  Edit2,
  Trash2,
  MessageSquare,
  Eye,
  Share2
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface Publication {
  _id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  eventId: {
    _id: string;
    title: string;
  };
  publishDate: string | null;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  comments: Array<{
    _id: string;
    content: string;
    user: string;
    date: string;
    approved: boolean;
  }>;
  likes: number;
  shares: number;
}

const PublicationsManager = () => {
  const navigate = useNavigate();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        
        const { data } = await api.get(`/publications?${params}`);
        setPublications(data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load publications');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublications();
  }, [statusFilter]);

  const deletePublication = async (id: string) => {
    try {
      await api.delete(`/publications/${id}`);
      setPublications(prev => prev.filter(pub => pub._id !== id));
      toast.success('Publication deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete publication');
    }
  };

  const approveComment = async (publicationId: string, commentId: string) => {
    try {
      await api.put(`/publications/${publicationId}/comments/${commentId}`, {
        approved: true
      });

      setPublications(prev => prev.map(pub => {
        if (pub._id === publicationId) {
          return {
            ...pub,
            comments: pub.comments.map(comment =>
              comment._id === commentId ? { ...comment, approved: true } : comment
            )
          };
        }
        return pub;
      }));

      toast.success('Comment approved');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve comment');
    }
  };

  const filteredPublications = publications.filter(pub =>
    pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pub.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Publications">
      <div className="space-y-6">
        {/* Header with controls */}
        <div className="bg-dark-100 p-4 rounded-lg">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-white">Publications</h2>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-500" />
                <input
                  type="text"
                  placeholder="Search publications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 input bg-dark-200 h-9 text-sm w-64"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'published')}
                className="input bg-dark-200 h-9 text-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Drafts</option>
                <option value="published">Published</option>
              </select>
              
              <button
                onClick={() => navigate('/publications/new')}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Publication
              </button>
            </div>
          </div>
        </div>

        {/* Publications List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
            <p className="mt-4 text-dark-500">Loading publications...</p>
          </div>
        ) : filteredPublications.length === 0 ? (
          <div className="text-center py-12 bg-dark-100 rounded-lg">
            <FileText className="h-12 w-12 text-dark-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No publications found</h3>
            <p className="text-dark-500 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try changing your search or filters'
                : 'Create your first publication to get started'}
            </p>
            <button
              onClick={() => navigate('/publications/new')}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Publication
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPublications.map((publication) => (
              <div
                key={publication._id}
                className="bg-dark-100 rounded-lg p-4 hover:bg-dark-200 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {publication.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        publication.status === 'published'
                          ? 'bg-success/20 text-success'
                          : 'bg-warning/20 text-warning'
                      }`}>
                        {publication.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-dark-500">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {publication.publishDate
                          ? new Date(publication.publishDate).toLocaleDateString()
                          : 'Not published'}
                      </span>
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {publication.likes} views
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {publication.comments.length} comments
                      </span>
                      <span className="flex items-center">
                        <Share2 className="h-4 w-4 mr-1" />
                        {publication.shares} shares
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/publications/edit/${publication._id}`)}
                      className="btn-secondary text-sm"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => deletePublication(publication._id)}
                      className="btn-secondary text-sm text-error hover:bg-error hover:text-white"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                {publication.comments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dark-300">
                    <h4 className="text-sm font-medium text-white mb-2">Recent Comments</h4>
                    <div className="space-y-2">
                      {publication.comments.slice(0, 3).map((comment) => (
                        <div
                          key={comment._id}
                          className="flex items-start justify-between bg-dark-200 rounded p-2"
                        >
                          <div>
                            <p className="text-sm text-white">{comment.content}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-dark-500">{comment.user}</span>
                              <span className="text-xs text-dark-500">
                                {new Date(comment.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {!comment.approved && (
                            <button
                              onClick={() => approveComment(publication._id, comment._id)}
                              className="text-xs text-primary-500 hover:text-primary-400"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PublicationsManager;