/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/Chat/ChatMessages.tsx
import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography, CircularProgress, type SxProps } from '@mui/material';
import type { AppChatMessage } from '../../utils/webContainer'; // Adjust import path if needed

interface ChatMessagesProps {
  messages: AppChatMessage[];
  streamingMessage?: string;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, streamingMessage }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const getBubbleStyle = (role: 'user' | 'assistant', type?: string) => ({
    p: 1.5,
    mb: 1,
    borderRadius: '10px',
    maxWidth: '80%',
    wordWrap: 'break-word' ,
    // Conditional styling for chat bubbles
    bgcolor: role === 'user' ? 'primary.main' : (type === 'command' ? 'rgba(76, 175, 80, 0.1)' : 'background.paper'), // Light green background for commands
    color: role === 'user' ? 'primary.contrastText' : (type === 'command' ? '#66BB6A' : 'text.primary'), // Green text for commands
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    boxShadow: 1,
    border: type === 'command' ? '1px solid #4CAF50' : 'none', // Optional: subtle border for commands
    background: role === 'assistant' && type !== 'command' ? 'rgba(255, 255, 255, 0.05)' : undefined, // Light glass effect for assistant text messages
    backdropFilter: role === 'assistant' && type !== 'command' ? 'blur(8px)' : undefined,
    WebkitBackdropFilter: role === 'assistant' && type !== 'command' ? 'blur(8px)' : undefined,
  });

  return (
    <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', pr:0.5 }}>
      {messages
        // Filter out internal structured logs (progress, usage, unknown_structured_data) from displaying in chat
        .filter(msg => msg.role === 'user' || (msg.type !== 'progress' && msg.type !== 'usage' && !msg.type?.startsWith('unknown_structured_data'))) 
        .map((msg) => (
        <Paper key={msg.id} elevation={0} sx={{...getBubbleStyle(msg.role, msg.type) as SxProps}}>
            <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                {/* Conditionally display type prefix for specific message types */}
                {msg.type && ['file_action', 'command', 'project_info'].includes(msg.type) && (
                    <Typography variant="caption" display="block" sx={{opacity: 0.7, mb: 0.5}}>
                        [{msg.type.replace(/_/g, ' ').toUpperCase()}]
                    </Typography>
                )}
                {/* Display content based on message type */}
                {msg.type === 'command' ? (
                    <Box component="pre" sx={{backgroundColor: 'rgba(0,0,0,0.1)', p: 1, borderRadius: '5px', overflowX: 'auto', color: 'inherit'}}>
                        <Typography component="code" variant="body2" sx={{color: 'inherit'}}>
                            $ {msg.content}
                        </Typography>
                    </Box>
                ) : (
                    msg.content
                )}
            </Typography>
        </Paper>
      ))}
      {streamingMessage && (
        <Paper elevation={0} sx={getBubbleStyle('assistant') as SxProps}>
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