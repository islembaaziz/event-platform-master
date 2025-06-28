import { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Heart, 
  MessageSquare, 
  Share2,
  Search,
  Filter,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Event {
  _id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  createdBy: string;
  likesCount: number;
  commentsCount: number;
  isPublished?: boolean;
  coverImage?: string;
}

const EventsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [formValues, setFormValues] = useState({ title: '', description: '', location: '', date: '' });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/events');
      setEvents(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/events/${eventId}`);
      setEvents(prev => prev.filter(e => e._id !== eventId));
      toast.success('Event deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const openEditModal = (event: Event) => {
    setEditEvent(event);
    setFormValues({
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      date: event.date.slice(0, 10),
    });
  };

  const handleUpdate = async () => {
    if (!editEvent) return;
    try {
      const { data } = await api.put(`/events/${editEvent._id}`, formValues);
      setEvents(prev => prev.map(e => e._id === editEvent._id ? data : e));
      toast.success('Event updated successfully');
      setEditEvent(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update event');
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (event.description?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
    (event.location?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
  );

  return (
    <DashboardLayout title="Events Management">
      <div className="space-y-6">
        <div className="bg-dark-100 p-4 rounded-lg">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-white">Manage Events</h2>
              <span className="text-dark-500 text-sm">({events.length} events)</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-500" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 input bg-dark-200 h-9 text-sm w-64"
                />
              </div>

              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/dashboard/events/create')}
                  className="btn-primary text-sm"
                >
                  + Add Event
                </button>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
            <p className="mt-4 text-dark-500">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-dark-100 rounded-lg">
            <Calendar className="h-12 w-12 text-dark-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No events found</h3>
            <p className="text-dark-500">Try changing search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <div key={event._id} className="bg-dark-100 rounded-lg overflow-hidden">
                <div className="aspect-video bg-dark-200 relative">
                  <img 
                    src={event.coverImage || 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg'}
                    alt={event.title} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-3 right-3">
                    <span className="bg-primary-500 text-dark text-xs px-2 py-1 rounded-full font-medium">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{event.title}</h3>
                  <p className="text-dark-500 text-sm mb-2 line-clamp-2">{event.description}</p>
                  <div className="flex items-center text-dark-500 text-sm mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{event.location}</span>
                  </div>

                  <div className="flex justify-between items-center text-dark-500 text-sm">
                    <div className="flex space-x-4">
                      <span className="flex items-center"><Heart className="h-4 w-4 mr-1" />{event.likesCount}</span>
                      <span className="flex items-center"><MessageSquare className="h-4 w-4 mr-1" />{event.commentsCount}</span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={() => openEditModal(event)}
                      className="btn-secondary text-sm flex items-center"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event._id)}
                      className="btn-error text-sm flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-100 p-6 rounded-lg w-full max-w-md space-y-4 relative">
            <button onClick={() => setEditEvent(null)} className="absolute top-3 right-3 text-dark-500 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-white">Edit Event</h2>
            <input
              className="input bg-dark-200 w-full"
              placeholder="Title"
              value={formValues.title}
              onChange={(e) => setFormValues(prev => ({ ...prev, title: e.target.value }))}
            />
            <textarea
              className="input bg-dark-200 w-full h-24"
              placeholder="Description"
              value={formValues.description}
              onChange={(e) => setFormValues(prev => ({ ...prev, description: e.target.value }))}
            />
            <input
              className="input bg-dark-200 w-full"
              placeholder="Location"
              value={formValues.location}
              onChange={(e) => setFormValues(prev => ({ ...prev, location: e.target.value }))}
            />
            <input
              type="date"
              className="input bg-dark-200 w-full"
              value={formValues.date}
              onChange={(e) => setFormValues(prev => ({ ...prev, date: e.target.value }))}
            />
            <div className="flex justify-end">
              <button onClick={handleUpdate} className="btn-primary">Update</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EventsList;