# TaskFlow - Task Management App

A full-stack task management application with Kanban boards, real-time collaboration, and AI-powered features.

## Features

- **User Authentication**: Secure login and registration with JWT
- **Role-Based Access**: Admin and Member roles with different permissions
- **Kanban Boards**: Visual task management with drag-and-drop functionality
- **Real-Time Updates**: Instant updates for all users using Socket.io
- **AI-Powered Assistance**:
  - Auto-prioritize tasks based on description and deadline
  - Generate subtasks from main task descriptions
  - Natural language input to create tasks
- **Team Collaboration**: Comment on tasks, assign users, view activity
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React with TypeScript
- Redux Toolkit for state management
- React Router for navigation
- Tailwind CSS for styling
- React Beautiful DnD for drag-and-drop
- Axios for API requests
- Socket.io client for real-time updates

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Socket.io for real-time communication
- Google Generative AI for AI features

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Google AI API key for AI features

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/taskflow.git
cd taskflow
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Create a `.env` file in the backend directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskmanagement
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

4. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the App

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Project Structure

### Frontend
```
frontend/
├── src/
│   ├── assets/          # Static assets
│   ├── components/      # Reusable components
│   ├── hooks/           # Custom React hooks
│   ├── layouts/         # Layout components
│   ├── pages/           # Page components
│   ├── services/        # API service functions
│   ├── store/           # Redux store and slices
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
```

### Backend
```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/me` - Get current user profile

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Boards
- `POST /api/boards` - Create a new board
- `GET /api/boards` - Get all boards for current user
- `GET /api/boards/:id` - Get board by ID
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board
- `PUT /api/boards/:id/columns` - Update board columns
- `POST /api/boards/:id/members` - Add member to board
- `DELETE /api/boards/:id/members/:userId` - Remove member from board

### Tasks
- `POST /api/boards/:boardId/tasks` - Create a new task
- `GET /api/boards/:boardId/tasks` - Get all tasks for a board
- `GET /api/boards/:boardId/tasks/:id` - Get task by ID
- `PUT /api/boards/:boardId/tasks/:id` - Update task
- `DELETE /api/boards/:boardId/tasks/:id` - Delete task
- `PUT /api/boards/:boardId/tasks/:id/move` - Move task between columns
- `POST /api/boards/:boardId/tasks/:id/comments` - Add comment to task

### AI Features
- `POST /api/ai/generate-subtasks` - Generate subtasks from task description
- `POST /api/ai/analyze-priority` - Analyze task priority
- `POST /api/ai/parse-task` - Parse natural language input to create task

## License

This project is licensed under the MIT License - see the LICENSE file for details. 