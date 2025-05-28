/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/Chat/ChatContainer.tsx
import { Stack, Typography, Grid, Paper, Alert, Box } from "@mui/material"; // Keep these for the basic structure provided by user
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppWebContainer, useChatService } from "../../hooks";
import type { ChatRequestBody, Message, StreamedData } from "../../types";
import { type AppChatMessage, type AppFile } from "../../utils/webContainer";
import CodeEditorComponent from "../Code/CodeEditor";
import FileExplorer from "../Code/FileExplorer";
import LivePreview from "../Code/LivePreview";
import TerminalOutput from "../Code/TerminalOutput";
import { Loader } from "../LoaderModal";
import ChatMessages from "./ChatMessages";
import { PromptInput } from "./PromptInput";

import { v4 as uuidv4 } from "uuid";

import { VITE_OPEN_ROUTER_API_KEY } from "../../constants";
import { parseBoltResponse, type BoltActionCommand } from "../../utils";
import { ChatGridContainer } from "./ChatGridContainer";
// import { ChatGridContainer } from "./ChatGridContainer"; // Removed if not used for basic structure

export const ChatContainer = () => {
  const [chatMessages, setChatMessages] = useState<AppChatMessage[]>([]);
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState<string>("");
  const [currentAssistantResponseParts, setCurrentAssistantResponseParts] = useState<string[]>([]);

  // FIX: Use refs for mutable accumulation within handleStreamChunk's useCallback
  const currentAssistantMessageRef = useRef("");
  const currentAssistantResponsePartsRef = useRef<string[]>([]);

  const [projectFiles, setProjectFiles] = useState<AppFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

  const [chatSessionId] = useState(uuidv4());

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

  // FIX: handleStreamChunk - Removed direct setChatMessages from here
  const handleStreamChunk = useCallback(
    (data: StreamedData | string) => {
      // console.log("handleStreamChunk received data:", data); // Keep for debugging
      // console.log("Type of data:", typeof data); // Keep for debugging

      if (typeof data === "string") {
        currentAssistantMessageRef.current += data;
        currentAssistantResponsePartsRef.current.push(data);
      } else { // data is StreamedData object
        const textFromStreamedData =
          data.text || data.message || data.summary || data.payload?.content || data.payload?.text || "";

        const logMsg = `[STREAM ${data.type.toUpperCase()}]: ${
          textFromStreamedData || JSON.stringify(data.payload)
        }`;
        logToTerminal(logMsg, "info");
        
        // CRITICAL FIX: Removed setChatMessages from here.
        // This was interfering with state updates and prematurely adding logs to chatMessages.
        // `handleStreamEnd` is now solely responsible for updating `chatMessages` with final structured messages.

        if (textFromStreamedData) { 
          currentAssistantMessageRef.current += textFromStreamedData;
          currentAssistantResponsePartsRef.current.push(textFromStreamedData);
        }
      }
      // CRITICAL: Force state updates AFTER updating refs, so components re-render with latest content
      setCurrentAssistantMessage(currentAssistantMessageRef.current); 
      setCurrentAssistantResponseParts([...currentAssistantResponsePartsRef.current]); // Create new array reference for reactivity
    },
    [logToTerminal, setCurrentAssistantMessage, setCurrentAssistantResponseParts] // Dependencies for useCallback
  );

  const generateSimpleId = useCallback(() => uuidv4(), []); 

  const handleStreamEnd = useCallback(
    async (fullResponse: string) => {
      logToTerminal('Stream ended. Full response length for parsing: ' + fullResponse.length, 'info'); 
      
      setCurrentAssistantMessage(""); // Clear live streaming display
      setCurrentAssistantResponseParts([]); // Reset accumulator for next response
      
      // Clear refs after use
      currentAssistantMessageRef.current = "";
      currentAssistantResponsePartsRef.current = [];

      const parsedArtifacts = parseBoltResponse(fullResponse); 

      const finalChatMessagesForDisplay: AppChatMessage[] = []; 
      const allNewFiles: AppFile[] = [];
      let startCommandAction: BoltActionCommand | null = null;
      let installNeeded = false;
      let projectBasePath = "";

      // Step 1: Extract main narrative text from the <assistant_response> tag
      let assistantNarrativeText = "";
      const assistantResponseMatch = fullResponse.match(/<assistant_response>([\s\S]*?)<\/assistant_response>/);
      if (assistantResponseMatch && assistantResponseMatch[1]) {
          assistantNarrativeText = assistantResponseMatch[1];
          assistantNarrativeText = assistantNarrativeText
              .replace(/<boltArtifact[\s\S]*?<\/boltArtifact>/g, '')
              .replace(/<examples>[\s\S]*?<\/examples>/g, '')
              .replace(/<pre><code>[\s\S]*?<\/code><\/pre>/g, '') 
              .replace(/<a[^>]*>([\s\S]*?)<\/a>/g, '$1') 
              .replace(/<[^>]*>/g, '') 
              .trim(); 
          
          if (assistantNarrativeText) {
              finalChatMessagesForDisplay.push({
                  id: generateSimpleId(),
                  role: 'assistant',
                  content: assistantNarrativeText,
                  type: 'text',
              });
          }
      }


      // Step 2: Process parsed artifacts and add structured messages and perform WebContainer actions
      if (parsedArtifacts.length > 0) {
        logToTerminal(`Found ${parsedArtifacts.length} bolt artifact(s). Processing...`, 'info'); 
        
        for (const artifact of parsedArtifacts) {
          if (artifact.title) {
              finalChatMessagesForDisplay.push({
                  id: generateSimpleId(),
                  role: 'assistant',
                  content: `Project: ${artifact.title}`,
                  type: 'project_info', 
              });
          }

          for (const action of artifact.actions) {
            logToTerminal(`  Action: ${action.type}, Path: ${action.filePath || 'N/A'}, Content Preview: ${(action.content || "").substring(0,70)}...`, "info");
            
            if (action.type === 'shell') {
              const parts = action.content.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [] as string[];
              if (parts.length > 0) {
                if ((parts[0] === 'npm' && (parts[1] === 'create-vite-app' || parts[1] === 'create')) || (parts[0] === 'npx' && parts[1] === 'create-vite-app')) {
                  const appNameIndex = parts.indexOf("create-vite-app") + 1 || parts.indexOf("create") + 1;
                  if (parts[appNameIndex] && !parts[appNameIndex].startsWith("--")) {
                      projectBasePath = parts[appNameIndex].replace(/["']/g, ''); 
                      logToTerminal(`Project base path identified: '${projectBasePath}' from create command.`, "info");
                  } else {
                      logToTerminal(`Could not determine app name from: ${action.content}`, "warn");
                  }
                } else if (parts[0] === 'cd' && parts[1]) {
                  projectBasePath = parts[1].replace(/["']/g, ''); 
                  logToTerminal(`Project base path changed to: '${projectBasePath}' from 'cd' command.`, "info");
                } else {
                  const cwd = projectBasePath ? `./${projectBasePath}` : undefined;
                  await runCommand(parts[0] ?? "", parts.slice(1), `shell: ${parts[0]}`, cwd); 
                }
              }
              finalChatMessagesForDisplay.push({ 
                  id: generateSimpleId(),
                  role: 'assistant',
                  content: action.content, 
                  type: 'command', 
              });
            } else if (action.type === 'file' && action.filePath) {
              let finalPath = action.filePath;
              if (projectBasePath && !action.filePath.startsWith('/') && !action.filePath.startsWith(projectBasePath + '/')) {
                finalPath = `${projectBasePath}/${action.filePath}`;
              }
              await writeFile(finalPath, action.content);
              allNewFiles.push({ path: finalPath, content: action.content });
              
              finalChatMessagesForDisplay.push({ 
                  id: generateSimpleId(),
                  role: 'assistant',
                  content: `File created: ${finalPath}`,
                  type: 'file_action', 
              });
              if (finalPath.endsWith('package.json')) {
                installNeeded = true;
              }
            } else if (action.type === 'start') {
              startCommandAction = action;
              finalChatMessagesForDisplay.push({ 
                  id: generateSimpleId(),
                  role: 'assistant',
                  content: action.content, 
                  type: 'command', 
              });
            }
          }
        }
      } else {
        logToTerminal("No valid bolt artifacts found in the processed response.", "info");
      }

      // No index.html or main.tsx creation logic here (as requested to scratch for now)

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
          logToTerminal(`Running npm install ${effectiveCwd ? `in ${effectiveCwd}` : "in root"}...`, "info");
          await runCommand('npm', ['install'], 'npm install', effectiveCwd);
      }

      if (startCommandAction) {
          const commandContent = startCommandAction.content;
          const actualCommandToRun = commandContent.split('&&').map(s => s.trim()).filter(s => !s.startsWith('cd ')).join(' && ');

          const parts = actualCommandToRun.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
          if (parts.length > 0) {
              logToTerminal(`Running start command: ${actualCommandToRun} ${effectiveCwd ? `in ${effectiveCwd}` : "in root"}...`, "info");
              await runCommand(parts[0] ?? "", parts.slice(1), `start: ${parts[0]}`, effectiveCwd); 
          }
      }
      if (allNewFiles.length === 0 && !startCommandAction && parsedArtifacts.length > 0) {
          logToTerminal("Artifacts parsed, but no files were written and no start command was found.", "info");
      }

      setChatMessages(prev => {
          const filteredPrevMessages = prev.filter(m => 
              m.role === 'user' || 
              (m.type !== 'progress' && m.type !== 'usage' && !m.type?.startsWith('unknown_structured_data'))
          );
          return [...filteredPrevMessages, ...finalChatMessagesForDisplay];
      });

    },
    // Corrected DEPENDENCY ARRAY for useCallback - now complete for all state setters and values
    [
      writeFile,
      runCommand,
      logToTerminal,
      setProjectFiles,
      setActiveFilePath,
      activeFilePath,
      setChatMessages,
      setCurrentAssistantMessage,
      setCurrentAssistantResponseParts, // Added this setter
      generateSimpleId, 
    ]
  ); 

  const handleStreamError = useCallback(
    (error: Error) => {
      logToTerminal(`Chat stream error: ${error.message}`, "error");
      setChatMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: "assistant",
          content: `Error: ${error.message}`,
          type: "error",
        },
      ]);
      setCurrentAssistantMessage("");
    },
    [logToTerminal]
  );

  const {
    sendMessage,
    isLoading: isChatLoading,
    error: chatError,
  } = useChatService({
    onStreamChunk: handleStreamChunk,
    onStreamEnd: handleStreamEnd,
    onStreamError: handleStreamError,
  });

  // const generateSimpleId = useCallback(() => uuidv4(), []); 

  const handlePromptSubmit = useCallback(
    (promptText: string) => {
      if (!webContainer && !isWebContainerBooting) {
        logToTerminal(
          "WebContainer not ready. Please wait for it to boot.",
          "error"
        );
        setChatMessages((prev) => [
          ...prev,
          {
            id: generateSimpleId(),
            role: "assistant",
            content: "WebContainer not ready!",
            type: "error",
          },
        ]);
        return;
      }
      logToTerminal(`User prompt: ${promptText}`, "info");
      const userAppMessage: AppChatMessage = {
        id: generateSimpleId(),
        role: "user",
        content: promptText,
        type: "text",
      };
      setChatMessages((prev) => [...prev, userAppMessage]);
      setCurrentAssistantMessage("");
      setCurrentAssistantResponseParts([]); 

      const apiMessages: Message[] = [
        {
          id: userAppMessage.id,
          role: "user",
          content: [
            {
              type: "text",
              text: `[Model: ${selectedModel}]\n\n[Provider: ${selectedProvider}]\n\n${promptText}`,
            },
          ],
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
          OpenRouter: VITE_OPEN_ROUTER_API_KEY,
        },
        supabase: {
          isConnected: false,
          hasSelectedProject: false,
          credentials: {},
        },
      };
      sendMessage(body);
    },
    [
      chatSessionId,
      isWebContainerBooting,
      logToTerminal,
      projectFiles,
      selectedModel,
      selectedProvider,
      sendMessage,
      webContainer,
      generateSimpleId, 
    ]
  );

  const handleFileSelect = (path: string) => {
    setActiveFilePath(path);
  };

  const handleCodeChange = useCallback(
    (path: string, newContent: string) => {
      if (!path) return;
      setProjectFiles((prev) =>
        prev.map((f) => (f.path === path ? { ...f, content: newContent } : f))
      );
      if (webContainer) {
        writeFile(path, newContent);
      }
    },
    [webContainer, writeFile]
  );

  const activeFile = projectFiles.find((f) => f.path === activeFilePath);

  useEffect(() => {
    console.log("ChatContainer State Update:", {
      chatMessages,
      currentAssistantMessage,
      currentAssistantResponseParts, 
      projectFiles,
      activeFilePath,
      previewUrl,
      terminalOutput,
      isWebContainerBooting,
      activeFileContent: activeFile?.content
        ? activeFile.content.substring(0, 100) + "..."
        : "No active file",
    });
  });

  const promptInputComponent = useMemo(
    () => (
      <PromptInput
        onSubmit={handlePromptSubmit}
        isLoading={isChatLoading || (isWebContainerBooting && !webContainer)}
      />
    ),
    [handlePromptSubmit, isChatLoading, isWebContainerBooting, webContainer]
  );

  const terminalOutputComponent = useMemo(
    () => <TerminalOutput output={terminalOutput} />,
    [terminalOutput]
  );

  const codeEditorComponent = useMemo(
    () => (
      <CodeEditorComponent
        filePath={activeFile?.path}
        initialContent={activeFile?.content || ""}
        onContentChange={handleCodeChange}
      />
    ),
    [activeFile, handleCodeChange]
  );

  const livePreviewComponent = useMemo(
    () => (
      <LivePreview
        url={previewUrl}
        isLoading={
          (isChatLoading || (isWebContainerBooting && !webContainer)) &&
          !previewUrl
        }
      />
    ),
    [previewUrl, isChatLoading, isWebContainerBooting, webContainer]
  );

  const fileExplorerComponent = useMemo(
    () => (
      <FileExplorer
        files={projectFiles}
        onFileSelect={handleFileSelect}
        activeFilePath={activeFilePath}
      />
    ),
    [activeFilePath, projectFiles]
  );

  const chatMessagesComponent = useMemo(
    () => (
      <ChatMessages
        messages={chatMessages}
        streamingMessage={currentAssistantMessage}
      />
    ),
    [chatMessages, currentAssistantMessage]
  );

  if ((isWebContainerBooting && !webContainer) || isChatLoading) {
    return <Loader />;
  }

  return (
    <Stack alignItems="center" height="90%" justifyContent="center" p={0}>
      {chatMessages.length > 0 ? (
        <ChatGridContainer
          ChatMessages={chatMessagesComponent}
          PromptInput={promptInputComponent}
          FileExplorer={fileExplorerComponent}
          TerminalOutput={terminalOutputComponent}
          CodeEditorComponent={codeEditorComponent}
          LivePreview={livePreviewComponent}
          activeFilePath={activeFilePath}
          chatError={chatError}
        />
      ) : (
        <Stack direction="column">
          <Typography variant="h2">Let's Code your [ IDEAS ]</Typography>
          {promptInputComponent}
        </Stack>
      )}
    </Stack>
  );
};

export default ChatContainer;
