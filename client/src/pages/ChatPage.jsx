import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent, useSocket } from '../context/SocketContext';
import { useChatStore } from '../store/useChatStore';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Search, Send, FileImage, MoreVertical, MessageSquare, Plus } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as messageService from '../services/message.service';

export const ChatPage = () => {
  const { friendshipId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { activeConversationId, setActiveConversationId, typingUsers } = useChatStore();
  const { addToast } = useNotification();
  const qc = useQueryClient();
  
  const [msgInput, setMsgInput] = useState('');
  const bottomRef = useRef(null);

  // Sync route param with store and mark as read
  useEffect(() => {
    if (friendshipId && activeConversationId !== friendshipId) {
      setActiveConversationId(friendshipId);
    }
    
    // Always mark as read when opening or viewing the chat
    if (friendshipId && socket) {
      socket.emit('message:read', { friendshipId });
      
      // Optimistically clear the unread count in conversations query
      qc.setQueryData(['conversations'], (old) => {
        if (!old || !old.data?.conversations) return old;
        return {
          ...old,
          data: {
            ...old.data,
            conversations: old.data.conversations.map((c) => 
              c.friendshipId === friendshipId ? { ...c, unreadCount: 0 } : c
            )
          }
        };
      });
    }
  }, [friendshipId, activeConversationId, setActiveConversationId, socket, qc]);

  // Fetch conversations (left sidebar)
  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messageService.getConversations(),
  });
  const conversations = convData?.data?.conversations || [];

  // Fetch messages for active conversation
  const { data: msgData, isLoading: msgLoading } = useQuery({
    queryKey: ['messages', friendshipId],
    queryFn: () => messageService.getMessages(friendshipId, { limit: 100 }),
    enabled: !!friendshipId,
  });
  const messages = msgData?.data?.messages || [];

  const sendMessageMutation = useMutation({
    mutationFn: (data) => messageService.sendMessage(friendshipId, data),
  });

  // Handle Socket Events
  useSocketEvent('message:received', ({ message, friendshipId: fId }) => {
    if (fId === friendshipId) {
      // Append to active chat
      qc.setQueryData(['messages', friendshipId], (old) => {
        if (!old) return old;
        return { ...old, data: { ...old.data, messages: [...old.data.messages, message] } };
      });
      // Mark as read in background if we are currently looking at it
      socket?.emit('message:read', { friendshipId: fId });
    }
    
    // Always update lastMessage and unread count in conversations list
    qc.setQueryData(['conversations'], (old) => {
      if (!old || !old.data?.conversations) return old;
      const updatedList = old.data.conversations.map(c => {
        if (c.friendshipId === fId) {
          return { 
            ...c, 
            lastMessage: message,
            unreadCount: fId === friendshipId ? 0 : (c.unreadCount || 0) + 1
          };
        }
        return c;
      });
      return { ...old, data: { ...old.data, conversations: updatedList } };
    });
  }, [friendshipId, socket, qc]);

  // Handle read receipt updates
  useSocketEvent('message:read', ({ friendshipId: fId }) => {
    qc.setQueryData(['conversations'], (old) => {
      if (!old || !old.data?.conversations) return old;
      return {
        ...old,
        data: {
          ...old.data,
          conversations: old.data.conversations.map(c => c.friendshipId === fId ? { ...c, unreadCount: 0 } : c)
        }
      };
    });
  }, [qc]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!msgInput.trim() || !friendshipId) return;

    const newMsg = {
      content: msgInput,
      type: 'text',
    };

    // If socket is connected, emit it. Standard architecture usually falls back to REST
    // but in this app we send via REST mutation and let socket echo back or optimism handles it.
    // For realism, let's乐观地 add it, then call REST mutate.
    const tempId = Date.now().toString();
    const optimisticMessage = { _id: tempId, content: msgInput, senderId: user._id, createdAt: new Date().toISOString() };
    
    qc.setQueryData(['messages', friendshipId], (old) => {
      if (!old) return old;
      return { ...old, data: { ...old.data, messages: [...old.data.messages, optimisticMessage] } };
    });

    // Also update conversations list optimistically 
    qc.setQueryData(['conversations'], (old) => {
      if (!old || !old.data?.conversations) return old;
      return {
        ...old,
        data: {
          ...old.data,
          conversations: old.data.conversations.map(c => 
            c.friendshipId === friendshipId 
              ? { ...c, lastMessage: { content: msgInput, createdAt: new Date().toISOString() } } 
              : c
          )
        }
      };
    });

    sendMessageMutation.mutate(newMsg);
    setMsgInput('');
    socket?.emit('user:stopTyping', { friendshipId });
  };

  const handleTyping = (e) => {
    setMsgInput(e.target.value);
    if (!socket || !friendshipId) return;
    
    if (e.target.value.length === 1) {
      socket.emit('user:typing', { friendshipId });
    } else if (e.target.value.length === 0) {
      socket.emit('user:stopTyping', { friendshipId });
    }
  };

  return (
    <div className="h-full flex bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
      {/* Sidebar - Conversations */}
      <div className={`${friendshipId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-surface-200 bg-surface-50/50 shrink-0`}>
        <div className="p-4 border-b border-surface-200 bg-white flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-surface-900">Chats</h2>
          <button 
            onClick={() => navigate('/friends')} 
            className="p-2 bg-primary-50 text-primary-600 rounded-full hover:bg-primary-100 transition-colors"
            title="Start New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full bg-white border border-surface-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {conversations.map(conv => {
            const partner = conv.friend || {};
            const recent = conv.lastMessage || {};
            const initials = partner.username ? partner.username.substring(0, 2).toUpperCase() : '?';

            return (
              <div 
                key={conv.friendshipId}
                onClick={() => navigate(`/chat/${conv.friendshipId}`)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors mb-1
                  ${friendshipId === conv.friendshipId ? 'bg-primary-50 border border-primary-100' : 'hover:bg-surface-100 hover:border-surface-200 border border-transparent'}
                `}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 overflow-hidden">
                    {partner.profilePicture ? (
                      <img src={partner.profilePicture} alt={partner.username} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className="font-semibold text-surface-900 truncate">{partner.username || 'Unknown User'}</h4>
                    <span className="text-xs text-surface-400 shrink-0">
                      {recent.createdAt ? new Date(recent.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-surface-500 truncate">{recent.content || 'Start a conversation'}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {conv.unreadCount}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      {friendshipId ? (
        <div className="flex-1 flex flex-col min-w-0 bg-white relative">
          {/* Header */}
          <div className="h-16 border-b border-surface-200 flex items-center justify-between px-6 shrink-0 bg-white/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <button 
                className="md:hidden text-surface-500 hover:text-surface-900 mr-2"
                onClick={() => navigate('/chat')}
              >
                &larr;
              </button>
              <Link 
                to={`/users/${conversations.find(c => c.friendshipId === friendshipId)?.friend?._id}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 overflow-hidden">
                  {conversations.find(c => c.friendshipId === friendshipId)?.friend?.profilePicture ? (
                    <img src={conversations.find(c => c.friendshipId === friendshipId)?.friend?.profilePicture} className="w-full h-full object-cover" />
                  ) : (
                    conversations.find(c => c.friendshipId === friendshipId)?.friend?.username?.substring(0, 2).toUpperCase() || '?'
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-surface-900 leading-tight">
                    {conversations.find(c => c.friendshipId === friendshipId)?.friend?.username || 'Unknown'}
                  </h3>
                  <p className="text-xs text-green-600 font-medium">Online</p>
                </div>
              </Link>
            </div>
            <button 
              onClick={() => addToast('More options coming soon!', 'info')}
              className="text-surface-400 hover:text-surface-700 p-2 rounded-lg hover:bg-surface-100"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-50/30">
            <div className="text-center">
              <span className="text-xs font-medium text-surface-400 bg-surface-100 px-3 py-1 rounded-full">Today</span>
            </div>
            
            {messages.map((msg, i) => {
              const sender = msg.senderId || msg.sender;
              const isMine = sender === user._id;
              
              return (
                <div key={msg._id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isMine ? 'order-2' : 'order-1'}`}>
                    <div 
                      className={`px-4 py-2.5 rounded-2xl ${
                        isMine 
                          ? 'bg-primary-600 text-white rounded-br-sm' 
                          : 'bg-white border border-surface-200 text-surface-900 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      <p className="text-[15px] leading-relaxed break-words">{msg.content}</p>
                    </div>
                    <p className={`text-[10px] text-surface-400 mt-1 font-medium ${isMine ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMine && <span className="ml-1 text-primary-500">✓✓</span>}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {typingUsers[friendshipId] && (
              <div className="flex justify-start">
                <div className="bg-white border border-surface-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5 w-16 h-10">
                  <span className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={bottomRef} className="h-1" />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-4 border-t border-surface-200 bg-white shrink-0">
            <div className="flex items-end gap-2 bg-surface-50 border border-surface-200 rounded-xl focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all p-1.5">
              <button 
                type="button" 
                onClick={() => addToast('Image uploads coming soon!', 'info')}
                className="p-2.5 text-surface-400 hover:text-primary-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-surface-200 shadow-sm shrink-0"
              >
                <FileImage className="w-5 h-5" />
              </button>
              
              <textarea 
                rows="1"
                placeholder="Write a message..."
                className="flex-1 max-h-32 bg-transparent border-none focus:ring-0 resize-none py-2.5 px-2 text-[15px] text-surface-900 placeholder-surface-400"
                value={msgInput}
                onChange={handleTyping}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              
              <button 
                type="submit" 
                disabled={!msgInput.trim()}
                className="p-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-surface-200 disabled:text-surface-400 transition-colors shrink-0 shadow-sm"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-surface-50/50">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-surface-200 mb-6 relative">
            <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-20"></div>
            <MessageSquare className="w-8 h-8 text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-surface-900 mb-2">Your Messages</h2>
          <p className="text-surface-500 mb-6 text-center max-w-sm">Select a conversation from the sidebar or find a friend to start chatting.</p>
          <button 
            onClick={() => navigate('/friends')} 
            className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            Find Friends
          </button>
        </div>
      )}
    </div>
  );
};
