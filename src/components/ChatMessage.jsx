import React from 'react';

const ChatMessage = ({ message }) => {
  const isPlayer = message.role === 'user';
  
  return (
    <div className={`chat-message ${isPlayer ? 'user' : 'assistant'}`}>
      <span className="message-role">{message.sender || (isPlayer ? 'Player' : 'Game Master')}</span>
      <div className="message-content">
        {message.content}
      </div>
    </div>
  );
};

export default ChatMessage;
