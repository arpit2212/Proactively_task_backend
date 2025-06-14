import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, X, Save, Eye } from 'lucide-react';

// Move FieldEditor component outside to prevent recreation on every render
const FieldEditor = React.memo(({ field, index, onUpdateField, onRemoveField, onAddOption, onUpdateOption, onRemoveOption, fieldTypes }) => {
  const needsOptions = ['select', 'radio', 'checkbox'].includes(field.type);

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-6 shadow-xl">
      <div className="flex justify-between items-start mb-6">
        <h4 className="text-lg font-semibold text-gray-200">Field {index + 1}</h4>
        <button
          type="button"
          onClick={() => onRemoveField(field.id)}
          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded-xl transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-2">
            Field Type
          </label>
          <select
            value={field.type}
            onChange={(e) => onUpdateField(field.id, { type: e.target.value, options: [] })}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
          >
            {fieldTypes.map(type => (
              <option key={type.value} value={type.value} className="bg-gray-800 text-white">
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-2">
            Field Label *
          </label>
          <input
            type="text"
            value={field.label || ''}
            onChange={(e) => onUpdateField(field.id, { label: e.target.value })}
            placeholder="Enter field label"
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-2">
            Placeholder Text
          </label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => onUpdateField(field.id, { placeholder: e.target.value })}
            placeholder="Enter placeholder text"
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
          />
        </div>

        <div className="flex items-center pt-8">
          <input
            type="checkbox"
            id={`required-${field.id}`}
            checked={field.required || false}
            onChange={(e) => onUpdateField(field.id, { required: e.target.checked })}
            className="h-5 w-5 text-blue-600 bg-gray-900/50 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label htmlFor={`required-${field.id}`} className="ml-3 text-sm font-medium text-gray-300">
            Required field
          </label>
        </div>
      </div>

      {needsOptions && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-semibold text-gray-200">
              Options
            </label>
            <button
              type="button"
              onClick={() => onAddOption(field.id)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Option
            </button>
          </div>
          
          {field.options && field.options.map((option, optionIndex) => (
            <div key={option.id} className="flex gap-3 mb-3">
              <input
                type="text"
                value={option.label || ''}
                onChange={(e) => onUpdateOption(field.id, option.id, { 
                  label: e.target.value, 
                  value: e.target.value.toLowerCase().replace(/\s+/g, '_') 
                })}
                placeholder={`Option ${optionIndex + 1}`}
                className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              />
              <button
                type="button"
                onClick={() => onRemoveOption(field.id, option.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 px-3 py-2 rounded-xl transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const CreateForm = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fields: []
  });

  // Environment variables
  const API_BASE_URL = `${import.meta.env.VITE_SERVER_URL}${import.meta.env.VITE_API_PATH}`;

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'date', label: 'Date' }
  ];

  const addField = useCallback(() => {
    const newField = {
      id: Date.now().toString(),
      name: `field_${Date.now()}`,
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
      options: []
    };
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  }, []);

  const updateField = useCallback((fieldId, updates) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  }, []);

  const removeField = useCallback((fieldId) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
  }, []);

  const addOption = useCallback((fieldId) => {
    const newOption = { id: Date.now().toString(), value: '', label: '' };
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId 
          ? { ...field, options: [...field.options, newOption] }
          : field
      )
    }));
  }, []);

  const updateOption = useCallback((fieldId, optionId, updates) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId 
          ? {
              ...field,
              options: field.options.map(option =>
                option.id === optionId ? { ...option, ...updates } : option
              )
            }
          : field
      )
    }));
  }, []);

  const removeOption = useCallback((fieldId, optionId) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId 
          ? { ...field, options: field.options.filter(option => option.id !== optionId) }
          : field
      )
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a form title');
      return;
    }

    if (formData.fields.length === 0) {
      alert('Please add at least one field');
      return;
    }

    // Validate that all fields have labels
    const emptyLabelFields = formData.fields.filter(field => !field.label.trim());
    if (emptyLabelFields.length > 0) {
      alert('Please provide labels for all fields');
      return;
    }

    // Validate that fields with options have at least one option
    const fieldsNeedingOptions = formData.fields.filter(field => 
      ['select', 'radio', 'checkbox'].includes(field.type)
    );
    const fieldsWithoutOptions = fieldsNeedingOptions.filter(field => 
      !field.options || field.options.length === 0 || 
      field.options.some(option => !option.label.trim())
    );
    if (fieldsWithoutOptions.length > 0) {
      alert('Please provide at least one option for dropdown, radio, and checkbox fields');
      return;
    }

    setIsLoading(true);

    try {
      // Check if user is authenticated
      if (!token) {
        alert('You must be logged in to create a form');
        navigate('/login');
        return;
      }

      // Transform the data to match backend expectations
      const transformedFields = formData.fields.map(field => ({
        name: field.name || field.label.toLowerCase().replace(/\s+/g, '_'),
        type: field.type,
        label: field.label,
        options: field.options && field.options.length > 0 ? field.options : null,
        required: field.required
      }));

      const response = await fetch(`${API_BASE_URL}/forms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          fields: transformedFields
        })
      });

      if (response.status === 401) {
        alert('Your session has expired. Please log in again.');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      navigate(`/form/${result.form.id}`);
    } catch (error) {
      console.error('Error creating form:', error);
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        alert('Authentication failed. Please log in again.');
        navigate('/login');
      } else {
        alert(error.message || 'Failed to create form. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23374151' fillOpacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Create New Form</h1>
          <p className="text-gray-400 text-lg">
            Build a collaborative form that multiple users can fill together in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 font-semibold">
              real-time
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Form Basic Info */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 p-8">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></div>
              Form Details
            </h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-200 mb-2">
                  Form Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter form title"
                  className="w-full px-4 py-3.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-200 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter form description (optional)"
                  rows="4"
                  className="w-full px-4 py-3.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-white flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></div>
                Form Fields
              </h2>
              <button
                type="button"
                onClick={addField}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Field
              </button>
            </div>

            {formData.fields.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                </div>
                <p className="text-gray-400 text-lg mb-4">No fields added yet</p>
                <p className="text-gray-500">Click "Add Field" to start building your form</p>
              </div>
            ) : (
              <div>
                {formData.fields.map((field, index) => (
                  <FieldEditor 
                    key={field.id} 
                    field={field} 
                    index={index}
                    onUpdateField={updateField}
                    onRemoveField={removeField}
                    onAddOption={addOption}
                    onUpdateOption={updateOption}
                    onRemoveOption={removeOption}
                    fieldTypes={fieldTypes}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3.5 bg-gray-700/50 border border-gray-600 text-gray-300 font-medium rounded-xl hover:bg-gray-600/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 backdrop-blur-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Create Form
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateForm;