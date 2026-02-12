import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect(token) {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.listeners.clear();
        }
    }

    joinChat(chatSessionId) {
        if (this.socket) {
            this.socket.emit('join_chat', { chatSessionId });
        }
    }

    leaveChat(chatSessionId) {
        if (this.socket) {
            this.socket.emit('leave_chat', { chatSessionId });
        }
    }

    sendMessage(data) {
        if (this.socket) {
            this.socket.emit('send_message', data);
        }
    }

    getAdminQuestions() {
        if (this.socket) {
            this.socket.emit('get_admin_questions');
        }
    }

    tapQuestion(chatSessionId, questionId) {
        if (this.socket) {
            this.socket.emit('question_tapped', { chatSessionId, questionId });
        }
    }

    selectAnswer(chatSessionId, questionId, answer) {
        if (this.socket) {
            this.socket.emit('answer_selected', { chatSessionId, questionId, answer });
        }
    }

    sendTyping(chatSessionId, isTyping) {
        if (this.socket) {
            this.socket.emit('typing', { chatSessionId, isTyping });
        }
    }

    markMessageAsRead(messageId) {
        if (this.socket) {
            this.socket.emit('message_read', { messageId });
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);

            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }
            this.listeners.get(event).push(callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);

            if (this.listeners.has(event)) {
                const callbacks = this.listeners.get(event);
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        }
    }

    removeAllListeners(event) {
        if (this.socket) {
            this.socket.removeAllListeners(event);
            this.listeners.delete(event);
        }
    }
}

export default new SocketService();
