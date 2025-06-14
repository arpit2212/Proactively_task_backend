import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { 
  Plus, 
  FileText, 
  Users, 
  Calendar,
  Edit3,
  Trash2,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const Dashboard = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(''); 
  const { user, token } = useAuth(); // Get token from auth context

  // Construct API base URL from environment variables
  const apiBaseUrl = `${import.meta.env.VITE_SERVER_URL}${import.meta.env.VITE_API_PATH}`;

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      // Check if token exists
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${apiBaseUrl}/forms`, {
        headers: {
          'Authorization': `Bearer ${token}`, // Include authorization header
          'Content-Type': 'application/json'
        }
      });
      
      setForms(response.data.forms);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Fetch forms error:', error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to view forms.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (error.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please check if the server is running.');
      } else {
        setError('Failed to fetch forms. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForm = async (formId, formTitle) => {
    if (window.confirm(`Are you sure you want to delete "${formTitle}"?`)) {
      try {
        if (!token) {
          alert('Authentication token not found');
          return;
        }

        await axios.delete(`${apiBaseUrl}/forms/${formId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setForms(forms.filter(form => form.id !== formId));
      } catch (error) {
        console.error('Delete form error:', error);
        
        if (error.response?.status === 401) {
          alert('Authentication failed. Please log in again.');
        } else if (error.response?.status === 403) {
          alert('Access denied. You do not have permission to delete this form.');
        } else {
          alert('Failed to delete form');
        }
      }
    }
  };

  const copyShareCode = async (shareCode) => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopiedCode(shareCode);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner text="Loading your forms..." />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-700/50 shadow-2xl">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Welcome back, {' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                {user?.username}
              </span>
              !
            </h1>
            <p className="text-gray-400 text-base sm:text-lg">
              Manage your collaborative forms and see recent activity
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Link
              to="/join-form"
              className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gray-700/50 backdrop-blur-sm text-gray-300 hover:text-white font-medium rounded-xl border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
            >
              <Users className="h-5 w-5" />
              <span>Join Form</span>
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/create-form"
                className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="h-5 w-5" />
                <span>Create Form</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200 transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-400">Total Forms</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{forms.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200 transform hover:scale-105">
          <div className="flex items-center">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-400">Collaborating</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">
                {forms.filter(form => form.created_by !== user?.id).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200 transform hover:scale-105 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <Edit3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-400">Created</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">
                {forms.filter(form => form.created_by === user?.id).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forms List */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-700/50">
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-700/50">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Your Forms</h2>
        </div>

        {error && (
          <div className="p-4 sm:p-6 bg-red-900/30 border-l-4 border-red-500 mx-4 sm:mx-6 my-4 rounded-xl backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                <p className="text-red-300 text-sm sm:text-base">{error}</p>
              </div>
              <button 
                onClick={fetchForms}
                className="text-red-400 hover:text-red-300 underline font-medium transition-colors duration-200 text-sm sm:text-base self-start sm:self-auto"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {forms.length === 0 ? (
          <div className="p-8 sm:p-16 text-center">
            <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl sm:rounded-3xl w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center shadow-xl">
              <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
              No forms yet
            </h3>
            <p className="text-gray-400 text-base sm:text-lg mb-6 sm:mb-8 max-w-md mx-auto">
              Get started by creating your first form or joining an existing one
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Link 
                to="/join-form" 
                className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gray-700/50 backdrop-blur-sm text-gray-300 hover:text-white font-medium rounded-xl border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200 transform hover:scale-105"
              >
                <Users className="h-5 w-5" />
                <span>Join Form</span>
              </Link>
              {user?.role === 'admin' && (
                <Link 
                  to="/create-form" 
                  className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Form</span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {forms.map((form) => (
              <div key={form.id} className="p-4 sm:p-8 hover:bg-gray-700/20 transition-all duration-200 group">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                      <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-blue-400 transition-colors duration-200">
                        {form.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {form.created_by === user?.id ? (
                          <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30">
                            Owner
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                            Collaborator
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {form.description && (
                      <p className="mt-2 text-gray-400 text-sm sm:text-lg">{form.description}</p>
                    )}
                    
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6 text-xs sm:text-sm text-gray-400">
                      <span className="flex items-center bg-gray-700/30 px-2 sm:px-3 py-2 rounded-lg">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Created {formatDate(form.created_at)}</span>
                      </span>
                      <span className="flex items-center bg-gray-700/30 px-2 sm:px-3 py-2 rounded-lg">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                        {form.form_collaborators?.length || 0} collaborators
                      </span>
                      <span className="flex items-center bg-gray-700/30 px-2 sm:px-3 py-2 rounded-lg">
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                        {form.form_fields?.length || 0} fields
                      </span>
                    </div>

                    {/* Share Code */}
                    <div className="mt-4 bg-gray-700/30 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-600/30">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <span className="text-xs sm:text-sm font-medium text-gray-300 flex-shrink-0">Share Code:</span>
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <code className="px-2 sm:px-3 py-2 bg-gray-900/50 border border-gray-600/50 rounded-lg text-xs sm:text-sm font-mono text-blue-400 flex-1 min-w-0 overflow-hidden">
                            {form.share_code}
                          </code>
                          <button
                            onClick={() => copyShareCode(form.share_code)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-600/50 rounded-lg transition-all duration-200 transform hover:scale-110 flex-shrink-0"
                            title="Copy share code"
                          >
                            {copiedCode === form.share_code ? (
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                            ) : (
                              <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 lg:ml-8 lg:flex-shrink-0">
                    <Link
                      to={`/form/${form.id}`}
                      className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-gray-700/50 backdrop-blur-sm text-gray-300 hover:text-white font-medium rounded-xl border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200 transform hover:scale-105 text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Open</span>
                    </Link>
                    
                    {form.created_by === user?.id && (
                      <button
                        onClick={() => handleDeleteForm(form.id, form.title)}
                        className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 font-medium rounded-xl border border-red-500/30 hover:border-red-500/50 transition-all duration-200 transform hover:scale-105 text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;