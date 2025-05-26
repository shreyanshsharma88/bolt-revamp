import React from 'react';
import { List, ListItem, ListItemButton, ListItemText, Typography, Box } from '@mui/material';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import type { AppFile } from '../../utils/webContainer';

interface FileExplorerProps {
  files: AppFile[];
  onFileSelect: (path: string) => void;
  activeFilePath: string | null;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, onFileSelect, activeFilePath }) => {
  if (files.length === 0) {
    return <Typography variant="body2" color="textSecondary" sx={{p:1}}>No files yet.</Typography>;
  }
  return (
    <Box sx={{ flexGrow: 1, overflowY: 'auto', borderTop: '1px solid rgba(255,255,255,0.12)', mt:1 }}>
        <List dense disablePadding>
        {files.map((file) => (
            <ListItem key={file.path} disablePadding sx={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
            <ListItemButton
                selected={activeFilePath === file.path}
                onClick={() => onFileSelect(file.path)}
            >
                <InsertDriveFileOutlinedIcon sx={{ mr: 1, fontSize: 16 }} />
                <ListItemText primary={file.path.split('/').pop()} secondary={file.path} primaryTypographyProps={{fontSize:'0.875rem'}} secondaryTypographyProps={{fontSize:'0.75rem'}}/>
            </ListItemButton>
            </ListItem>
        ))}
        </List>
    </Box>
  );
};

export default FileExplorer;