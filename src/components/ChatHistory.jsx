import React from 'react';
import ChatMessage from './ChatMessage';
import { Clock } from 'lucide-react';

const ChatHistory = ({ messages, isWaiting, lobbyConfig, setPlusMenuOpen, messagesEndRef }) => {
  return (
    <div className="chat-history" onClick={() => setPlusMenuOpen(false)}>
      {messages.length === 0 && (
        <div className="empty-state">
          <p>Reality initialized. What is your first move?</p>
        </div>
      )}
      
      {messages.map((msg, index) => (
        <ChatMessage key={index} message={{...msg, sender: msg.role === 'user' ? msg.sender : 'Game Master'}} />
      ))}
      {isWaiting && (
        <div className="chat-message assistant">
          <span className="message-role">System</span>
          <div className="message-content" style={{ opacity: 0.7 }}>
            <Clock size={16} style={{display:'inline', marginRight:'5px'}}/> 
            {lobbyConfig.mode === 'multi' ? 'Waiting for other players to submit actions...' : 'Game Master is resolving your action...'}
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatHistory;
