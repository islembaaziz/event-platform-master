import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Shield, 
  UserCheck, 
  UserX,
  Plus,
  Download,
  Mail,
  Calendar,
  Building
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import RoleGuard from '../../components/common/RoleGuard';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'organizer' | 'participant' | 'administrator';
  organization?: string;
  bio?: string;
  website?: string;
  created_at: string;
  settings?: any;
}

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: number, newRole: string) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole as any } : user
      ));
      toast.success('User role updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const deleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const deleteSelectedUsers = async () => {
    if (selectedUsers.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`)) {
      return;
    }

    try {
      await Promise.all(selectedUsers.map(userId => api.delete(`/users/${userId}`)));
      setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
      toast.success(`${selectedUsers.length} users deleted successfully`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete users');
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.organization && user.organization.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'organizer':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'participant':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'administrator':
        return <Shield className="h-3 w-3" />;
      case 'organizer':
        return <Users className="h-3 w-3" />;
      case 'participant':
        return <UserCheck className="h-3 w-3" />;
      default:
        return <UserX className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout title="User Management">
      <RoleGuard 
        allowedRoles={['administrator']}
        fallback={
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Shield className="h-12 w-12 text-dark-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-dark-500">You do not have permission to access user management.</p>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Header with controls */}
          <div className="bg-dark-100 p-4 rounded-lg">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-white">User Management</h2>
                <span className="bg-dark-200 text-dark-500 text-xs px-2 py-1 rounded-full">
                  {users.length} total users
                </span>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-500" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 input bg-dark-200 h-9 text-sm w-64"
                  />
                </div>
                
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="input bg-dark-200 h-9 text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="administrator">Administrator</option>
                  <option value="organizer">Organizer</option>
                  <option value="participant">Participant</option>
                </select>
                
                <button className="btn-secondary text-sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
                
                <button 
                  onClick={() => setShowUserModal(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </button>
              </div>
            </div>
          </div>

          {/* Bulk actions */}
          {selectedUsers.length > 0 && (
            <div className="bg-dark-100 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-white">
                  {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                </span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={deleteSelectedUsers}
                  className="btn-secondary text-sm text-error hover:bg-error hover:text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Users table */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
              <p className="mt-4 text-dark-500">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-dark-100 rounded-lg">
              <Users className="h-12 w-12 text-dark-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No users found</h3>
              <p className="text-dark-500">
                {searchQuery || roleFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No users are currently registered'}
              </p>
            </div>
          ) : (
            <div className="bg-dark-100 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-dark-300">
                  <thead className="bg-dark-200">
                    <tr>
                      <th className="p-3 text-left w-10">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="p-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="p-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="p-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="p-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="p-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-300">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-dark-200 transition-colors">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-dark font-bold mr-3">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">
                                {user.name}
                                {user.id === currentUser?.id && (
                                  <span className="ml-2 text-xs text-primary-500">(You)</span>
                                )}
                              </div>
                              <div className="text-sm text-dark-500 flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="relative group">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                              {getRoleIcon(user.role)}
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                            
                            {user.id !== currentUser?.id && (
                              <div className="absolute left-0 top-full mt-1 bg-dark-100 rounded-md shadow-lg z-10 w-40 py-1 border border-dark-300 hidden group-hover:block">
                                <button
                                  onClick={() => updateUserRole(user.id, 'participant')}
                                  className="block w-full text-left px-3 py-1 text-sm text-dark-600 hover:bg-dark-200 hover:text-white"
                                >
                                  Participant
                                </button>
                                <button
                                  onClick={() => updateUserRole(user.id, 'organizer')}
                                  className="block w-full text-left px-3 py-1 text-sm text-dark-600 hover:bg-dark-200 hover:text-white"
                                >
                                  Organizer
                                </button>
                                <button
                                  onClick={() => updateUserRole(user.id, 'administrator')}
                                  className="block w-full text-left px-3 py-1 text-sm text-dark-600 hover:bg-dark-200 hover:text-white"
                                >
                                  Administrator
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-white flex items-center">
                            {user.organization ? (
                              <>
                                <Building className="h-3 w-3 mr-1 text-dark-500" />
                                {user.organization}
                              </>
                            ) : (
                              <span className="text-dark-500">-</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-white flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-dark-500" />
                            {formatDate(user.created_at)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setShowUserModal(true);
                              }}
                              className="p-1 rounded hover:bg-dark-300 text-dark-500 hover:text-white"
                              title="Edit user"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            
                            {user.id !== currentUser?.id && (
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="p-1 rounded hover:bg-dark-300 text-dark-500 hover:text-error"
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="p-4 border-t border-dark-300 flex justify-between items-center">
                <div className="text-sm text-dark-500">
                  Showing {filteredUsers.length} of {users.length} users
                </div>
                <div className="flex space-x-1">
                  <button className="px-3 py-1 bg-dark-200 text-dark-500 rounded-md hover:bg-dark-300 hover:text-white text-sm">
                    Previous
                  </button>
                  <button className="px-3 py-1 bg-primary-500 text-dark rounded-md text-sm">
                    1
                  </button>
                  <button className="px-3 py-1 bg-dark-200 text-dark-500 rounded-md hover:bg-dark-300 hover:text-white text-sm">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Modal (Add/Edit) */}
        {showUserModal && (
          <UserModal
            user={editingUser}
            onClose={() => {
              setShowUserModal(false);
              setEditingUser(null);
            }}
            onSave={(userData) => {
              if (editingUser) {
                setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userData } : u));
              } else {
                fetchUsers(); // Refresh the list for new users
              }
              setShowUserModal(false);
              setEditingUser(null);
            }}
          />
        )}
      </RoleGuard>
    </DashboardLayout>
  );
};

// User Modal Component
interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onSave: (userData: any) => void;
}

const UserModal = ({ user, onClose, onSave }: UserModalProps) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'participant',
    organization: user?.organization || '',
    bio: user?.bio || '',
    website: user?.website || '',
    password: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    if (!user && !formData.password.trim()) {
      toast.error('Password is required for new users');
      return;
    }

    try {
      setIsSaving(true);
      
      const payload = { ...formData };
      if (user && !formData.password) {
        delete payload.password; // Don't update password if not provided
      }

      if (user) {
        await api.put(`/users/${user.id}`, payload);
        toast.success('User updated successfully');
      } else {
        await api.post('/users', payload);
        toast.success('User created successfully');
      }
      
      onSave(payload);
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${user ? 'update' : 'create'} user`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-100 rounded-lg w-full max-w-md">
        <div className="p-4 border-b border-dark-300">
          <h3 className="text-lg font-semibold text-white">
            {user ? 'Edit User' : 'Add New User'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="label">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>
          
          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              required
            />
          </div>
          
          <div>
            <label className="label">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="input"
            >
              <option value="participant">Participant</option>
              <option value="organizer">Organizer</option>
              <option value="administrator">Administrator</option>
            </select>
          </div>
          
          <div>
            <label className="label">Organization</label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              className="input"
            />
          </div>
          
          <div>
            <label className="label">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="input"
            />
          </div>
          
          <div>
            <label className="label">
              Password {user ? '(leave blank to keep current)' : '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input"
              required={!user}
            />
          </div>
          
          <div>
            <label className="label">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="input min-h-20"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? 'Saving...' : (user ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;