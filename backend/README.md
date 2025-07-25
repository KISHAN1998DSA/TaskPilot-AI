# Task Management App Backend

This is the backend for the Task Management App, built with Node.js, Express, and PostgreSQL.

## Database Setup

The application uses PostgreSQL as the database. The connection details are stored in the `.env` file.


## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Run database migrations:
   ```
   npm run db:migrate
   ```

3. Seed the database with initial data:
   ```
   npm run db:seed
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Available Scripts

### Server Scripts
- `npm start`: Start the production server
- `npm run dev`: Start the development server with nodemon (watches for file changes)
- `npm test`: Run tests

### Database Scripts
- `npm run db:migrate`: Run database migrations
- `npm run db:migrate:undo`: Undo the last migration
- `npm run db:seed`: Seed the database with initial data
- `npm run db:seed:undo`: Undo the last seed
- `npm run db:reset`: Reset the database (drop, create, migrate, seed)
- `npm run db:check`: Check database connection and list tables

### Generator Scripts
- `npm run generate:model -- --name User --attributes name:string,email:string`: Generate a new model
- `npm run generate:migration -- --name add-column-to-users`: Generate a new migration
- `npm run generate:seed -- --name demo-users`: Generate a new seed file

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login a user

### Users
- `GET /api/users`: Get all users
- `GET /api/users/:id`: Get a user by ID
- `PUT /api/users/:id`: Update a user
- `DELETE /api/users/:id`: Delete a user

### Boards
- `GET /api/boards`: Get all boards
- `POST /api/boards`: Create a new board
- `GET /api/boards/:id`: Get a board by ID
- `PUT /api/boards/:id`: Update a board
- `DELETE /api/boards/:id`: Delete a board

## Database Schema

### Users
- id (UUID, primary key)
- name (string, required)
- email (string, required, unique)
- password (string, required)
- avatar (string)
- role (enum: 'user', 'admin')

### Boards
- id (UUID, primary key)
- name (string, required)
- description (text)
- background (string)
- isPublic (boolean)
- userId (UUID, foreign key to Users)

### Lists
- id (UUID, primary key)
- name (string, required)
- position (integer)
- boardId (UUID, foreign key to Boards)

### Cards
- id (UUID, primary key)
- title (string, required)
- description (text)
- position (integer)
- dueDate (date)
- labels (array of strings)
- listId (UUID, foreign key to Lists)
- assignedTo (UUID, foreign key to Users)

### Comments
- id (UUID, primary key)
- content (text, required)
- cardId (UUID, foreign key to Cards)
- userId (UUID, foreign key to Users)

### BoardMembers
- id (UUID, primary key)
- boardId (UUID, foreign key to Boards)
- userId (UUID, foreign key to Users)
- role (enum: 'admin', 'member', 'viewer') 