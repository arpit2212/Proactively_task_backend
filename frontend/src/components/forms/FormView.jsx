import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Users, Lock, Unlock, Save, Copy, Check, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

const FormView = () => {
  const { id: formId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { socket, isConnected } = useSocket();
  
  const [form, setForm] = useState(null);
  const [formResponse, setFormResponse] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [fieldLocks, setFieldLocks] = useState({});
  const [myLockedFields, setMyLockedFields] = useState(new Set()); // Fields locked by current user
  const [copySuccess, setCopySuccess] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);

  // Fetch form data
  const fetchForm = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/forms/${formId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch form');
      }

      const data = await response.json();
      setForm(data.form);
      
      // Initialize form response with existing data or empty values
      const initialResponse = {};
      data.form.fields.forEach(field => {
        if (data.form.response && data.form.response[field.id]) {
          initialResponse[field.id] = data.form.response[field.id];
        } else {
          initialResponse[field.id] = getDefaultValue(field.type);
        }
      });
      setFormResponse(initialResponse);
      
    } catch (error) {
      console.error('Error fetching form:', error);
      setError('Failed to load form. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [formId, token]);

  // Get default value based on field type
  const getDefaultValue = (fieldType) => {
    switch (fieldType) {
      case 'checkbox':
        return [];
      case 'number':
        return '';
      default:
        return '';
    }
  };

  // Join form session via socket
  useEffect(() => {
    if (socket && isConnected && user && formId) {
      socket.emit('join-form', {
        formId,
        userId: user.id,
        username: user.username
      });
    }
  }, [socket, isConnected, user, formId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleFieldUpdated = ({ fieldId, value, updatedBy, timestamp }) => {
      // Only update if the change came from another user
      if (updatedBy !== user.id) {
        setFormResponse(prev => ({
          ...prev,
          [fieldId]: value
        }));
      }
    };

    const handleFieldLocked = ({ fieldId, lockedBy, username, timestamp }) => {
      // Only show lock indicator for other users, not yourself
      if (lockedBy !== user.id) {
        setFieldLocks(prev => ({
          ...prev,
          [fieldId]: { lockedBy, username, timestamp }
        }));
      }
    };

    const handleFieldUnlocked = ({ fieldId, unlockedBy, timestamp }) => {
      // Remove lock indicator when field is unlocked
      setFieldLocks(prev => {
        const newLocks = { ...prev };
        delete newLocks[fieldId];
        return newLocks;
      });
    };

    const handleUserJoined = ({ userId, username }) => {
      if (userId !== user.id) {
        setActiveUsers(prev => {
          // Check if user already exists to prevent duplicates
          const existingUserIndex = prev.findIndex(u => u.userId === userId);
          if (existingUserIndex !== -1) {
            // Update existing user info
            const updated = [...prev];
            updated[existingUserIndex] = { userId, username };
            return updated;
          } else {
            // Add new user
            return [...prev, { userId, username }];
          }
        });
      }
    };

    const handleUserLeft = ({ userId, username }) => {
      setActiveUsers(prev => prev.filter(u => u.userId !== userId));
      // Remove any field locks by this user
      setFieldLocks(prev => {
        const newLocks = { ...prev };
        Object.keys(newLocks).forEach(fieldId => {
          if (newLocks[fieldId].lockedBy === userId) {
            delete newLocks[fieldId];
          }
        });
        return newLocks;
      });
    };

    const handleActiveUsers = (users) => {
      // Filter out current user and ensure no duplicates
      const otherUsers = users.filter(u => u.userId !== user.id);
      const uniqueUsers = otherUsers.reduce((acc, current) => {
        const existingUser = acc.find(user => user.userId === current.userId);
        if (!existingUser) {
          acc.push(current);
        }
        return acc;
      }, []);
      setActiveUsers(uniqueUsers);
    };

    socket.on('field-updated', handleFieldUpdated);
    socket.on('field-locked', handleFieldLocked);
    socket.on('field-unlocked', handleFieldUnlocked);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('active-users', handleActiveUsers);

    return () => {
      socket.off('field-updated', handleFieldUpdated);
      socket.off('field-locked', handleFieldLocked);
      socket.off('field-unlocked', handleFieldUnlocked);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('active-users', handleActiveUsers);
    };
  }, [socket, user]);

  // Fetch form on component mount
  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  // Handle field focus (lock field)
  const handleFieldFocus = (fieldId) => {
    if (socket) {
      socket.emit('field-lock', {
        formId,
        fieldId,
        userId: user.id,
        username: user.username
      });
      setMyLockedFields(prev => new Set([...prev, fieldId]));
    }
  };

  // Handle field blur (unlock field)
  const handleFieldBlur = (fieldId) => {
    if (socket) {
      socket.emit('field-unlock', {
        formId,
        fieldId,
        userId: user.id
      });
      setMyLockedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldId);
        return newSet;
      });
    }
  };

  // Handle field value change
  const handleFieldChange = (fieldId, value) => {
    setFormResponse(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Broadcast change to other users
    if (socket) {
      socket.emit('field-update', {
        formId,
        fieldId,
        value,
        userId: user.id
      });
    }
  };

  // Save form response
  const saveFormResponse = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`http://localhost:3000/api/forms/${formId}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ response: formResponse })
      });

      if (!response.ok) {
        throw new Error('Failed to save response');
      }

      setLastSaved(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error saving response:', error);
      alert('Failed to save response. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Copy form link
  const copyFormLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  // Render form field
  const renderField = (field) => {
    const lockInfo = fieldLocks[field.id];
    const isLockedByOther = lockInfo && lockInfo.lockedBy !== user.id;
    const isLockedByMe = myLockedFields.has(field.id);
    const value = formResponse[field.id] || getDefaultValue(field.type);

    const baseClasses = "w-full px-4 py-3.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm";
    const lockedClasses = isLockedByOther 
      ? "border-orange-400 bg-orange-900/30 focus:ring-orange-500" 
      : isLockedByMe 
        ? "border-blue-400 bg-blue-900/30 focus:ring-blue-500"
        : "border-gray-600 hover:border-gray-500 focus:ring-blue-500";

    const commonProps = {
      id: field.id,
      onFocus: () => handleFieldFocus(field.id),
      onBlur: () => handleFieldBlur(field.id),
      className: `${baseClasses} ${lockedClasses}`,
      placeholder: field.placeholder
    };

    const renderFieldContent = () => {
      switch (field.type) {
        case 'textarea':
          return (
            <textarea
              {...commonProps}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              rows="4"
            />
          );

        case 'number':
          return (
            <input
              {...commonProps}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
          );

        case 'email':
          return (
            <input
              {...commonProps}
              type="email"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
          );

        case 'date':
          return (
            <input
              {...commonProps}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
          );

        case 'select':
          return (
            <select
              {...commonProps}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            >
              <option value="">Select an option</option>
              {field.options?.map(option => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );

        case 'radio':
          return (
            <div className="space-y-3">
              {field.options?.map(option => (
                <label key={option.id} className="flex items-center cursor-pointer hover:bg-gray-800/50 p-3 rounded-xl transition-all duration-200 group">
                  <input
                    type="radio"
                    name={field.id}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="mr-3 text-blue-600 focus:ring-blue-500 focus:ring-2 w-4 h-4"
                    onFocus={() => handleFieldFocus(field.id)}
                    onBlur={() => handleFieldBlur(field.id)}
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-200">{option.label}</span>
                </label>
              ))}
            </div>
          );

        case 'checkbox':
          return (
            <div className="space-y-3">
              {field.options?.map(option => (
                <label key={option.id} className="flex items-center cursor-pointer hover:bg-gray-800/50 p-3 rounded-xl transition-all duration-200 group">
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={Array.isArray(value) && value.includes(option.value)}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter(v => v !== option.value);
                      handleFieldChange(field.id, newValues);
                    }}
                    className="mr-3 text-blue-600 focus:ring-blue-500 focus:ring-2 w-4 h-4"
                    onFocus={() => handleFieldFocus(field.id)}
                    onBlur={() => handleFieldBlur(field.id)}
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-200">{option.label}</span>
                </label>
              ))}
            </div>
          );

        default:
          return (
            <input
              {...commonProps}
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
          );
      }
    };

    return (
      <div key={field.id} className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <label htmlFor={field.id} className="block text-sm font-semibold text-gray-200">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>
          {isLockedByOther && lockInfo && (
            <div className="flex items-center text-xs text-orange-300 bg-orange-900/30 border border-orange-500/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Users className="w-3 h-3 mr-1.5" />
              {lockInfo.username} is editing
            </div>
          )}
          {isLockedByMe && (
            <div className="flex items-center text-xs text-blue-300 bg-blue-900/30 border border-blue-500/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Lock className="w-3 h-3 mr-1.5" />
              You are editing
            </div>
          )}
        </div>
        <div className="relative">
          {renderFieldContent()}
          {isLockedByOther && (
            <div className="absolute inset-0 bg-orange-400/5 pointer-events-none rounded-xl border border-orange-400/20 backdrop-blur-sm"></div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-900/30 border border-red-500/50 backdrop-blur-xl rounded-2xl p-6 flex items-start shadow-2xl">
            <AlertCircle className="w-6 h-6 text-red-400 mr-4 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-lg">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12 bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-700/50 shadow-2xl">
            <p className="text-gray-400 text-xl mb-6">Form not found.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23374151' fillOpacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">{form.title}</h1>
              {form.description && (
                <p className="text-gray-300 text-lg leading-relaxed">{form.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={copyFormLink}
                className="inline-flex items-center px-4 py-2.5 border border-gray-600 text-sm font-medium rounded-xl text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 backdrop-blur-sm"
              >
                {copySuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Share Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active Users */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-3 text-gray-400" />
              <span className="text-gray-300">
                {activeUsers.length === 0 
                  ? 'You are working alone' 
                  : `${activeUsers.length + 1} people working on this form`}
              </span>
              {activeUsers.length > 0 && (
                <div className="ml-4 flex items-center space-x-2">
                  {activeUsers.slice(0, 3).map((activeUser) => (
                    <div
                      key={activeUser.userId}
                      className="flex items-center bg-blue-900/30 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm"
                    >
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      {activeUser.username}
                    </div>
                  ))}
                  {activeUsers.length > 3 && (
                    <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full">
                      +{activeUsers.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center bg-gray-800/50 px-3 py-2 rounded-full border border-gray-600/50">
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 p-8 mb-8">
          <form onSubmit={(e) => e.preventDefault()}>
            {form.fields.map(renderField)}
          </form>
        </div>

        {/* Save Button */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 p-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {lastSaved && (
                <div className="flex items-center bg-gray-700/50 px-3 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span>Last saved: {lastSaved}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 border border-gray-600 text-gray-300 font-medium rounded-xl hover:bg-gray-700/50 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 backdrop-blur-sm"
              >
                Back to Dashboard
              </button>
              <button
                onClick={saveFormResponse}
                disabled={isSaving}
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Response
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormView;