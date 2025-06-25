import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, MapPin, Share2, Users } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface Section {
  id: string;
  type: string;
  title: string;
  content: any;
  settings: {
    backgroundColor?: string;
    textColor?: string;
    layout?: 'grid' | 'carousel' | 'list';
    columns?: number;
  };
}

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
  sections: Section[];
}

const EventPreview = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        // In a real app, this would be an API call
        // const { data } = await api.get(`/events/${eventId}`);
        
        // Mock data
        const mockEvent: Event = {
          _id: eventId || '1',
          title: 'Summer Music Festival',
          date: '2025-07-15',
          location: 'Central Park, New York',
          description: 'Join us for a weekend of amazing music, food, and fun!',
          coverImage: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
          theme: {
            primaryColor: '#FFEB3B',
            secondaryColor: '#7E57C2',
            backgroundColor: '#121212',
            textColor: '#FFFFFF',
            fontFamily: 'Inter, sans-serif',
          },
          sections: [
            {
              id: '1',
              type: 'header',
              title: 'Event Header',
              content: {
                subtitle: 'Join us for an amazing experience',
                actionText: 'Register Now',
                actionUrl: '#register'
              },
              settings: {
                backgroundColor: '#1a1a1a',
                textColor: '#ffffff'
              }
            },
            {
              id: '2',
              type: 'gallery',
              title: 'Event Photos',
              content: {
                images: [
                  'https://images.pexels.com/photos/2263436/pexels-photo-2263436.jpeg',
                  'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg',
                  'https://images.pexels.com/photos/1154189/pexels-photo-1154189.jpeg',
                  'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg',
                  'https://images.pexels.com/photos/2034851/pexels-photo-2034851.jpeg',
                  'https://images.pexels.com/photos/2417726/pexels-photo-2417726.jpeg'
                ]
              },
              settings: {
                layout: 'grid',
                columns: 3,
                backgroundColor: '#121212'
              }
            },
            {
              id: '3',
              type: 'text',
              title: 'About The Event',
              content: {
                text: '<h2>About The Event</h2><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc sit amet aliquam lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Sed euismod, nunc sit amet aliquam lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc sit amet aliquam lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.</p>'
              },
              settings: {
                backgroundColor: '#1a1a1a',
                textColor: '#ffffff'
              }
            },
            {
              id: '4',
              type: 'schedule',
              title: 'Event Schedule',
              content: {
                items: [
                  { time: '10:00 AM', title: 'Opening Ceremony', description: 'Welcome speech and introduction' },
                  { time: '11:30 AM', title: 'First Performance', description: 'Live band performance' },
                  { time: '01:00 PM', title: 'Lunch Break', description: 'Food and refreshments' },
                  { time: '02:30 PM', title: 'Workshop', description: 'Interactive session with artists' },
                  { time: '04:00 PM', title: 'Main Event', description: 'Headline performance' },
                  { time: '06:30 PM', title: 'Closing', description: 'Farewell and networking' }
                ]
              },
              settings: {
                layout: 'list',
                backgroundColor: '#121212',
                textColor: '#ffffff'
              }
            }
          ]
        };
        
        setEvent(mockEvent);
      } catch (error) {
        toast.error('Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

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
          <p className="text-dark-500">The event you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const renderSection = (section: Section) => {
    const commonStyles = {
      backgroundColor: section.settings.backgroundColor || event.theme.backgroundColor,
      color: section.settings.textColor || event.theme.textColor,
    };

    switch (section.type) {
      case 'header':
        return (
          <div 
            style={commonStyles}
            className="py-20 px-4 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{section.title}</h2>
            <p className="text-xl md:text-2xl mb-8 opacity-90">{section.content.subtitle}</p>
            <a 
              href={section.content.actionUrl}
              style={{ backgroundColor: event.theme.primaryColor }}
              className="inline-block px-8 py-3 rounded-full text-dark font-semibold text-lg transition-transform hover:scale-105"
            >
              {section.content.actionText}
            </a>
          </div>
        );

      case 'gallery':
        return (
          <div style={commonStyles} className="py-16 px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">{section.title}</h2>
            <div 
              className={`grid gap-4 ${
                section.settings.columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
                section.settings.columns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
              }`}
            >
              {section.content.images.map((image: string, index: number) => (
                <div key={index} className="aspect-video rounded-lg overflow-hidden">
                  <img 
                    src={image} 
                    alt={`Gallery image ${index + 1}`} 
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'text':
        return (
          <div style={commonStyles} className="py-16 px-4">
            <div className="max-w-4xl mx-auto">
              <div 
                className="prose prose-lg prose-invert"
                dangerouslySetInnerHTML={{ __html: section.content.text }}
              />
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div style={commonStyles} className="py-16 px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">{section.title}</h2>
            <div className="max-w-3xl mx-auto">
              {section.content.items.map((item: any, index: number) => (
                <div 
                  key={index}
                  className="flex items-start space-x-4 mb-8 last:mb-0"
                >
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
        fontFamily: event.theme.fontFamily
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
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{event.title}</h1>
            <p className="text-xl md:text-2xl opacity-90 mb-6">{event.description}</p>
            
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 mr-2" />
                <span>{new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              
              <div className="flex items-center">
                <MapPin className="h-6 w-6 mr-2" />
                <span>{event.location}</span>
              </div>
              
              <div className="flex items-center">
                <Users className="h-6 w-6 mr-2" />
                <span>1,250+ attending</span>
              </div>
              
              <button 
                className="flex items-center hover:text-primary-500 transition-colors"
                onClick={() => {
                  navigator.share?.({
                    title: event.title,
                    text: event.description,
                    url: window.location.href
                  }).catch(() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied to clipboard!');
                  });
                }}
              >
                <Share2 className="h-6 w-6 mr-2" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Event Sections */}
      {event.sections.map((section) => (
        <section key={section.id} className="relative">
          {renderSection(section)}
        </section>
      ))}
      
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