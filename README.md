# Collaborative Form Filling System 📝

A real-time collaborative form filling system that allows multiple users to work together on shared forms - similar to Google Docs but for structured forms. Built with modern web technologies for seamless real-time collaboration.

## UI SCREENSHOTS 

![Demo Screenshot](./public/demo-screenshot.png)

## 🌟 Features

- **🔧 Admin Panel**: Create and manage dynamic forms with custom fields
- **👥 Real-time Collaboration**: Multiple users can edit forms simultaneously
- **🔄 Live Updates**: See changes as others type in real-time
- **🔒 Field Locking**: Prevents conflicting edits with smart field locking mechanism
- **📱 Responsive Design**: Works seamlessly across devices
- **🚀 Scalable Architecture**: Built to handle multiple concurrent users
- **🎯 Role-based Access**: Clear distinction between admin and user roles

## 🏗️ Architecture Overview

![Architecture Diagram](./public/architecture-diagram.png)

### System Design

The system follows a **full-stack architecture** with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React.js)    │◄──►│   (Node.js)     │◄──►│   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│   WebSocket     │◄─────────────┘
                        │   Server        │
                        └─────────────────┘
```

### Key Components

1. **REST API Layer**: Handles CRUD operations for forms and user management
2. **WebSocket Layer**: Manages real-time updates and synchronization
3. **Database Layer**: Supabase for forms, responses, and authentication
4. **Frontend Layer**: React.js with real-time collaboration features

## 🛠️ Technology Stack

### Backend Technologies

| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **Node.js** | Runtime Environment | Excellent for real-time applications with event-driven architecture |
| **Express.js** | Web Framework | Lightweight, fast, and extensive middleware ecosystem |
| **Socket.io** | Real-time Communication | Robust WebSocket implementation with fallback options |
| **Supabase** | Backend as a Service | Provides authentication, real-time database, and REST API |

### Frontend Technologies

| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **React.js** | UI Framework | Component-based architecture perfect for dynamic forms |
| **Socket.io Client** | Real-time Updates | Seamless integration with backend WebSocket server |
| **Context API** | State Management | Built-in React state management for auth and socket connections |

### Development & DevOps

- **JavaScript/JSX**: Modern JavaScript with React components
- **CSS**: Custom styling for responsive design
- **Git**: Version control
- **npm**: Package management

## 📁 Project Structure

```
COLLABORATIVE-FORMS/
├── backend/                     # Backend API server
│   ├── config/
│   │   └── supabase.js         # Supabase configuration
│   ├── node_modules/           # Backend dependencies
│   ├── routes/                 # API route handlers
│   │   ├── auth.js            # Authentication routes
│   │   └── forms.js           # Form management routes
│   ├── .env                   # Environment variables
│   ├── .gitignore
│   ├── package-lock.json
│   ├── package.json           # Backend dependencies
│   └── server.js              # Main server file
│
├── frontend/                   # React frontend application
│   ├── public/                # Static assets
│   ├── src/                   # Source code
│   │   ├── assets/           # Images, icons, etc.
│   │   ├── components/       # Reusable React components
│   │   │   ├── auth/         # Authentication components
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   └── forms/        # Form-related components
│   │   │       ├── CreateForm.jsx
│   │   │       ├── FormView.jsx
│   │   │       └── JoinForm.jsx
│   │   ├── contexts/         # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── DashBoard.jsx     # Main dashboard component
│   │   ├── Layout.jsx        # App layout wrapper
│   │   ├── LoadingSpinner.jsx # Loading component
│   │   ├── App.jsx           # Main App component
│   │   ├── App.css           # Global styles
│   │   ├── main.jsx          # React entry point
│   │   └── index.css         # Base styles
│   ├── .eslint.config.js     # ESLint configuration
│   ├── .gitignore
│   ├── index.html            # HTML template
│   ├── package-lock.json
│   ├── package.json          # Frontend dependencies
│   └── README.md
│
└── .gitignore                # Root gitignore
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account (for backend services)

### Setup Instructions

1. **Clone the Repository**
```bash
git clone https://github.com/arpit2212/Proactively_task_backend.git
cd COLLABORATIVE-FORMS
```

2. **Backend Setup**
```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start the backend server
npm run dev
```

3. **Frontend Setup**
```bash
cd ../frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

4. **Environment Configuration**

Backend `.env` file:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

## 📚 API Documentation

### Authentication Endpoints

```http
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/profile     # Get user profile
```

### Form Management

```http
GET    /api/forms              # Get all forms
POST   /api/forms              # Create new form
GET    /api/forms/:id          # Get specific form
PUT    /api/forms/:id          # Update form
DELETE /api/forms/:id          # Delete form
POST   /api/forms/:id/join     # Join form collaboration
```

### WebSocket Events

**Client to Server:**
- `join-form`: Join form collaboration room
- `field-update`: Update specific field value
- `user-typing`: Indicate user is typing
- `user-stopped-typing`: User stopped typing

**Server to Client:**
- `form-updated`: Broadcast form changes to all users
- `user-joined`: New user joined the form
- `user-left`: User left the form
- `typing-update`: Someone is typing indication

## 🔧 Key Features & Implementation


### Component-based Architecture

**Form Components:**
- **CreateForm**: Admin interface for creating new forms
- **FormView**: Collaborative form filling interface
- **JoinForm**: Interface for users to join existing forms
- **Dashboard**: Main navigation and form management

## 🛡️ Security & Data Management

### Authentication
- **Supabase Auth**: Built-in authentication with JWT tokens
- **Protected Routes**: Route-level authentication checks
- **Role-based Access**: Different permissions for admin and users

### Data Storage
- **Supabase Database**: PostgreSQL database for reliable data storage
- **Real-time Subscriptions**: Live database updates
- **Automatic Backups**: Built-in data protection

## 📊 Performance Optimizations

### Frontend Optimizations
1. **Component Lazy Loading**: Reduce initial bundle size
2. **State Management**: Efficient re-rendering with Context API
3. **Connection Management**: Smart WebSocket connection handling

### Backend Optimizations
1. **Room-based Broadcasting**: Only send updates to relevant users
2. **Event Debouncing**: Prevent excessive real-time updates
3. **Supabase Integration**: Leverages optimized database queries

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- React team for the excellent frontend framework
- Socket.io team for real-time communication
- Supabase team for the amazing backend-as-a-service platform

---

**Built with ❤️ for seamless collaboration** 🚀

*"Making form collaboration as easy as real-time chat"*
