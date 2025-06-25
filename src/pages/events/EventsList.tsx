import { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Heart, 
  MessageSquare, 
  Share2,
  Search,
  Filter
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl: string;
  userId: number;
  isPublished: boolean;
  createdAt: string;
}

const EventsList = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [likedEvents, setLikedEvents] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/events');
      // Filter to show only published events for participants
      const publishedEvents = data.filter((event: Event) => event.isPublished);
      setEvents(publishedEvents);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const likeEvent = async (eventId: number) => {
    try {
      await api.post(`/events/${eventId}/like`);
      setLikedEvents(prev => new Set([...prev, eventId]));
      toast.success('Event liked!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to like event');
    }
  };

  const addComment = async (eventId: number) => {
    const content = prompt('Add a comment:');
    if (!content || content.trim() === '') return;

    try {
      await api.post(`/events/${eventId}/comment`, { content: content.trim() });
      toast.success('Comment added successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Events">
      <div className="space-y-6">
        {/* Search and Filter */}
        <div className="bg-dark-100 p-4 rounded-lg">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-white">Discover Events</h2>
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
              
              <button className="btn-secondary text-sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
            <p className="mt-4 text-dark-500">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-dark-100 rounded-lg">
            <Calendar className="h-12 w-12 text-dark-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No events found</h3>
            <p className="text-dark-500">
              {searchQuery ? 'Try adjusting your search terms' : 'No events are currently available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-dark-100 rounded-lg overflow-hidden hover:transform hover:scale-[1.02] transition-all">
                <div className="aspect-video bg-dark-200 relative">
                  <img 
                    src={event.imageUrl || 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg'} 
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
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                    {event.title}
                  </h3>
                  
                  <p className="text-dark-500 text-sm mb-3 line-clamp-2">
                    {event.description}
                  </p>
                  
                  <div className="flex items-center text-dark-500 text-sm mb-4">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => likeEvent(event.id)}
                        className={`flex items-center text-sm transition-colors ${
                          likedEvents.has(event.id)
                            ? 'text-red-500'
                            : 'text-dark-500 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${likedEvents.has(event.id) ? 'fill-current' : ''}`} />
                        <span>{Math.floor(Math.random() * 50) + 5}</span>
                      </button>
                      
                      <button
                        onClick={() => addComment(event.id)}
                        className="flex items-center text-sm text-dark-500 hover:text-primary-500 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        <span>{Math.floor(Math.random() * 20) + 2}</span>
                      </button>
                      
                      <button className="flex items-center text-sm text-dark-500 hover:text-primary-500 transition-colors">
                        <Share2 className="h-4 w-4 mr-1" />
                        <span>{Math.floor(Math.random() * 10) + 1}</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center text-dark-500 text-sm">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{Math.floor(Math.random() * 100) + 10} attending</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EventsList;