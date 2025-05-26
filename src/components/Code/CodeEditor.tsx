import React, { useRef, useEffect } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import { Box } from '@mui/material';
import { Loader } from '../LoaderModal';

interface CodeEditorProps {
  filePath?: string | null; // Optional, for display or determining language
  initialContent: string;
  onContentChange: (path: string, newContent: string) => void;
}

const CodeEditorComponent: React.FC<CodeEditorProps> = ({
  filePath,
  initialContent,
  onContentChange,
}) => {
  const monacoRef = useRef<Monaco | null>(null);

  // Debounce changes to avoid excessive updates
  const handleChange = (value: string | undefined) => {
    if (filePath && value !== undefined) {
      onContentChange(filePath, value);
    }
  };

  // Determine language from file path
  const getLanguage = (path?: string | null): string => {
    if (!path) return 'plaintext';
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js': case 'jsx': return 'javascript';
      case 'ts': case 'tsx': return 'typescript';
      case 'json': return 'json';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'md': return 'markdown';
      case 'py': return 'python';
      case 'java': return 'java';
      case 'scss': return 'scss';
      case 'yaml': case 'yml': return 'yaml';
      default: return 'plaintext';
    }
  };

  const language = getLanguage(filePath);

  useEffect(() => {
    // You can do things with the Monaco instance here if needed
    // e.g., monacoRef.current?.editor.getModels()[0].setValue(initialContent)
    // but usually the `value` prop handles updates.
  }, [initialContent]);


  return (
    <Box sx={{ height: '100%', width: '100%', border: '1px solid rgba(255,255,255,0.12)', borderRadius:1 }}>
      <Editor
        height="100%" // Editor will fill the parent Box
        language={language}
        value={initialContent}
        onChange={handleChange}
        onMount={(editor, monacoInstance) => {
          monacoRef.current = monacoInstance;
          // You can configure editor options here, e.g.
          // editor.updateOptions({ minimap: { enabled: false } });
        }}
        theme="vs-dark" // Matches MUI dark theme preference
        loading={<Loader  />}
        options={{
          selectOnLineNumbers: true,
          automaticLayout: true, // Important for responsive resizing
          wordWrap: 'on',
          minimap: { enabled: true },
        }}
      />
    </Box>
  );
};

export default CodeEditorComponent;