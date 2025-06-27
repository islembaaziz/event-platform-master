import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  Layout,
  Image as ImageIcon,
  Type,
  PanelLeft,
  PanelRight,
  EyeIcon,
  Trash2,
  Plus,
  MoveVertical,
  Palette,
  Calendar,
  Video
} from 'lucide-react';
import toast from 'react-hot-toast';
import { HexColorPicker } from 'react-colorful';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';

// Section types
type SectionType = 'header' | 'gallery' | 'text' | 'video' | 'testimonial' | 'schedule';

interface Section {
  id: string;
  type: SectionType;
  title: string;
  content: any;
  settings: {
    layout?: 'grid' | 'carousel' | 'list';
    columns?: number;
    backgroundColor?: string;
    textColor?: string;
  };
}

interface EventData {
  _id?: string;
  title: string;
  date: string;
  location: string;
  description: string;
  coverImage: string;
  sections: Section[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
  };
}

const EventEditor = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const isNewEvent = eventId === 'new';
  
  const [eventData, setEventData] = useState<EventData>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    description: '',
    coverImage: 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg',
    sections: [],
    theme: {
      primaryColor: '#FFEB3B',
      secondaryColor: '#7E57C2',
      backgroundColor: '#121212',
      textColor: '#FFFFFF',
      fontFamily: 'Inter, sans-serif',
    }
  });
  
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sections' | 'theme'>('sections');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!isNewEvent);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isNewEvent) {
      const fetchEvent = async () => {
       
        try {
          const { data } = await api.get(`/events/${eventId}`);
          setEventData(data);
          if (data.sections.length > 0) {
            setActiveSection(data.sections[0].id);
          }
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Failed to load event');
          navigate('/dashboard');
        } finally {
          setIsLoading(false);
        }
      };

      fetchEvent();
    }
  }, [eventId, isNewEvent, navigate]);

  const addSection = (type: SectionType) => {
    const newSection: Section = {
      id: Date.now().toString(),
      type,
      title: getDefaultTitle(type),
      content: getDefaultContent(type),
      settings: getDefaultSettings(type)
    };
    
    setEventData({
      ...eventData,
      sections: [...eventData.sections, newSection]
    });
    
    setActiveSection(newSection.id);
  };

  const removeSection = (id: string) => {
    const updatedSections = eventData.sections.filter(section => section.id !== id);
    setEventData({
      ...eventData,
      sections: updatedSections
    });
    
    if (activeSection === id) {
      setActiveSection(updatedSections.length > 0 ? updatedSections[0].id : null);
    }
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const sectionIndex = eventData.sections.findIndex(section => section.id === id);
    if (
      (direction === 'up' && sectionIndex === 0) || 
      (direction === 'down' && sectionIndex === eventData.sections.length - 1)
    ) {
      return;
    }
    
    const updatedSections = [...eventData.sections];
    const newIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
    
    [updatedSections[sectionIndex], updatedSections[newIndex]] = 
    [updatedSections[newIndex], updatedSections[sectionIndex]];
    
    setEventData({
      ...eventData,
      sections: updatedSections
    });
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    setEventData({
      ...eventData,
      sections: eventData.sections.map(section => 
        section.id === id ? { ...section, ...updates } : section
      )
    });
  };

  const saveEvent = async () => {
    if (!eventData.title.trim()) {
      toast.error('Event title is required');
      return;
    }
    
    try {
      setIsSaving(true);
      
      const { data } = isNewEvent 
        ? await api.post('/events', eventData)
        : await api.put(`/events/${eventId}`, eventData);
      
      toast.success(`Event ${isNewEvent ? 'created' : 'updated'} successfully!`);
      
      if (isNewEvent) {
        navigate(`/editor/${data._id}`, { replace: true });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${isNewEvent ? 'create' : 'update'} event`);
    } finally {
      setIsSaving(false);
    }
  };

  const getDefaultTitle = (type: SectionType): string => {
    switch (type) {
      case 'header': return 'Event Header';
      case 'gallery': return 'Photo Gallery';
      case 'text': return 'Text Section';
      case 'video': return 'Video Section';
      case 'testimonial': return 'Testimonials';
      case 'schedule': return 'Event Schedule';
    }
  };

  const getDefaultContent = (type: SectionType): any => {
    switch (type) {
      case 'header':
        return {
          subtitle: 'Join us for an amazing experience',
          actionText: 'Register Now',
          actionUrl: '#register'
        };
      case 'gallery':
        return {
          images: []
        };
      case 'text':
        return {
          text: '<p>Enter your content here...</p>'
        };
      case 'video':
        return {
          videoUrl: '',
          title: 'Video Title'
        };
      case 'testimonial':
        return {
          items: []
        };
      case 'schedule':
        return {
          items: []
        };
    }
  };

  const getDefaultSettings = (type: SectionType): Section['settings'] => {
    switch (type) {
      case 'gallery':
        return {
          layout: 'grid',
          columns: 3,
          backgroundColor: eventData.theme.backgroundColor
        };
      case 'testimonial':
      case 'schedule':
        return {
          layout: 'list',
          backgroundColor: eventData.theme.backgroundColor,
          textColor: eventData.theme.textColor
        };
      default:
        return {
          backgroundColor: eventData.theme.backgroundColor,
          textColor: eventData.theme.textColor
        };
    }
  };

  const handleColorChange = (color: string, colorType: string) => {
    if (colorType.startsWith('theme.')) {
      const property = colorType.split('.')[1] as keyof typeof eventData.theme;
      setEventData({
        ...eventData,
        theme: {
          ...eventData.theme,
          [property]: color
        }
      });
    } else if (activeSection) {
      const section = eventData.sections.find(s => s.id === activeSection);
      if (section) {
        updateSection(activeSection, {
          settings: {
            ...section.settings,
            [colorType]: color
          }
        });
      }
    }
  };

  const activeSectionData = activeSection 
    ? eventData.sections.find(section => section.id === activeSection)
    : null;

  if (isLoading) {
    return (
      <DashboardLayout title="Event Editor">
        <div className="flex items-center justify-center h-96">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
          <p className="ml-4 text-dark-500">Loading event data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Event Editor">
      <div className="flex flex-col space-y-4">
        {/* Top Bar with Save */}
        <div className="flex justify-between items-center bg-dark-100 p-4 rounded-lg">
          <div>
            <h2 className="text-xl font-bold text-white">{isNewEvent ? 'Create New Event' : 'Edit Event'}</h2>
            <p className="text-dark-500 text-sm">Customize your event page</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/events/${eventId || 'preview'}`)}
              className="btn-secondary"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Preview
            </button>
            <button
              onClick={saveEvent}
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? (
                <div className="h-4 w-4 mr-2 rounded-full border-2 border-dark border-r-transparent animate-spin"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* Event Details */}
          <div className="bg-dark-100 p-4 rounded-lg w-full lg:w-8/12">
            <h3 className="text-lg font-semibold text-white mb-4">Event Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="label">Event Title</label>
                <input
                  type="text"
                  value={eventData.title}
                  onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                  className="input"
                  placeholder="Enter event title"
                />
              </div>
              
              <div>
                <label className="label">Event Date</label>
                <input
                  type="date"
                  value={eventData.date}
                  onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                  className="input"
                />
              </div>
              
              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  value={eventData.location}
                  onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                  className="input"
                  placeholder="Enter event location"
                />
              </div>
              
              <div>
                <label className="label">Cover Image URL</label>
                <input
                  type="text"
                  value={eventData.coverImage}
                  onChange={(e) => setEventData({ ...eventData, coverImage: e.target.value })}
                  className="input"
                  placeholder="Enter image URL"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="label">Description</label>
              <textarea
                value={eventData.description}
                onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                className="input min-h-24"
                placeholder="Enter event description"
                rows={3}
              />
            </div>
            
            {/* Cover Image Preview */}
            {eventData.coverImage && (
              <div className="mb-6">
                <label className="label">Cover Image Preview</label>
                <div className="h-40 rounded-md overflow-hidden">
                  <img
                    src={eventData.coverImage}
                    alt="Event cover"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            
            {/* Sections */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Page Sections</h3>
                <div className="relative">
                  <button className="btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-dark-100 rounded-md shadow-lg z-10 w-48 py-2 border border-dark-300 hidden group-hover:block">
                    {['header', 'gallery', 'text', 'video', 'testimonial', 'schedule'].map((type) => (
                      <button
                        key={type}
                        onClick={() => addSection(type as SectionType)}
                        className="block w-full text-left px-4 py-2 text-dark-600 hover:bg-dark-200 hover:text-white"
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {eventData.sections.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-dark-300 rounded-md">
                  <Layout className="h-12 w-12 text-dark-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">No Sections Added</h4>
                  <p className="text-dark-500 mb-6">
                    Add sections to build your event page layout
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['header', 'gallery', 'text', 'schedule'].map((type) => (
                      <button
                        key={type}
                        onClick={() => addSection(type as SectionType)}
                        className="btn-secondary text-sm"
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventData.sections.map((section) => (
                    <div 
                      key={section.id}
                      className={`flex items-center p-3 rounded-md cursor-pointer ${
                        activeSection === section.id ? 'bg-dark-200 border-l-4 border-primary-500' : 'bg-dark-200/50 hover:bg-dark-200'
                      }`}
                      onClick={() => setActiveSection(section.id)}
                    >
                      {getSectionIcon(section.type)}
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{section.title}</p>
                        <p className="text-dark-500 text-xs">{section.type.charAt(0).toUpperCase() + section.type.slice(1)}</p>
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          className="p-1 rounded hover:bg-dark-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(section.id, 'up');
                          }}
                        >
                          <MoveVertical className="h-4 w-4 text-dark-500" />
                        </button>
                        <button 
                          className="p-1 rounded hover:bg-dark-300 hover:text-error"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSection(section.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-dark-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar Properties */}
          <div className="bg-dark-100 p-4 rounded-lg w-full lg:w-4/12">
            <div className="flex border-b border-dark-300 mb-4">
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'sections' 
                    ? 'text-primary-500 border-b-2 border-primary-500' 
                    : 'text-dark-500 hover:text-white'
                }`}
                onClick={() => setActiveTab('sections')}
              >
                Section Properties
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'theme' 
                    ? 'text-primary-500 border-b-2 border-primary-500' 
                    : 'text-dark-500 hover:text-white'
                }`}
                onClick={() => setActiveTab('theme')}
              >
                Theme Settings
              </button>
            </div>
            
            {activeTab === 'sections' ? (
              activeSectionData ? (
                <div className="space-y-4">
                  <div>
                    <label className="label">Section Title</label>
                    <input
                      type="text"
                      value={activeSectionData.title}
                      onChange={(e) => updateSection(activeSectionData.id, { title: e.target.value })}
                      className="input"
                    />
                  </div>
                  
                  {activeSectionData.type === 'gallery' && (
                    <div>
                      <label className="label">Layout</label>
                      <select
                        value={activeSectionData.settings.layout || 'grid'}
                        onChange={(e) => updateSection(activeSectionData.id, { 
                          settings: { ...activeSectionData.settings, layout: e.target.value as any }
                        })}
                        className="input"
                      >
                        <option value="grid">Grid</option>
                        <option value="carousel">Carousel</option>
                      </select>
                    </div>
                  )}
                  
                  {(activeSectionData.settings.layout === 'grid' && activeSectionData.type === 'gallery') && (
                    <div>
                      <label className="label">Columns</label>
                      <select
                        value={activeSectionData.settings.columns || 3}
                        onChange={(e) => updateSection(activeSectionData.id, { 
                          settings: { ...activeSectionData.settings, columns: parseInt(e.target.value) }
                        })}
                        className="input"
                      >
                        <option value={1}>1 Column</option>
                        <option value={2}>2 Columns</option>
                        <option value={3}>3 Columns</option>
                        <option value={4}>4 Columns</option>
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="label">Background Color</label>
                    <div className="relative">
                      <div 
                        className="h-10 rounded-md border border-dark-300 flex items-center cursor-pointer px-3"
                        onClick={() => setIsColorPickerOpen(isColorPickerOpen === 'backgroundColor' ? null : 'backgroundColor')}
                      >
                        <div 
                          className="h-6 w-6 rounded-sm mr-2"
                          style={{ backgroundColor: activeSectionData.settings.backgroundColor || '#121212' }}
                        />
                        <span className="text-dark-500">
                          {activeSectionData.settings.backgroundColor || '#121212'}
                        </span>
                      </div>
                      
                      {isColorPickerOpen === 'backgroundColor' && (
                        <div className="absolute left-0 top-full mt-2 z-10">
                          <HexColorPicker 
                            color={activeSectionData.settings.backgroundColor || '#121212'} 
                            onChange={(color) => handleColorChange(color, 'backgroundColor')}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="label">Text Color</label>
                    <div className="relative">
                      <div 
                        className="h-10 rounded-md border border-dark-300 flex items-center cursor-pointer px-3"
                        onClick={() => setIsColorPickerOpen(isColorPickerOpen === 'textColor' ? null : 'textColor')}
                      >
                        <div 
                          className="h-6 w-6 rounded-sm mr-2"
                          style={{ backgroundColor: activeSectionData.settings.textColor || '#FFFFFF' }}
                        />
                        <span className="text-dark-500">
                          {activeSectionData.settings.textColor || '#FFFFFF'}
                        </span>
                      </div>
                      
                      {isColorPickerOpen === 'textColor' && (
                        <div className="absolute left-0 top-full mt-2 z-10">
                          <HexColorPicker 
                            color={activeSectionData.settings.textColor || '#FFFFFF'} 
                            onChange={(color) => handleColorChange(color, 'textColor')}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Content type-specific controls would go here */}
                  {activeSectionData.type === 'text' && (
                    <div>
                      <label className="label">Content</label>
                      <textarea
                        value={activeSectionData.content.text}
                        onChange={(e) => updateSection(activeSectionData.id, { 
                          content: { ...activeSectionData.content, text: e.target.value }
                        })}
                        className="input min-h-32"
                        rows={6}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Layout className="h-12 w-12 text-dark-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">No Section Selected</h4>
                  <p className="text-dark-500">
                    Select or add a section to edit its properties
                  </p>
                </div>
              )
            ) : (
              // Theme Settings Tab
              <div className="space-y-4">
                <div>
                  <label className="label">Primary Color</label>
                  <div className="relative">
                    <div 
                      className="h-10 rounded-md border border-dark-300 flex items-center cursor-pointer px-3"
                      onClick={() => setIsColorPickerOpen(isColorPickerOpen === 'theme.primaryColor' ? null : 'theme.primaryColor')}
                    >
                      <div 
                        className="h-6 w-6 rounded-sm mr-2"
                        style={{ backgroundColor: eventData.theme.primaryColor }}
                      />
                      <span className="text-dark-500">{eventData.theme.primaryColor}</span>
                    </div>
                    
                    {isColorPickerOpen === 'theme.primaryColor' && (
                      <div className="absolute left-0 top-full mt-2 z-10">
                        <HexColorPicker 
                          color={eventData.theme.primaryColor} 
                          onChange={(color) => handleColorChange(color, 'theme.primaryColor')}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="label">Secondary Color</label>
                  <div className="relative">
                    <div 
                      className="h-10 rounded-md border border-dark-300 flex items-center cursor-pointer px-3"
                      onClick={() => setIsColorPickerOpen(isColorPickerOpen === 'theme.secondaryColor' ? null : 'theme.secondaryColor')}
                    >
                      <div 
                        className="h-6 w-6 rounded-sm mr-2"
                        style={{ backgroundColor: eventData.theme.secondaryColor }}
                      />
                      <span className="text-dark-500">{eventData.theme.secondaryColor}</span>
                    </div>
                    
                    {isColorPickerOpen === 'theme.secondaryColor' && (
                      <div className="absolute left-0 top-full mt-2 z-10">
                        <HexColorPicker 
                          color={eventData.theme.secondaryColor} 
                          onChange={(color) => handleColorChange(color, 'theme.secondaryColor')}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="label">Background Color</label>
                  <div className="relative">
                    <div 
                      className="h-10 rounded-md border border-dark-300 flex items-center cursor-pointer px-3"
                      onClick={() => setIsColorPickerOpen(isColorPickerOpen === 'theme.backgroundColor' ? null : 'theme.backgroundColor')}
                    >
                      <div 
                        className="h-6 w-6 rounded-sm mr-2"
                        style={{ backgroundColor: eventData.theme.backgroundColor }}
                      />
                      <span className="text-dark-500">{eventData.theme.backgroundColor}</span>
                    </div>
                    
                    {isColorPickerOpen === 'theme.backgroundColor' && (
                      <div className="absolute left-0 top-full mt-2 z-10">
                        <HexColorPicker 
                          color={eventData.theme.backgroundColor} 
                          onChange={(color) => handleColorChange(color, 'theme.backgroundColor')}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="label">Text Color</label>
                  <div className="relative">
                    <div 
                      className="h-10 rounded-md border border-dark-300 flex items-center cursor-pointer px-3"
                      onClick={() => setIsColorPickerOpen(isColorPickerOpen === 'theme.textColor' ? null : 'theme.textColor')}
                    >
                      <div 
                        className="h-6 w-6 rounded-sm mr-2"
                        style={{ backgroundColor: eventData.theme.textColor }}
                      />
                      <span className="text-dark-500">{eventData.theme.textColor}</span>
                    </div>
                    
                    {isColorPickerOpen === 'theme.textColor' && (
                      <div className="absolute left-0 top-full mt-2 z-10">
                        <HexColorPicker 
                          color={eventData.theme.textColor} 
                          onChange={(color) => handleColorChange(color, 'theme.textColor')}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="label">Font Family</label>
                  <select
                    value={eventData.theme.fontFamily}
                    onChange={(e) => setEventData({
                      ...eventData,
                      theme: {
                        ...eventData.theme,
                        fontFamily: e.target.value
                      }
                    })}
                    className="input"
                  >
                    <option value="Inter, sans-serif">Inter</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="'Poppins', sans-serif">Poppins</option>
                    <option value="'Montserrat', sans-serif">Montserrat</option>
                    <option value="'Open Sans', sans-serif">Open Sans</option>
                  </select>
                </div>
                
                <div className="pt-4 border-t border-dark-300">
                  <h4 className="text-lg font-semibold text-white mb-4">Theme Preview</h4>
                  <div 
                    className="p-4 rounded-md"
                    style={{ backgroundColor: eventData.theme.backgroundColor }}
                  >
                    <div 
                      className="mb-4 p-3 rounded-md"
                      style={{ backgroundColor: eventData.theme.primaryColor }}
                    >
                      <span style={{ color: isDarkColor(eventData.theme.primaryColor) ? '#FFFFFF' : '#000000' }}>
                        Primary Color
                      </span>
                    </div>
                    
                    <div 
                      className="mb-4 p-3 rounded-md"
                      style={{ backgroundColor: eventData.theme.secondaryColor }}
                    >
                      <span style={{ color: isDarkColor(eventData.theme.secondaryColor) ? '#FFFFFF' : '#000000' }}>
                        Secondary Color
                      </span>
                    </div>
                    
                    <p style={{ color: eventData.theme.textColor, fontFamily: eventData.theme.fontFamily }}>
                      Sample text with the selected font and color.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Helper function to determine if a color is dark
const isDarkColor = (color: string): boolean => {
  // Remove the hash if it exists
  color = color.replace('#', '');
  
  // Parse the colors and calculate luminance
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance < 0.5;
};

// Helper function to get an icon for each section type
const getSectionIcon = (type: SectionType) => {
  switch (type) {
    case 'header':
      return <Layout className="h-5 w-5 text-primary-500" />;
    case 'gallery':
      return <ImageIcon className="h-5 w-5 text-primary-500" />;
    case 'text':
      return <Type className="h-5 w-5 text-primary-500" />;
    case 'video':
      return <Video className="h-5 w-5 text-primary-500" />;
    case 'testimonial':
      return <PanelRight className="h-5 w-5 text-primary-500" />;
    case 'schedule':
      return <Calendar className="h-5 w-5 text-primary-500" />;
  }
};

export default EventEditor;