import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Image, 
  FileText, 
  BarChart3, 
  Settings as SettingsIcon,
  Menu, 
  X, 
  LogOut,
  Users,
  Search,
  Shield,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Define navigation based on user role
  const getNavigation = () => {
    const baseNavigation = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: [ 'organizer', 'participant', 'administrator'] },
    ];

    // Add role-specific navigation items
    if (user?.role === 'organizer' || user?.role === 'administrator' ) {
      baseNavigation.push(
        { name: 'Media', href: '/media', icon: Image, roles: ['organizer', 'administrator'] },
        { name: 'Publications', href: '/publications', icon: FileText, roles: ['organizer', 'administrator'] },
        { name: 'Statistics', href: '/statistics', icon: BarChart3, roles: ['organizer', 'administrator'] }
      );
    }

    if (user?.role === 'administrator') {
      baseNavigation.push(
        { name: 'User Management', href: '/users', icon: Users, roles: ['administrator'] },
        { name: 'Event Management', href: '/events', icon: Shield, roles: ['administrator'] }
      );
    }

    // Settings available to all users
    baseNavigation.push(
      { name: 'Settings', href: '/settings', icon: SettingsIcon, roles: ['organizer', 'participant', 'administrator'] }
    );

    // Filter navigation based on user role
    return baseNavigation.filter(item => 
      item.roles.includes(user?.role || 'participant')
    );
  };

  const navigation = getNavigation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'text-purple-500';
      case 'organizer':
        return 'text-green-500';
      case 'participant':
        return 'text-blue-500';
      default:
        return 'text-dark-500';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'Admin';
      case 'organizer':
        return 'Organizer';
      case 'participant':
        return 'Participant';
      default:
        return 'User';
    }
  };

  return (
    <div className="min-h-screen bg-dark flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-100 transition-transform duration-300 ease-in-out transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:z-0`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-center h-16 px-4 border-b border-dark-300">
            <img 
              src="/BoomSnap white (1).png" 
              alt="BoomSnap" 
              className="h-8 w-auto"
            />
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      isActive 
                        ? 'bg-dark-200 text-primary-500' 
                        : 'text-dark-600 hover:bg-dark-200 hover:text-white'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-500' : 'text-dark-500'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-dark-300">
              <div className="mb-3 px-4 py-2 bg-dark-200 rounded-md">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-dark font-bold text-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="ml-2 min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className={`text-xs ${getRoleColor(user?.role || 'participant')}`}>
                      {getRoleLabel(user?.role || 'participant')}
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm font-medium text-dark-600 hover:bg-dark-200 hover:text-white rounded-md transition-colors"
              >
                <LogOut className="mr-3 h-5 w-5 text-dark-500" />
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <div className="bg-dark-100 border-b border-dark-300">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <button
                className="lg:hidden p-2 rounded-md text-dark-500 hover:text-white hover:bg-dark-200"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="ml-4 text-xl font-bold text-white">{title}</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 input bg-dark-200 h-9 w-48 text-sm"
                />
              </div>

              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-dark font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="ml-2 hidden md:block">
                  <span className="text-sm font-medium text-white">
                    {user?.name || 'User'}
                  </span>
                  <p className={`text-xs ${getRoleColor(user?.role || 'participant')}`}>
                    {getRoleLabel(user?.role || 'participant')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-dark p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;