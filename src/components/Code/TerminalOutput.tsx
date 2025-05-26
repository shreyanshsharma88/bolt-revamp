import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

interface TerminalOutputProps {
  output: string[];
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({ output }) => {
  const endOfOutputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfOutputRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        bgcolor: 'rgba(0,0,0,0.85)', // Darker terminal background
        color: '#f0f0f0',
        fontFamily: '"Fira Code", "Consolas", monospace',
        fontSize: '0.8rem',
        overflowY: 'auto',
        p: 1,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        borderRadius: 1,
      }}
    >
      {output.map((line, index) => (
        <Typography key={index} component="div" sx={{fontFamily: 'inherit', fontSize: 'inherit', color: line.startsWith('WC_ERROR:') ? 'error.light' : line.startsWith('WC_INFO:') ? 'info.light' : 'inherit' }}>
          {`> ${line}`}
        </Typography>
      ))}
      <div ref={endOfOutputRef} />
    </Box>
  );
};

export default TerminalOutput;