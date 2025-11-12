import React, { useState, useEffect } from 'react';
import { Users, Eye, Plus, Search, Filter, Calendar, Building, User, Mail, Phone, MapPin, FileText, Upload } from 'lucide-react';
import { apiClient } from '../../../config/api';
import UserDetailModal from '../UserDetailModal';

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await apiClient.admin.getUsers();
      console.log('👥 Loaded users data:', usersData);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Eroare la încărcarea utilizatorilor');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (user) => {
    try {
      // Load complete user details including addresses and billing profiles
      const userDetails = await apiClient.admin.getUserDetails(user.id);
      setSelectedUser(userDetails);
      setShowUserDetail(true);
    } catch (error) {
      console.error('Error loading user details:', error);
      setMessage('Eroare la încărcarea detaliilor utilizatorului');
    }
  };

  const getDisplayName = (user) => {
    // If user has billing profiles with company name, show that
    if (user.billing_profiles && user.billing_profiles.length > 0) {
       const companyProfile = user.billing_profiles.find(p => p.type === 'company' && p.company_name);
      if (companyProfile) {
        return companyProfile.company_name;
      }
    }
    
    // Otherwise show first + last name
    const firstName = user.first_name || user.firstName || '';
    const lastName = user.last_name || user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    return user.email || 'Utilizator';
  };

  const getUserType = (user) => {
    if (user.billing_profiles && user.billing_profiles.length > 0) {
     const hasCompany = user.billing_profiles.some(p => p.type === 'company');
      return hasCompany ? 'company' : 'individual';
    }
    return 'individual';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data invalidă';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      getDisplayName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone || '').includes(searchTerm);
    
    const matchesRole = roleFilter === 'all' || (user.role || 'user') === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-text-primary">Gestionare Utilizatori</h2>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Gestionare Utilizatori</h2>
        <div className="text-sm text-text-secondary">
          Total: {filteredUsers.length} utilizatori
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('success') || message.includes('succes')
            ? 'bg-green-50 border border-green-200 text-green-600'
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {message}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-text-primary mb-2">
              Caută utilizatori
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light w-5 h-5" />
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nume, email sau telefon..."
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-text-primary mb-2">
              Filtru rol
            </label>
            <select
              id="role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Toate</option>
              <option value="admin">Administratori</option>
              <option value="user">Utilizatori</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilizator/Firmă
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tip
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data înregistrării
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acțiuni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id || user.auth_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          getUserType(user) === 'company' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {getUserType(user) === 'company' ? (
                            <Building className="h-5 w-5 text-blue-600" />
                          ) : (
                            <User className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getDisplayName(user)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getUserType(user) === 'company' ? 'Firmă' : 'Persoană fizică'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center mb-1">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        {user.email || 'N/A'}
                      </div>
                      {user.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        (user.role || 'user') === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {(user.role || 'user') === 'admin' ? 'Administrator' : 'Utilizator'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {formatDate(user.created_at || user.createdAt)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-2 ${
                        user.email_verified || user.emailVerified ? 'bg-green-400' : 'bg-yellow-400'
                      }`}></div>
                      <span className="text-sm text-gray-500">
                        {user.email_verified || user.emailVerified ? 'Activ' : 'Neverificat'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewUser(user)}
                      className="text-primary hover:text-primary-dark flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Vezi detalii
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-secondary mb-2">
            {searchTerm || roleFilter !== 'all' 
              ? 'Niciun utilizator găsit' 
              : 'Niciun utilizator înregistrat'
            }
          </h3>
          <p className="text-text-light">
            {searchTerm || roleFilter !== 'all'
              ? 'Încearcă să modifici criteriile de căutare.'
              : 'Utilizatorii înregistrați vor apărea aici.'
            }
          </p>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          isOpen={showUserDetail}
          onClose={() => {
            setShowUserDetail(false);
            setSelectedUser(null);
          }}
          onRefresh={fetchUsers}
        />
      )}
    </div>
  );
}

export default UsersTab;
