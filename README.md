# Taxina - Direct Chat Platform

A modern, real-time chat platform connecting customers and drivers. Built with Node.js, Express, Socket.io, React, and MongoDB.

## 🚀 Features

- **Real-time Messaging** via WebSocket (Socket.io)
- **Admin-Configured Quick Questions** with predefined answers  
- **Voice Messaging** support
- **Text-to-Speech** for drivers (hands-free message reading)
- **Role-Based Access Control** (Admin, Customer, Driver)
- **Direct Chat Sessions** between customers and drivers
- **JWT Authentication**
- **MongoDB with Mongoose ODM**
- **Modern React Frontend** with Tailwind CSS

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher) 
- npm or yarn

## 🛠️ Quick Start

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd Taxina
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/taxina
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRES_IN=7d
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads/voices
   ALLOWED_ORIGINS=http://localhost:5173
   ```

4. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod
   
   # Or use MongoDB Atlas (update MONGODB_URI in .env)
   ```

5. **Run the backend**
   ```bash
   npm start
   ```
   Server will start on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd taxina-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   
   Create `.env` file in `taxina-frontend/`:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. **Run the frontend**
   ```bash
   npm run dev
   ```
   Frontend will start on `http://localhost:5173`

## 📁 Project Structure

### Backend
```
Taxina/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── env.js               # Environment configuration
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── ChatSession.js       # Chat session schema
│   │   ├── Message.js           # Message schema
│   │   └── AdminQuestion.js     # Admin question schema
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── roleAuth.js          # Role-based authorization
│   │   ├── upload.js            # File upload (Multer)
│   │   └── errorHandler.js      # Global error handler
│   ├── services/
│   │   ├── chatService.js       # Chat business logic
│   │   ├── questionService.js   # Question business logic
│   │   └── messageService.js    # Message business logic
│   ├── controllers/
│   │   ├── adminController.js   # Admin endpoints
│   │   ├── authController.js    # Authentication
│   │   └── chatController.js    # Chat endpoints
│   ├── routes/
│   │   ├── adminRoutes.js       # Admin routes
│   │   ├── authRoutes.js        # Auth routes
│   │   └── chatRoutes.js        # Chat routes
│   ├── websocket/
│   │   ├── socketManager.js     # Socket.io setup
│   │   └── handlers/
│   │       ├── connectionHandler.js
│   │       ├── messageHandler.js
│   │       └── questionHandler.js
│   └── app.js                   # Express app setup
├── uploads/                     # Voice message storage
└── server.js                    # Entry point
```

### Frontend
```
taxina-frontend/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.jsx  # Route protection
│   ├── context/
│   │   └── AuthContext.jsx     # Auth state management
│   ├── pages/
│   │   ├── Login.jsx           # Login page
│   │   ├── Register.jsx        # Registration page
│   │   ├── CustomerDashboard.jsx
│   │   ├── DriverDashboard.jsx
│   │   └── ChatRoom.jsx        # Main chat interface
│   ├── services/
│   │   ├── api.js              # Axios instance
│   │   └── socket.js           # Socket.io client
│   └── App.jsx                 # Main app component
```

## 🔌 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | User login |
| GET | `/me` | Get current user |

### Chat Routes (`/api/chat`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/create` | Create chat session | Customer/Driver |
| GET | `/session/:sessionId` | Get chat session | Participants |
| GET | `/history/:sessionId` | Get chat history | Participants |
| POST | `/upload-voice` | Upload voice message | Customer/Driver |
| GET | `/search/:sessionId` | Search messages | Participants |

### Admin Routes (`/api/admin`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/questions` | Create question | Admin |
| GET | `/questions` | Get all questions | Admin |
| GET | `/questions/active` | Get active questions | All |
| PUT | `/questions/:id` | Update question | Admin |
| DELETE | `/questions/:id` | Delete question | Admin |

## 🔌 WebSocket Events

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `join_chat` | `{ chatSessionId }` | Join chat room |
| `leave_chat` | `{ chatSessionId }` | Leave chat room |
| `send_message` | `{ chatSessionId, type, text, voiceUrl, questionId }` | Send message |
| `typing` | `{ chatSessionId, isTyping }` | Typing indicator |

### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `joined_chat` | `{ chatSessionId, roomName }` | Join confirmation |
| `new_message` | `{ message }` | New message received |
| `customer_asked_question` | `{ question, askedBy }` | Question asked |
| `typing` | `{ userId, userName, isTyping }` | Typing indicator |
| `error` | `{ message }` | Error message |

## 🎯 User Roles

### Customer
- Create chat sessions with drivers
- Send text, voice, and question messages
- View chat history
- Search messages

### Driver  
- View active chat sessions
- Send text and voice messages
- Answer quick questions
- Use text-to-speech for incoming messages

### Admin
- Manage quick questions and answers
- View all chat sessions
- Monitor system activity

## 🔐 Security Features

- JWT-based authentication
- Role-based authorization
- Input validation
- File upload restrictions
- CORS configuration
- Password hashing (bcryptjs)
- Socket authentication

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taxina
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads/voices
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend (taxina-frontend/.env)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## 🧪 Testing

### Create Test Users

Run the seed script to create test users:
```bash
node scripts/seed.js
```

This creates:
- Admin: `admin@taxina.com` / `admin123`
- Customer: `customer@taxina.com` / `customer123`  
- Driver: `driver@taxina.com` / `driver123`

### Test the Application

1. Start both backend and frontend
2. Register or login as Customer and Driver in different browsers
3. Create a chat session
4. Test messaging, voice messages, and quick questions

## 📚 Key Features Explained

### Direct Chat Sessions
- Sessions are created directly between customer and driver
- No ride dependency required
- Session identified by unique `sessionId`

### Quick Questions
- Admin configures questions with multiple answer options
- Customer taps a question
- Driver sees suggested answers in a modal
- Selected answer is sent as a message

### Text-to-Speech (Driver)
- Speaker icon appears next to incoming messages
- Clicking reads message aloud
- Useful for hands-free operation while driving

### Voice Messaging
- Press and hold microphone button to record
- Release to send
- Audio stored on server
- Playback in chat interface

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /F /PID <PID>

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify network connectivity for Atlas

### Socket Connection Failed
- Verify `VITE_SOCKET_URL` matches backend URL
- Check CORS configuration in backend
- Ensure JWT token is being sent

## 📄 License

ISC

## 👥 Support

For issues and questions, create an issue in the repository.

---

**Built with ❤️ for seamless communication**
