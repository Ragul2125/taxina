import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';
import { chatAPI, questionAPI } from '../services/api';

export default function ChatRoom() {
    const { sessionId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [questions, setQuestions] = useState([]);
    const [chatSession, setChatSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [recording, setRecording] = useState(false);
    const [showQuestions, setShowQuestions] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        loadChatData();
        setupSocketListeners();

        return () => {
            socketService.leaveChat(sessionId);
            socketService.removeAllListeners('new_message');
            socketService.removeAllListeners('typing');
            socketService.removeAllListeners('customer_asked_question');
            socketService.removeAllListeners('answer_received');
            socketService.removeAllListeners('admin_questions');
        };
    }, [sessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadChatData = async () => {
        try {
            const [chatRes, chatSessionRes, questionsRes] = await Promise.all([
                chatAPI.getChatHistory(sessionId),
                chatAPI.getChatSession(sessionId),
                questionAPI.getActiveQuestions(),
            ]);

            setMessages(chatRes.data.data.messages || []);
            setChatSession(chatSessionRes.data.data);
            setQuestions(questionsRes.data.data || []);

            socketService.joinChat(sessionId);
            setLoading(false);
        } catch (error) {
            console.error('Error loading chat:', error);
            setLoading(false);
        }
    };

    const setupSocketListeners = () => {
        socketService.on('new_message', (message) => {
            setMessages((prev) => [...prev, message]);
            if (message.senderId._id !== user._id) {
                playNotificationSound();
            }
        });

        socketService.on('typing', ({ userId, isTyping: typing }) => {
            if (userId !== user._id) {
                setIsTyping(typing);
            }
        });

        socketService.on('customer_asked_question', ({ question, askedBy }) => {
            if (user.role === 'DRIVER') {
                setSelectedQuestion({ ...question, _id: question.questionId });
            }
        });

        socketService.on('answer_received', ({ question, answer, from }) => {
            // Check if answer already added by message listener (it should be)
            // But just in case, we rely on 'new_message' for persistence.
            // This might be for instant UI update if 'new_message' lags?
            // Actually, backend should send 'new_message' for the answer.
        });

        socketService.on('admin_questions', ({ questions: qs }) => {
            setQuestions(qs);
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const playNotificationSound = () => {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => { });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            chatSessionId: sessionId,
            type: 'TEXT',
            text: newMessage.trim(),
        };

        socketService.sendMessage(messageData);
        setNewMessage('');
        socketService.sendTyping(sessionId, false);
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        socketService.sendTyping(sessionId, true);

        typingTimeoutRef.current = setTimeout(() => {
            socketService.sendTyping(sessionId, false);
        }, 1000);
    };

    const handleQuestionTap = (question) => {
        socketService.tapQuestion(sessionId, question._id);
        setShowQuestions(false);

        // Optimistic UI update or wait for socket 'new_message'?
        // Let's perform optimistic update for better UX?
        // Actually, let's wait for socket echo to ensure consistency.
        // But for "Question Tapped" event, does it create a message?
        // The plan says "On clicking a question, send it as a message."
        // So backend should handle it.

        // Let's manually trigger a "Question Message" via socket if backend doesn't automatically do it from tap implementation.
        // Looking at backend plan: "Add Logic to handle 'Question' messages."
        // And frontend: "When a 'Question' message is received..."

        // We will send it as a message type 'QUESTION'
        const messageData = {
            chatSessionId: sessionId,
            type: 'QUESTION',
            text: question.questionText,
            questionId: question._id
        };
        socketService.sendMessage(messageData);
    };

    const handleAnswerSelect = (answer) => {
        if (selectedQuestion) {
            // Send answer as message
            const messageData = {
                chatSessionId: sessionId,
                type: 'ANSWER',
                text: answer,
                questionId: selectedQuestion._id,
                // We might want to link to original question message if needed
            };
            socketService.sendMessage(messageData);

            // Also emit event if needed for specific logic
            socketService.selectAnswer(sessionId, selectedQuestion._id, answer);
            setSelectedQuestion(null);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await uploadVoiceMessage(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    const uploadVoiceMessage = async (audioBlob) => {
        try {
            const formData = new FormData();
            formData.append('voice', audioBlob, 'voice.webm');
            formData.append('chatSessionId', sessionId);

            const response = await chatAPI.uploadVoice(formData);
            const { voiceUrl, duration } = response.data.data;

            const messageData = {
                chatSessionId: sessionId,
                type: 'VOICE',
                voiceUrl,
                voiceDuration: duration,
            };

            socketService.sendMessage(messageData);
        } catch (error) {
            console.error('Error uploading voice:', error);
            alert('Failed to send voice message');
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const speakMessage = (text) => {
        if (!text) return;

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop any previous speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US'; // Default language
            window.speechSynthesis.speak(utterance);
        } else {
            alert('Text-to-Speech not supported in this browser.');
        }
    };

    const getOtherUser = () => {
        if (!chatSession) return null;
        return user.role === 'CUSTOMER' ? chatSession.driverId : chatSession.passengerId;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const otherUser = getOtherUser();

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => navigate(user.role === 'DRIVER' ? '/driver' : '/customer')}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {otherUser?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-800">{otherUser?.name}</h2>
                        <p className="text-xs text-green-500 font-medium">
                            Online
                        </p>
                    </div>
                </div>
                {user.role === 'CUSTOMER' && (
                    <button
                        onClick={() => setShowQuestions(!showQuestions)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-700 transition shadow-md"
                    >
                        Quick Questions
                    </button>
                )}
            </div>

            {/* Quick Questions Modal */}
            {showQuestions && (
                <div className="absolute inset-x-0 top-16 z-20 px-4">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 max-w-md mx-auto animate-fade-in-down">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Suggested Questions</h3>
                            <button onClick={() => setShowQuestions(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {questions.map((q) => (
                                <button
                                    key={q._id}
                                    onClick={() => handleQuestionTap(q)}
                                    className="text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition text-sm font-medium"
                                >
                                    {q.questionText}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Answer Selection Modal (Driver) */}
            {selectedQuestion && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-scale-in">
                        <div className="text-center mb-6">
                            <span className="inline-block p-3 bg-blue-100 rounded-full mb-3">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </span>
                            <h3 className="text-xl font-bold text-gray-900">Customer Asked</h3>
                            <p className="text-lg text-blue-600 font-medium mt-1">{selectedQuestion.questionText}</p>
                        </div>

                        <div className="space-y-3">
                            {selectedQuestion.answers.map((answer, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerSelect(answer)}
                                    className="w-full text-left px-5 py-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl transition group"
                                >
                                    <span className="font-medium text-gray-700 group-hover:text-blue-700">{answer}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setSelectedQuestion(null)}
                            className="mt-6 w-full text-gray-500 hover:text-gray-700 py-2 text-sm font-medium transition"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-100">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                )}
                {messages.map((msg, index) => {
                    const isOwn = msg.senderId?._id === user._id || msg.senderRole === user.role;
                    const showAvatar = !isOwn && (index === 0 || messages[index - 1].senderId?._id !== msg.senderId?._id);

                    return (
                        <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
                            {!isOwn && (
                                <div className={`w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                                    {msg.senderId?.name?.[0].toUpperCase()}
                                </div>
                            )}

                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${isOwn
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white text-gray-800 rounded-bl-none'
                                } ${msg.type === 'QUESTION' ? 'border-2 border-indigo-300' : ''}`}>

                                {msg.type === 'TEXT' && <p className="leading-relaxed">{msg.text}</p>}

                                {msg.type === 'VOICE' && (
                                    <div className="flex items-center space-x-2 min-w-[200px]">
                                        <audio controls className="w-full h-8">
                                            <source src={`${import.meta.env.VITE_API_URL}${msg.voiceUrl}`} type="audio/webm" />
                                        </audio>
                                    </div>
                                )}

                                {msg.type === 'QUESTION' && (
                                    <div className="flex items-start space-x-2">
                                        <span className="text-2xl">❓</span>
                                        <div>
                                            <p className="font-medium text-sm text-indigo-200 mb-1 uppercase tracking-wider">Question</p>
                                            <p className="font-medium text-lg">{msg.text || msg.questionText}</p>
                                        </div>
                                    </div>
                                )}

                                {msg.type === 'ANSWER' && (
                                    <div>
                                        <div className="mb-2 pb-2 border-b border-opacity-20 border-white">
                                            <p className="text-xs opacity-75">Replying to:</p>
                                            <p className="italic text-sm opacity-90">{msg.questionText || "Question"}</p>
                                        </div>
                                        <p className="font-medium">{msg.text || msg.answerText}</p>
                                    </div>
                                )}

                                <p className={`text-[10px] text-right mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {formatTime(msg.createdAt)}
                                </p>
                            </div>

                            {/* Text-to-Speech for Driver (Incoming messages only) */}
                            {user.role === 'DRIVER' && !isOwn && (msg.type === 'TEXT' || msg.type === 'QUESTION' || msg.type === 'ANSWER') && (
                                <button
                                    onClick={() => speakMessage(msg.text || msg.questionText || msg.answerText)}
                                    className="p-2 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 hover:text-gray-800 transition flex-shrink-0 self-center"
                                    title="Read aloud"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    );
                })}

                {isTyping && (
                    <div className="flex justify-start items-end space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0"></div>
                        <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-200 px-4 py-4">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2 max-w-4xl mx-auto">
                    <button
                        type="button"
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        className={`p-3 rounded-full transition-all duration-200 ${recording
                            ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </button>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={handleTyping}
                            placeholder="Type your message..."
                            className="w-full px-5 py-3 bg-gray-100 border-none rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800 placeholder-gray-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition shadow-lg disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transform active:scale-95"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </form>
                {recording && (
                    <p className="text-center text-xs font-semibold text-red-500 mt-2 animate-pulse uppercase tracking-wide">Recording Audio...</p>
                )}
            </div>
        </div >
    );
}
