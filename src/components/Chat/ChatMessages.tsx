import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import type { AppChatMessage } from '../../utils/webContainer';

interface ChatMessagesProps {
  messages: AppChatMessage[];
  streamingMessage?: string;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, streamingMessage }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const getBubbleStyle = (role: 'user' | 'assistant') => ({
    p: 1.5,
    mb: 1,
    borderRadius: '10px',
    maxWidth: '80%',
    wordWrap: 'break-word' ,
    bgcolor: role === 'user' ? 'primary.main' : 'background.paper',
    color: role === 'user' ? 'primary.contrastText' : 'text.primary',
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    boxShadow: 1,
  });

  return (
    <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', pr:0.5 }}>
      {messages.map((msg) => (
        <Paper key={msg.id} elevation={0} sx={getBubbleStyle(msg.role)}>
            <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                {msg.type && msg.type !== 'text' && <Typography variant="caption" display="block" sx={{opacity: 0.7}}>[{msg.type.toUpperCase()}]</Typography>}
                {msg.content}
            </Typography>
        </Paper>
      ))}
      {streamingMessage && (
        <Paper elevation={0} sx={getBubbleStyle('assistant')}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap', flexGrow: 1}}>
                {streamingMessage}
            </Typography>
          </Box>
        </Paper>
      )}
      <div ref={endOfMessagesRef} />
    </Box>
  );
};

export default ChatMessages;