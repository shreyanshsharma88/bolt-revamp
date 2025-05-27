/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/Chat/ChatContainer.tsx
// src/components/Chat/ChatContainer.tsx
import { Alert, Box, Grid, Paper, Stack, Typography } from "@mui/material";
import { PromptInput } from "./PromptInput";
import { Loader } from "../LoaderModal";
import { useCallback, useState, useEffect } from "react";
import { type AppChatMessage, type AppFile } from "../../utils/webContainer"; // Re-evaluate path for AppFile
import { useAppWebContainer, useChatService } from "../../hooks";
import type { ChatRequestBody, Message, StreamedData } from "../../types";
import ChatMessages from "./ChatMessages";
import FileExplorer from "../Code/FileExplorer";
import TerminalOutput from "../Code/TerminalOutput";
import CodeEditorComponent from "../Code/CodeEditor";
import LivePreview from "../Code/LivePreview";

import { v4 as uuidv4 } from 'uuid'; // For chatSessionId

import { parseBoltResponse, type BoltActionCommand } from "../../utils"; // Ensure boltActionParser.ts is correctly placed
import { determineCommands } from "../../utils/webContainer"; // This might be simplified or removed later as boltActions are explicit

export const ChatContainer = () => {
  const [chatMessages, setChatMessages] = useState<AppChatMessage[]>([]);
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState<string>('');
  // We still use currentAssistantResponseParts for live accumulation, but handleStreamEnd will use its argument.
  const [currentAssistantResponseParts, setCurrentAssistantResponseParts] = useState<string[]>([]); 

  const [projectFiles, setProjectFiles] = useState<AppFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

  const [chatSessionId] = useState(uuidv4()); // Unique ID for the chat session

  const [selectedModel, setSelectedModel] = useState<string>("agentica-org/deepcoder-14b-preview:free");
  const [selectedProvider, setSelectedProvider] = useState<string>("OpenRouter");

  const {
    webContainer,
    previewUrl,
    terminalOutput,
    isBooting: isWebContainerBooting,
    writeFile,
    runCommand,
    logToTerminal,
  } = useAppWebContainer();

  const handleStreamChunk = useCallback((data: StreamedData | string) => {
    // console.log("handleStreamChunk received data:", data); // Keep this log for detailed debugging

    if (typeof data === "string") {
      setCurrentAssistantMessage((prev) => prev + data);
      setCurrentAssistantResponseParts((prev) => [...prev, data]);
    } else { // data is StreamedData object
        const textFromStreamedData = data.text || data.message || data.summary || data.payload?.content || data.payload?.text || '';

        const logMsg = `[STREAM ${data.type.toUpperCase()}]: ${
            textFromStreamedData || JSON.stringify(data.payload)
        }`;
        logToTerminal(logMsg, "info");
        setChatMessages((prev) => [
            ...prev,
            {
                id: String(Date.now()) + Math.random(),
                role: "assistant",
                content: logMsg,
                type: data.type as any,
                data: data.payload,
            },
        ]);

        // Accumulate the actual AI response text from StreamedData objects
        // This ensures currentAssistantResponseParts gets the full LLM response for parsing.
        // We only want to accumulate actual LLM response text, not just progress/usage updates.
        // Heuristic: If it's not a known non-content type, assume it might be text.
        if (textFromStreamedData && !['progress', 'usage', 'log', 'codeContext', 'chatSummary', 'error'].includes(data.type)) {
             setCurrentAssistantMessage((prev) => prev + textFromStreamedData);
             setCurrentAssistantResponseParts((prev) => [...prev, textFromStreamedData]);
        }
      }
    },
    [logToTerminal]
  );

  // CRITICAL FIX: handleStreamEnd MUST accept the fullResponse argument from useChatService
  const handleStreamEnd = useCallback(async (fullResponse: string) => { // <--- ADD fullResponse ARGUMENT HERE
    logToTerminal('Stream ended. Full response length for parsing: ' + fullResponse.length, 'info'); // Use the argument directly
    
    // Add the full assistant response to chat messages for permanent display
    if (fullResponse.trim()) { // Use the argument directly
        setChatMessages(prev => [
        ...prev,
        { id: String(Date.now()), role: 'assistant', content: fullResponse, type: 'text' }, // Use the argument directly
        ]);
    }
    setCurrentAssistantMessage(''); // Clear live streaming display
    setCurrentAssistantResponseParts([]); // Reset accumulator for next response

    // Parse the full response for Bolt actions
    const parsedArtifacts = parseBoltResponse(fullResponse); // <--- PASS fullResponse ARGUMENT HERE

    if (parsedArtifacts.length > 0) {
      logToTerminal(`Found ${parsedArtifacts.length} bolt artifact(s). Processing...`, 'info'); 
      const allNewFiles: AppFile[] = [];
      let startCommandAction: BoltActionCommand | null = null;
      let installNeeded = false;
      let projectBasePath = ''; 

      for (const artifact of parsedArtifacts) {
        logToTerminal(`Processing artifact: ${artifact.title || artifact.id || 'Untitled'}`, 'info');
        for (const action of artifact.actions) {
          logToTerminal(`  Action: ${action.type}, Path: ${action.filePath || 'N/A'}, Content Preview: ${(action.content || "").substring(0,70)}...`, 'info');
          
          if (action.type === 'shell') {
            const parts = action.content.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
            if (parts.length > 0) {
              if ((parts[0] === 'npm' && (parts[1] === 'create-vite-app' || parts[1] === 'create')) || (parts[0] === 'npx' && parts[1] === 'create-vite-app')) {
                const appNameIndex = parts.indexOf("create-vite-app") + 1 || parts.indexOf("create") + 1;
                if (parts[appNameIndex] && !parts[appNameIndex].startsWith("--")) {
                    projectBasePath = parts[appNameIndex].replace(/["']/g, ''); 
                    logToTerminal(`Project base path identified: '${projectBasePath}' from create command.`, 'info');
                } else {
                    logToTerminal(`Could not determine app name from: ${action.content}`, "warn");
                }
              } else if (parts[0] === 'cd' && parts[1]) {
                projectBasePath = parts[1].replace(/["']/g, ''); 
                logToTerminal(`Project base path changed to: '${projectBasePath}' from 'cd' command.`, 'info');
              } else {
                const cwd = projectBasePath ? `./${projectBasePath}` : undefined;
                await runCommand(parts[0] , parts.slice(1), `shell: ${parts[0]}`, cwd);
              }
            }
          } else if (action.type === 'file' && action.filePath) {
            let finalPath = action.filePath;
            if (projectBasePath && !action.filePath.startsWith('/') && !action.filePath.startsWith(projectBasePath + '/')) {
              finalPath = `${projectBasePath}/${action.filePath}`;
            }
            await writeFile(finalPath, action.content);
            allNewFiles.push({ path: finalPath, content: action.content });
            if (finalPath.endsWith('package.json')) {
              installNeeded = true;
            }
          } else if (action.type === 'start') {
            startCommandAction = action;
          }
        }
      }

      if (allNewFiles.length > 0) {
        setProjectFiles(prev => {
          const filesMap = new Map(prev.map(f => [f.path, f]));
          allNewFiles.forEach(nf => filesMap.set(nf.path, nf));
          const updated = Array.from(filesMap.values());
           if (updated.length > 0 && (!activeFilePath || !updated.find(f=> f.path === activeFilePath))) {
            const firstNewFileInProject = updated.find(f => allNewFiles.some(newF => newF.path === f.path));
            setActiveFilePath(firstNewFileInProject?.path || updated[0]?.path || null);
          }
          return updated;
        });
      }

      const effectiveCwd = projectBasePath ? `./${projectBasePath}` : undefined; 

      if (installNeeded) {
        logToTerminal(`Running npm install ${effectiveCwd ? `in ${effectiveCwd}` : 'in root'}...`, 'info'); 
        await runCommand('npm', ['install'], 'npm install', effectiveCwd);
      }

      if (startCommandAction) {
        const commandContent = startCommandAction.content;
        const actualCommandToRun = commandContent.split('&&').map(s => s.trim()).filter(s => !s.startsWith('cd ')).join(' && '); 

        const parts = actualCommandToRun.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
        if (parts.length > 0) {
          logToTerminal(`Running start command: ${actualCommandToRun} ${effectiveCwd ? `in ${effectiveCwd}` : 'in root'}...`, 'info'); 
          await runCommand(parts[0], parts.slice(1), `start: ${parts[0]}`, effectiveCwd);
        }
      }
      if (allNewFiles.length === 0 && !startCommandAction && parsedArtifacts.length > 0) {
        logToTerminal("Artifacts parsed, but no files were written and no start command was found.", "info");
      }

    } else {
      logToTerminal("No valid bolt artifacts found in the processed response.", 'info');
    }
  }, [
    writeFile, 
    runCommand, 
    logToTerminal, 
    setProjectFiles, 
    setActiveFilePath,
    activeFilePath, 
    setChatMessages,
    setCurrentAssistantMessage,
  ]); // Removed currentAssistantResponseParts from dependencies as it's not directly used here anymore

  const handleStreamError = useCallback((error: Error) => {
    logToTerminal(`Chat stream error: ${error.message}`, 'error');
    setChatMessages(prev => [
      ...prev,
      { id: String(Date.now()), role: 'assistant', content: `Error: ${error.message}`, type: 'error' },
    ]);
    setCurrentAssistantMessage('');
  }, [logToTerminal]);

  const { sendMessage, isLoading: isChatLoading, error: chatError } = useChatService({
    onStreamChunk: handleStreamChunk,
    onStreamEnd: handleStreamEnd, // This now correctly passes the full response
    onStreamError: handleStreamError,
  });

  const generateSimpleId = () => uuidv4(); 

  const handlePromptSubmit = (promptText: string) => {
    if (!webContainer && !isWebContainerBooting) {
        logToTerminal("WebContainer not ready. Please wait for it to boot.", 'error');
        setChatMessages(prev => [...prev, {id: generateSimpleId(), role:'assistant', content: "WebContainer not ready!", type:'error'}]);
        return;
    }
    logToTerminal(`User prompt: ${promptText}`, 'info');
    const userAppMessage: AppChatMessage = { id: generateSimpleId(), role: 'user', content: promptText, type: 'text' }; 
    setChatMessages(prev => [...prev, userAppMessage]);
    setCurrentAssistantMessage('');
    setCurrentAssistantResponseParts([]); // Reset for new response

    const apiMessages: Message[] = [
      {
        id: userAppMessage.id,
        role: 'user',
        content: [{
          type: "text",
          text: `[Model: ${selectedModel}]\n\n[Provider: ${selectedProvider}]\n\n${promptText}` 
        }],
      },
    ];

    const filesForContext = projectFiles.reduce((acc, file) => {
        acc[file.path] = { code: file.content };
        return acc;
    }, {} as Record<string, { code: string }>);

    const body: ChatRequestBody = {
      id: chatSessionId, 
      messages: apiMessages,
      files: filesForContext,
      contextOptimization: true,
      promptId: "default", 
      apiKeys: { 
        AmazonBedrock: "",
        OpenRouter: "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",
      },
      supabase: { isConnected: false, hasSelectedProject: false, credentials: {} } 
    };
    sendMessage(body);
  };

  const handleFileSelect = (path: string) => {
    setActiveFilePath(path);
  };

  const handleCodeChange = (path: string, newContent: string) => {
    if (!path) return;
    setProjectFiles(prev =>
      prev.map(f => (f.path === path ? { ...f, content: newContent } : f))
    );
    if (webContainer) {
      writeFile(path, newContent);
    }
  };

  const activeFile = projectFiles.find(f => f.path === activeFilePath);

  useEffect(() => {
    console.log("ChatContainer State Update:", { 
      chatMessages,
      currentAssistantMessage,
      currentAssistantResponseParts, // Still useful for debugging accumulation
      projectFiles,
      activeFilePath,
      previewUrl,
      terminalOutput,
      isWebContainerBooting,
      activeFileContent: activeFile?.content ? activeFile.content.substring(0,100) + "..." : "No active file",
    });
  });

  if (isWebContainerBooting && !webContainer) { 
    return <Loader />;
  }

  return (
    <Stack alignItems="center" height="calc(100vh - 64px)" justifyContent="center" p={0} sx={{mt: '64px', boxSizing: 'border-box'}}> 
      <Grid
        container
        spacing={1}
        sx={{ flexGrow: 1, p: 1, overflow: "hidden", height: "100%" }}
      >
        <Grid
          item
          xs={12}
          md={4}
          sx={{ display: "flex", flexDirection: "column", gap: 1, height: "100%" }}
        >
          <Paper
            elevation={2}
            sx={{
              p: 1.5,
              display: "flex",
              flexDirection: "column",
              flex: "2 1 40%", 
              minHeight: "250px", 
              overflow: "hidden",
            }}
          >
            <Typography variant="subtitle1" gutterBottom>Chat</Typography>
            <ChatMessages messages={chatMessages} streamingMessage={currentAssistantMessage} />
            <PromptInput onSubmit={handlePromptSubmit}  />
            {chatError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                Chat Error: {chatError.message}
              </Alert>
            )}
          </Paper>
          <Paper
            elevation={2}
            sx={{
              p: 1.5,
              flex: "1 1 30%", 
              display: "flex",
              flexDirection: "column",
              minHeight: "150px",
              overflow: "hidden",
            }}
          >
            <Typography variant="subtitle1" gutterBottom>File Explorer</Typography>
            <FileExplorer files={projectFiles} onFileSelect={handleFileSelect} activeFilePath={activeFilePath} />
          </Paper>
          <Paper
            elevation={2}
            sx={{
              p: 1.5,
              display: "flex",
              flexDirection: "column",
              flex: "1 1 30%", 
              minHeight: "150px",
              overflow: "hidden",
            }}
          >
            <Typography variant="subtitle1" gutterBottom>Terminal</Typography>
            <TerminalOutput output={terminalOutput} />
          </Paper>
        </Grid>

        <Grid
          item
          xs={12}
          md={8}
          sx={{ display: "flex", flexDirection: "column", gap: 1, height: "100%" }}
        >
          <Paper
            elevation={2}
            sx={{
              flex: "3 1 60%", 
              p: 1.5,
              display: "flex",
              flexDirection: "column",
              minHeight: "300px",
              overflow: "hidden",
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Code Editor ({activeFilePath || "No file selected"})
            </Typography>
            <Box sx={{ flexGrow: 1, position: "relative", border: '1px solid rgba(255,255,255,0.08)' }}>
              <CodeEditorComponent 
                filePath={activeFile?.path}
                initialContent={activeFile?.content || ""}
                onContentChange={handleCodeChange}
              />
            </Box>
          </Paper>
          <Paper
            elevation={2}
            sx={{
              flex: "2 1 40%", 
              p: 1.5,
              display: "flex",
              flexDirection: "column",
              minHeight: "200px",
            }}
          >
            <Typography variant="subtitle1" gutterBottom>Live Preview</Typography>
            <LivePreview url={previewUrl} isLoading={(isChatLoading || (isWebContainerBooting && !webContainer)) && !previewUrl} />
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default ChatContainer;