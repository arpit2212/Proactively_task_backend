import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, Link as LinkIcon, AlertCircle, ArrowLeft } from 'lucide-react';

const JoinForm = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formInput, setFormInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract share code from URL or input
  const extractShareCode = (input) => {
    if (!input) return null;
    
    // If it's a full URL, extract the form ID/share code from it
    if (input.includes('/form/')) {
      const match = input.match(/\/form\/([^/?#]+)/);
      return match ? match[1] : null;
    }
    
    // If it's just a share code, return it as-is
    return input.trim().toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const shareCode = extractShareCode(formInput);
    
    if (!shareCode) {
      setError('Please enter a valid form link or share code');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting to join form with share code:', shareCode);
      
      // Construct API URL using environment variables
      const apiUrl = `${import.meta.env.VITE_SERVER_URL}${import.meta.env.VITE_API_PATH}/forms/join`;
      
      // Join the form using the share code
      const joinResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ shareCode })
      });

      console.log('Join response status:', joinResponse.status);

      if (joinResponse.status === 404) {
        setError('Invalid share code. Please check and try again.');
        return;
      }

      if (!joinResponse.ok) {
        const errorData = await joinResponse.json();
        console.error('Join failed:', errorData);
        throw new Error(errorData.error || 'Failed to join form');
      }

      const joinData = await joinResponse.json();
      console.log('Join successful:', joinData);
      
      // Use the formId returned from the join API
      const formId = joinData.formId;
      
      if (!formId) {
        throw new Error('No form ID returned from join request');
      }

      console.log('Navigating to form:', formId);
      
      // Navigate to the form with a small delay to ensure state updates
      setTimeout(() => {
        navigate(`/form/${formId}`, { replace: true });
      }, 100);
      
    } catch (error) {
      console.error('Error joining form:', error);
      setError(error.message || 'Failed to join form. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormInput(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23374151' fillOpacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl">
              <LogIn className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Join a Form</h1>
          <p className="text-gray-400 text-lg">
            Enter a share code to start{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 font-semibold">
              collaborating
            </span>
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 p-8">
          {/* Error Message */}
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 backdrop-blur-sm rounded-xl p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="formInput" className="block text-sm font-semibold text-gray-200 mb-2">
                Share Code
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <LinkIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-200" />
                </div>
                <input
                  type="text"
                  id="formInput"
                  value={formInput}
                  onChange={handleInputChange}
                  placeholder="Enter share code (e.g., ABC123XY)"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !formInput.trim()}
                className="w-full flex justify-center items-center py-3.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span>Joining...</span>
                  </div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Join Form
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-700/30 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mr-3"></div>
            How to join a form
          </h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mr-3 border border-blue-500/30">
                <span className="text-sm text-blue-400 font-semibold">1</span>
              </div>
              <p className="text-gray-300 text-sm mt-1">Get a share code from the form creator</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mr-3 border border-blue-500/30">
                <span className="text-sm text-blue-400 font-semibold">2</span>
              </div>
              <p className="text-gray-300 text-sm mt-1">Enter the share code in the field above</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mr-3 border border-blue-500/30">
                <span className="text-sm text-blue-400 font-semibold">3</span>
              </div>
              <p className="text-gray-300 text-sm mt-1">Start collaborating in real-time!</p>
            </div>
          </div>
        </div>

        {/* Example Section */}
        <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-700/30 p-6">
          <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>
            Example share codes
          </h4>
          <div className="space-y-3">
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-600/50">
              <code className="text-blue-300 font-mono text-sm">ABC123XY</code>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-600/50">
              <code className="text-purple-300 font-mono text-sm">DEF456ZW</code>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center pt-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-gray-400 hover:text-blue-400 transition-colors duration-200 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinForm;