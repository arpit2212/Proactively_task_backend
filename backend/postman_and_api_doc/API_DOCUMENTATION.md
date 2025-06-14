# Collaborative Forms API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Health Check Endpoints

### GET /
Health check endpoint to verify server status.

**Response:**
```json
{
  "message": "Collaborative Forms API - Debug Mode",
  "status": "Server is running"
}
```

### GET /test
Simple test endpoint for basic functionality verification.

**Response:**
```json
{
  "message": "Test route working"
}
```

## Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response (Success - 201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string"
  },
  "token": "jwt_token_string"
}
```

**Response (Error - 400):**
```json
{
  "error": "User already exists" | "Invalid input data"
}
```

### POST /api/auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (Success - 200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string"
  },
  "token": "jwt_token_string"
}
```

**Response (Error - 401):**
```json
{
  "error": "Invalid credentials"
}
```

### GET /api/auth/profile
Get current user profile information.

**Headers Required:**
```
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "createdAt": "ISO_date_string"
  }
}
```

## Forms Endpoints

### GET /api/forms
Get all forms for the authenticated user.

**Headers Required:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Response (Success - 200):**
```json
{
  "forms": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "fields": [],
      "createdBy": "string",
      "createdAt": "ISO_date_string",
      "updatedAt": "ISO_date_string"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### POST /api/forms
Create a new form.

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "fields": [
    {
      "id": "string",
      "type": "text" | "email" | "number" | "textarea" | "select" | "checkbox" | "radio",
      "label": "string",
      "placeholder": "string",
      "required": boolean,
      "options": ["option1", "option2"] // for select/radio/checkbox
    }
  ]
}
```

**Response (Success - 201):**
```json
{
  "message": "Form created successfully",
  "form": {
    "id": "string",
    "title": "string",
    "description": "string",
    "fields": [],
    "createdBy": "string",
    "createdAt": "ISO_date_string"
  }
}
```

### GET /api/forms/:formId
Get a specific form by ID.

**Headers Required:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `formId`: The unique identifier of the form

**Response (Success - 200):**
```json
{
  "form": {
    "id": "string",
    "title": "string",
    "description": "string",
    "fields": [],
    "createdBy": "string",
    "collaborators": [],
    "createdAt": "ISO_date_string",
    "updatedAt": "ISO_date_string"
  }
}
```

**Response (Error - 404):**
```json
{
  "error": "Form not found"
}
```

### PUT /api/forms/:formId
Update an existing form.

**Headers Required:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `formId`: The unique identifier of the form

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "fields": [
    {
      "id": "string",
      "type": "text" | "email" | "number" | "textarea" | "select" | "checkbox" | "radio",
      "label": "string",
      "placeholder": "string",
      "required": boolean,
      "options": ["option1", "option2"]
    }
  ]
}
```

**Response (Success - 200):**
```json
{
  "message": "Form updated successfully",
  "form": {
    "id": "string",
    "title": "string",
    "description": "string",
    "fields": [],
    "updatedAt": "ISO_date_string"
  }
}
```

### DELETE /api/forms/:formId
Delete a form.

**Headers Required:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `formId`: The unique identifier of the form

**Response (Success - 200):**
```json
{
  "message": "Form deleted successfully"
}
```

### POST /api/forms/:formId/collaborate
Add collaborators to a form.

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "emails": ["collaborator1@email.com", "collaborator2@email.com"],
  "permission": "edit" | "view"
}
```

**Response (Success - 200):**
```json
{
  "message": "Collaborators added successfully",
  "collaborators": [
    {
      "userId": "string",
      "email": "string",
      "permission": "edit",
      "addedAt": "ISO_date_string"
    }
  ]
}
```

### POST /api/forms/:formId/submit
Submit form data.

**Request Body:**
```json
{
  "responses": {
    "fieldId1": "response_value",
    "fieldId2": "response_value"
  },
  "submittedBy": "string" // optional if anonymous submissions allowed
}
```

**Response (Success - 201):**
```json
{
  "message": "Form submitted successfully",
  "submissionId": "string",
  "submittedAt": "ISO_date_string"
}
```

### GET /api/forms/:formId/submissions
Get all submissions for a form.

**Headers Required:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (Success - 200):**
```json
{
  "submissions": [
    {
      "id": "string",
      "responses": {},
      "submittedBy": "string",
      "submittedAt": "ISO_date_string"
    }
  ],
  "pagination": {}
}
```

## Socket.io Events

### Client to Server Events

#### join-form
Join a form session for real-time collaboration.

**Payload:**
```json
{
  "formId": "string",
  "userId": "string",
  "username": "string"
}
```

#### field-update
Update a field value in real-time.

**Payload:**
```json
{
  "formId": "string",
  "fieldId": "string",
  "value": "any",
  "userId": "string"
}
```

#### field-lock
Lock a field to prevent others from editing.

**Payload:**
```json
{
  "formId": "string",
  "fieldId": "string",
  "userId": "string",
  "username": "string"
}
```

#### field-unlock
Unlock a previously locked field.

**Payload:**
```json
{
  "formId": "string",
  "fieldId": "string",
  "userId": "string"
}
```

### Server to Client Events

#### user-joined
Notifies when a user joins the form session.

**Payload:**
```json
{
  "userId": "string",
  "username": "string"
}
```

#### user-left
Notifies when a user leaves the form session.

**Payload:**
```json
{
  "userId": "string",
  "username": "string"
}
```

#### active-users
Sends list of currently active users in the form.

**Payload:**
```json
[
  {
    "userId": "string",
    "username": "string",
    "socketId": "string"
  }
]
```

#### field-updated
Notifies about field updates from other users.

**Payload:**
```json
{
  "fieldId": "string",
  "value": "any",
  "updatedBy": "string",
  "timestamp": "ISO_date_string"
}
```

#### field-locked
Notifies when a field is locked by another user.

**Payload:**
```json
{
  "fieldId": "string",
  "lockedBy": "string",
  "username": "string",
  "timestamp": "ISO_date_string"
}
```

#### field-unlocked
Notifies when a field is unlocked.

**Payload:**
```json
{
  "fieldId": "string",
  "unlockedBy": "string",
  "timestamp": "ISO_date_string"
}
```

## Error Responses

All endpoints may return these common error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request data",
  "details": "Specific error details"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Something went wrong"
}
```

## Rate Limiting

- API requests are limited to 100 requests per minute per IP address
- WebSocket connections are limited to 10 concurrent connections per user

## CORS Configuration

The API accepts requests from:
- `http://localhost:5173` (development frontend)
- Add production domains as needed