import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (phone, password) => api.post('/auth/login', { phone, password }),
    register: (data) => api.post('/auth/register', data),
    getProfile: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
};

export const chatAPI = {
    createChatSession: (driverId) => api.post('/chat/create', { driverId }),
    getUserChatSessions: () => api.get('/chat/list'),
    getChatHistory: (sessionId, limit = 100) =>
        api.get(`/chat/history/${sessionId}?limit=${limit}`),
    getChatSession: (sessionId) => api.get(`/chat/session/${sessionId}`),
    getUnreadCount: (sessionId) => api.get(`/chat/unread/${sessionId}`),
    markAsRead: (sessionId) => api.post(`/chat/mark-read/${sessionId}`),
    uploadVoice: (formData) =>
        api.post('/chat/upload-voice', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    searchMessages: (sessionId, query) =>
        api.get(`/chat/search/${sessionId}?q=${query}`),
};

export const questionAPI = {
    getActiveQuestions: () => api.get('/admin/questions/active'),
};

export default api;
