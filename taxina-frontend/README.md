# Taxina Chat Frontend

A modern, real-time chat application for customers and drivers built with React, Socket.io, and Tailwind CSS.

## Features

### Customer Features
- ✅ View active rides
- ✅ Real-time chat with driver
- ✅ Quick questions (tap to ask)
- ✅ Text messaging
- ✅ Voice messaging (record & send)
- ✅ Typing indicators
- ✅ Message history

### Driver Features
- ✅ View assigned rides
- ✅ Start/End rides
- ✅ Real-time chat with customer
- ✅ Receive question notifications
- ✅ Select answers from predefined options
- ✅ Text messaging
- ✅ Voice messaging

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client
- **Tailwind CSS** - Styling

## Getting Started

### Prerequisites

- Node.js 16+ installed
- Backend server running on `http://localhost:5000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Usage

### Login

Use these demo accounts:

**Customer:**
- Phone: `1111111111`
- Password: `password123`

**Driver:**
- Phone: `3333333333`
- Password: `password123`

### Customer Flow

1. Login as customer
2. View active rides on dashboard
3. Click "Chat" to open chat room
4. Tap "Quick Questions" to ask predefined questions
5. Send text or voice messages
6. Receive driver responses in real-time

### Driver Flow

1. Login as driver
2. View assigned rides
3. Start ride when ready
4. Click "Chat with Customer" to open chat
5. Receive question notifications
6. Select answers from options
7. Send text or voice messages
8. End ride when complete

## Project Structure

```
src/
├── components/
│   └── ProtectedRoute.jsx    # Route protection
├── context/
│   └── AuthContext.jsx        # Authentication state
├── pages/
│   ├── Login.jsx              # Login page
│   ├── Register.jsx           # Registration page
│   ├── CustomerDashboard.jsx  # Customer dashboard
│   ├── DriverDashboard.jsx    # Driver dashboard
│   └── ChatRoom.jsx           # Chat interface
├── services/
│   ├── api.js                 # API client
│   └── socket.js              # Socket.io client
├── App.jsx                    # Main app with routing
├── main.jsx                   # Entry point
└── index.css                  # Global styles
```

## Features in Detail

### Real-time Chat
- Messages delivered instantly via WebSocket
- Typing indicators
- Read receipts
- Message history

### Voice Messaging
- Press and hold microphone button to record
- Release to send
- Audio playback in chat
- Supports WebM format

### Quick Questions (Customer)
- Tap button to view predefined questions
- Select question to send to driver
- Driver receives notification
- Driver selects answer from options
- Answer sent back to customer

### Ride Management (Driver)
- View all assigned rides
- Start ride button (BOOKED → STARTED)
- End ride button (STARTED → ENDED)
- Chat available during BOOKED and STARTED states

## API Integration

The frontend connects to the backend API at `http://localhost:5000/api`

### Endpoints Used

**Authentication:**
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `POST /api/auth/logout`

**Rides:**
- `GET /api/rides/user/active`
- `GET /api/rides/:id`
- `POST /api/rides/start`
- `POST /api/rides/end`

**Chat:**
- `GET /api/chat/history/:rideId`
- `GET /api/chat/session/:rideId`
- `POST /api/chat/upload-voice`

**Questions:**
- `GET /api/admin/questions/active`

### WebSocket Events

**Emitted:**
- `join_ride` - Join ride room
- `leave_ride` - Leave ride room
- `send_message` - Send message
- `typing` - Typing indicator
- `question_tapped` - Customer taps question
- `answer_selected` - Driver selects answer
- `get_admin_questions` - Request questions

**Received:**
- `new_message` - New message received
- `typing` - Other user typing
- `question_tapped` - Question notification (driver)
- `answer_received` - Answer received (customer)
- `admin_questions` - Questions list

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

## Troubleshooting

### Cannot connect to backend
- Ensure backend is running on port 5000
- Check `.env` file has correct URLs
- Verify CORS is enabled on backend

### Voice messages not working
- Allow microphone access in browser
- Check browser supports MediaRecorder API
- Ensure backend `/uploads` directory exists

### Socket connection fails
- Check backend Socket.io is running
- Verify token is valid
- Check browser console for errors

## License

MIT
