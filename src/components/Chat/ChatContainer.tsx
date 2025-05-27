// src/components/Chat/ChatContainer.tsx
import { Alert, Grid, Paper, Stack, Typography } from "@mui/material";
import { PromptInput } from "./PromptInput";
import { Loader } from "../LoaderModal";
import { useCallback, useState, useMemo } from "react"; // Import useMemo
import {
  determineCommands,
  extractCodeBlocks,
  type AppChatMessage,
  type AppFile,
} from "../../utils/webContainer";
import { useAppWebContainer, useChatService } from "../../hooks";
import type { ChatRequestBody, Message, StreamedData } from "../../types";
import ChatMessages from "./ChatMessages";
import FileExplorer from "../Code/FileExplorer";
import TerminalOutput from "../Code/TerminalOutput";
import CodeEditorComponent from "../Code/CodeEditor";
import LivePreview from "../Code/LivePreview";
import { v4 as uuidv4 } from "uuid"; // Import uuidv4

export const ChatContainer = () => {
  const [chatMessages, setChatMessages] = useState<AppChatMessage[]>([]);
  const [currentAssistantMessage, setCurrentAssistantMessage] =
    useState<string>("");
  const [projectFiles, setProjectFiles] = useState<AppFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

  // Generate a unique ID for the chat session once when the component mounts
  const [chatSessionId] = useState(uuidv4());

  const {
    webContainer,
    previewUrl,
    terminalOutput,
    setTerminalOutput,
    isBooting: isWebContainerBooting,
    writeFile,
    runCommand,
    logToTerminal,
  } = useAppWebContainer();

  const handleStreamChunk = useCallback(
    (data: StreamedData | string) => {
      if (typeof data === "string") {
        setCurrentAssistantMessage((prev) => prev + data);
      } else if (data.type) {
        // It's a StreamedData object
        const textContent = data.text || data.message || data.summary || "";
        if (
          data.type === "progress" ||
          data.type === "log" ||
          data.type === "codeContext" ||
          data.type === "chatSummary" ||
          data.type === "usage" ||
          data.type.startsWith("unknown")
        ) {
          // For non-chat messages, log them to terminal or a dedicated status area
          const logMsg = `[STREAM ${data.type.toUpperCase()}]: ${
            textContent || JSON.stringify(data.payload)
          }`;
          logToTerminal(logMsg, "info");
          setChatMessages((prev) => [
            ...prev,
            {
              id: String(Date.now()),
              role: "assistant",
              content: logMsg,
              type: data.type as any,
              data: data.payload,
            },
          ]);
          if (textContent && data.type !== "progress") {
            // also add to current assistant message if it's not just progress
            setCurrentAssistantMessage(
              (prev) => prev + ` (${data.type}: ${textContent}) `
            );
          }
        } else if (textContent) {
          // Default to adding text to assistant message
          setCurrentAssistantMessage((prev) => prev + textContent);
        }
      }
    },
    [logToTerminal]
  );

  const handleStreamEnd = useCallback(
    async (fullResponse: string) => {
      logToTerminal("Stream ended.", "info");
      setChatMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: "assistant",
          content: currentAssistantMessage + fullResponse,
          type: "text",
        },
      ]);
      setCurrentAssistantMessage("");

      // Process fullResponse for code blocks and WebContainer actions
      const codeBlocks = extractCodeBlocks(
        currentAssistantMessage + fullResponse
      );
      const newFiles: AppFile[] = [];
      if (codeBlocks.length > 0) {
        logToTerminal(
          `Found ${codeBlocks.length} code blocks. Processing...`,
          "info"
        );
        for (const block of codeBlocks) {
          if (block.path) {
            await writeFile(block.path, block.content);
            newFiles.push({ path: block.path, content: block.content });
          } else {
            logToTerminal(
              `Code block without path (language: ${
                block.language || "unknown"
              }) - not writing to FS.`,
              "info"
            );
          }
        }

        if (newFiles.length > 0) {
          // Naive merge, replace if exists, add if new
          setProjectFiles((prevProjectFiles) => {
            const updatedFiles = [...prevProjectFiles];
            newFiles.forEach((newFile) => {
              const existingIndex = updatedFiles.findIndex(
                (pf) => pf.path === newFile.path
              );
              if (existingIndex > -1) {
                updatedFiles[existingIndex] = newFile;
              } else {
                updatedFiles.push(newFile);
              }
            });
            return updatedFiles;
          });

          // Determine and run commands
          const { install, dev, installCommand, devCommand } =
            determineCommands(newFiles);
          if (install && installCommand) {
            await runCommand(
              installCommand[0],
              installCommand.slice(1),
              "npm install"
            );
          }
          if (dev && devCommand) {
            // Don't await this if you want the UI to remain responsive while server starts
            runCommand(devCommand[0], devCommand.slice(1), "dev server");
          } else if (newFiles.length > 0 && !dev) {
            logToTerminal(
              "Code files were generated, but could not determine a dev command to start a preview server.",
              "info"
            );
          }
        }
      } else {
        logToTerminal(
          "No actionable code blocks found in the response for WebContainer processing.",
          "info"
        );
      }
    },
    [writeFile, runCommand, logToTerminal, currentAssistantMessage]
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

  const handlePromptSubmit = (prompt: string) => {
    if (!webContainer && !isWebContainerBooting) {
      logToTerminal(
        "WebContainer not ready. Please wait for it to boot.",
        "error"
      );
      setChatMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: "assistant",
          content: "WebContainer not ready!",
          type: "error",
        },
      ]);
      return;
    }
    logToTerminal(`User prompt: ${prompt}`, "info");
    const userMessage: AppChatMessage = {
      id: String(Date.now()),
      role: "user",
      content: prompt,
      type: "text",
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setCurrentAssistantMessage(""); // Clear any previous streaming text

    // Format messages for the backend API
    const apiMessages: Message[] = [
      ...chatMessages
        .filter((m) => m.type === "text")
        .map((m) => ({ id: m.id, role: m.role, content: [{ type: "text", text: m.content }] })), // Send previous text messages for context
      {
        id: userMessage.id,
        role: "user",
        content: [
          {
            type: "text",
            text: `[Model: agentica-org/deepcoder-14b-preview:free]\n\n[Provider: OpenRouter]\n\n${prompt}`,
          },
        ],
      }, // Mimic bolt.diy's prompt formatting
    ];

    // Convert current projectFiles to the FileMap structure backend might expect for context
    const filesForContext = projectFiles.reduce((acc, file) => {
      acc[file.path] = { code: file.content };
      return acc;
    }, {} as Record<string, { code: string }>);

    const body: ChatRequestBody = {
      id: chatSessionId, // <-- Add this line: Pass the session ID
      messages: apiMessages,
      files: filesForContext, // Send current file content for context
      contextOptimization: true, // As in bolt.diy
      apiKeys: {
        AmazonBedrock: "",
        OpenRouter:
          "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",
      },
    };
    sendMessage(body);
  };

  const handleFileSelect = (path: string) => {
    setActiveFilePath(path);
  };

  const handleCodeChange = (path: string, newContent: string) => {
    setProjectFiles((prev) =>
      prev.map((f) => (f.path === path ? { ...f, content: newContent } : f))
    );
    if (webContainer) {
      // Write to WC for live updates if preview server supports HMR/auto-reload
      writeFile(path, newContent);
    }
  };

  const activeFile = projectFiles.find((f) => f.path === activeFilePath);
  console.log({
    chatMessages,
    currentAssistantMessage,
    projectFiles,
    activeFilePath,
    previewUrl,
    terminalOutput,
    isWebContainerBooting,
    activeFile,
  });
  

  if (isWebContainerBooting) {
    return <Loader />;
  }
  return (
    <Stack alignItems="center" height="90%" justifyContent="center" p={2}>
      <Typography variant="h2">Let's code your [ IDEAS ]</Typography>
      {/* <PromptInput onSubmit={handlePromptSubmit}/> */}
      <Grid
        container
        spacing={1}
        sx={{ flexGrow: 1, p: 1, overflow: "hidden" }}
      >
        {/* Left Column: Chat, Files, Terminal */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            height: "100%",
          }}
        >
          <Paper
            elevation={2}
            sx={{
              p: 1.5,
              display: "flex",
              flexDirection: "column",
              height: "calc(40% - 8px)",
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Chat
            </Typography>
            <ChatMessages
              messages={chatMessages}
              streamingMessage={currentAssistantMessage}
            />
            <PromptInput onSubmit={handlePromptSubmit} />
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
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              height: "calc(30% - 8px)",
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              File Explorer
            </Typography>
            <FileExplorer
              files={projectFiles}
              onFileSelect={handleFileSelect}
              activeFilePath={activeFilePath}
            />
          </Paper>
          <Paper
            elevation={2}
            sx={{
              p: 1.5,
              display: "flex",
              flexDirection: "column",
              height: "30%",
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Terminal
            </Typography>
            <TerminalOutput output={terminalOutput} />
          </Paper>
        </Grid>

        {/* Right Column: Editor, Preview */}
        <Grid
          item
          xs={12}
          md={8}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            height: "100%",
          }}
        >
          <Paper
            elevation={2}
            sx={{
              flexGrow: 1.5,
              p: 1.5,
              display: "flex",
              flexDirection: "column",
              height: "60%",
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Code Editor ({activeFilePath || "No file selected"})
            </Typography>
            <CodeEditorComponent
              filePath={activeFile?.path}
              initialContent={activeFile?.content || ""}
              onContentChange={handleCodeChange}
            />
          </Paper>
          <Paper
            elevation={2}
            sx={{
              flexGrow: 1,
              p: 1.5,
              display: "flex",
              flexDirection: "column",
              height: "40%",
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Live Preview
            </Typography>
            <LivePreview
              url={previewUrl}
              isLoading={isChatLoading && !previewUrl}
            />
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
};
