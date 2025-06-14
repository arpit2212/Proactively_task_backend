import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { SocketProvider } from '../src/contexts/SocketContext';
import Layout from '../src/components/Layout';
import Login from '../src/components/auth/Login';
import Register from '../src/components/auth/Register';
import Dashboard from '../src/components/DashBoard';
import CreateForm from '../src/components/forms/CreateForm';
import FormView from '../src/components/forms/FormView';
import JoinForm from '../src/components/forms/JoinForm';
import LoadingSpinner from '../src/components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth(); // Changed from isAuthenticated to user
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) { // Changed from !isAuthenticated to !user
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth(); // Changed from isAuthenticated to user
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (user) { // Changed from isAuthenticated to user
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="create-form" element={<CreateForm />} />
        <Route path="form/:id" element={<FormView />} />
        <Route path="join-form" element={<JoinForm />} />
        <Route index element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;