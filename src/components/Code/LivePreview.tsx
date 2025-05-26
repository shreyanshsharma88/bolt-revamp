import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

interface LivePreviewProps {
  url: string | null;
  isLoading?: boolean;
}

const LivePreview: React.FC<LivePreviewProps> = ({ url, isLoading }) => {
  if (isLoading && !url) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column' }}>
        <CircularProgress />
        <Typography sx={{mt:1}} variant="caption">Waiting for preview server...</Typography>
      </Box>
    );
  }

  if (!url) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography color="textSecondary">Preview will appear here.</Typography>
      </Box>
    );
  }

  return (
    <iframe
      src={url}
      title="Live Preview"
      style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }} // White bg for iframes usually
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
    />
  );
};

export default LivePreview;