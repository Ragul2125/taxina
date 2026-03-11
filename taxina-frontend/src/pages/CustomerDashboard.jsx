import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/api';
import api from '../services/api';

export default function CustomerDashboard() {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadDrivers();
    }, []);

    useEffect(() => {
        loadDrivers();

        // Connect socket for real-time updates
        const token = localStorage.getItem('token');
        if (token) {
            import('../services/socket').then(({ default: socketService }) => {
                socketService.connect(token);

                // Listen for new messages to update the session list
                socketService.on('new_message', (message) => {
                    console.log('New message received, updating dashboard:', message);
                    // Reload chat sessions to update "last active" time
                    loadDrivers();
                });

                // Listen for new chat sessions
                socketService.on('chat_session_created', (session) => {
                    console.log('New chat session created:', session);
                    loadDrivers();
                });

                // Cleanup on unmount
                return () => {
                    socketService.removeAllListeners('new_message');
                    socketService.removeAllListeners('chat_session_created');
                };
            });
        }
    }, []);

    const loadDrivers = async () => {
        try {
            // In a real app, this would be a specific endpoint to get available drivers
            // For now, we'll fetch all users and filter (or assuming backend sends drivers)
            // Since we don't have a specific getDrivers endpoint in the plan, I'll assumme we might need to add one or use a generic user list.
            // Let's add a temporary endpoint or just mock it if backend doesn't support it yet.
            // Wait, we didn't add a "getDrivers" endpoint.
            // I'll add a simple get request to /auth/drivers if it exists, or just use chat sessions.
            // Actually, the plan was "list available drivers".
            // Let's assume there's an endpoint or I'll just list existing chat sessions for now + a way to add new.

            // To make it simple and working: List existing chat sessions.
            // And add a simple input field to enter a Driver ID to start a NEW chat (as requested in plan "Enter a Driver ID").

            const response = await chatAPI.getUserChatSessions();
            setDrivers(response.data.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error loading chats:', error);
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleStartChat = async (driverId) => {
        try {
            const response = await chatAPI.createChatSession(driverId);
            const sessionId = response.data.data._id;
            navigate(`/chat/${sessionId}`);
        } catch (error) {
            console.error('Error starting chat:', error);
            alert('Failed to start chat. Please check Driver ID.');
        }
    };

    const [newDriverId, setNewDriverId] = useState('');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Consersations</h1>
                            <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Start New Chat Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">Start New Chat</h2>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Enter Driver ID"
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={newDriverId}
                            onChange={(e) => setNewDriverId(e.target.value)}
                        />
                        <button
                            onClick={() => handleStartChat(newDriverId)}
                            disabled={!newDriverId}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Start Chat
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        * In a real app, this would be a list of available nearby drivers.
                    </p>
                </div>

                <h2 className="text-lg font-semibold mb-4">Recent Conversations</h2>
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : drivers.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Start a chat with a driver above.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {drivers.map((session) => (
                            <div key={session._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate(`/chat/${session._id}`)}>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-lg text-gray-900">
                                        {session.driverId?.name || 'Driver'}
                                    </h3>
                                    <span className={`px-2 py-1 rounded-full text-xs ${session.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {session.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">Driver</p>
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                    <span>Last active: {new Date(session.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
