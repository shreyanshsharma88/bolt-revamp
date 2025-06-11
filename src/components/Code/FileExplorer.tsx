import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Collapse,
} from '@mui/material';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import type { AppFile } from '../../utils/webContainer';

interface FileExplorerProps {
  files: AppFile[];
  onFileSelect: (path: string) => void;
  activeFilePath: string | null;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, onFileSelect, activeFilePath }) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  if (files.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary" sx={{ p: 1 }}>
        No files yet.
      </Typography>
    );
  }

  // Group files by parent directory
  const grouped: Record<string, AppFile[]> = {};
  files.forEach((file) => {
    const [folder] = file.path.split('/');
    if (!grouped[folder]) grouped[folder] = [];
    grouped[folder].push(file);
  });

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folder]: !prev[folder],
    }));
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        mt: 1,
      }}
    >
      <List dense disablePadding>
        {Object.entries(grouped).map(([folder, folderFiles]) => (
          <React.Fragment key={folder}>
            <ListItem disablePadding>
              <ListItemButton onClick={() => toggleFolder(folder)}>
                {expandedFolders[folder] ? (
                  <FolderOpenIcon sx={{ mr: 1, fontSize: 16 }} />
                ) : (
                  <FolderOutlinedIcon sx={{ mr: 1, fontSize: 16 }} />
                )}
                <ListItemText
                  primary={folder}
                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                />
              </ListItemButton>
            </ListItem>

            <Collapse in={expandedFolders[folder]} timeout="auto" unmountOnExit>
              <List dense disablePadding>
                {folderFiles.map((file) => (
                  <ListItem
                    key={file.path}
                    disablePadding
                    sx={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      pl: 4, // Indent child files
                    }}
                  >
                    <ListItemButton
                      selected={activeFilePath === file.path}
                      onClick={() => onFileSelect(file.path)}
                    >
                      <InsertDriveFileOutlinedIcon sx={{ mr: 1, fontSize: 16 }} />
                      <ListItemText
                        primary={file.path.split('/').pop()}
                        secondary={file.path}
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default FileExplorer;
