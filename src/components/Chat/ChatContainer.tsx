/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/Chat/ChatContainer.tsx
// src/components/Chat/ChatContainer.tsx
import { Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppWebContainer, useChatService } from "../../hooks";
import type { ChatRequestBody, Message, StreamedData } from "../../types";
import { type AppChatMessage, type AppFile } from "../../utils/webContainer"; // Re-evaluate path for AppFile
import CodeEditorComponent from "../Code/CodeEditor";
import FileExplorer from "../Code/FileExplorer";
import LivePreview from "../Code/LivePreview";
import TerminalOutput from "../Code/TerminalOutput";
import { Loader } from "../LoaderModal";
import ChatMessages from "./ChatMessages";
import { PromptInput } from "./PromptInput";

import { v4 as uuidv4 } from "uuid"; // For chatSessionId

import { VITE_OPEN_ROUTER_API_KEY } from "../../constants";
import { parseBoltResponse, type BoltActionCommand } from "../../utils"; // Ensure boltActionParser.ts is correctly placed
import { ChatGridContainer } from "./ChatGridContainer";

export const ChatContainer = () => {
  const [chatMessages, setChatMessages] = useState<AppChatMessage[]>([]);
  const [currentAssistantMessage, setCurrentAssistantMessage] =
    useState<string>("");
  // We still use currentAssistantResponseParts for live accumulation, but handleStreamEnd will use its argument.
  const [currentAssistantResponseParts, setCurrentAssistantResponseParts] =
    useState<string[]>([]);

  const [projectFiles, setProjectFiles] = useState<AppFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

  const [chatSessionId] = useState(uuidv4()); // Unique ID for the chat session

  const [selectedModel, setSelectedModel] = useState<string>(
    "agentica-org/deepcoder-14b-preview:free"
  );
  const [selectedProvider, setSelectedProvider] =
    useState<string>("OpenRouter");

  const {
    webContainer,
    previewUrl,
    terminalOutput,
    isBooting: isWebContainerBooting,
    writeFile,
    runCommand,
    logToTerminal,
  } = useAppWebContainer();

  const handleStreamChunk = useCallback(
    (data: StreamedData | string) => {
      // console.log("handleStreamChunk received data:", data); // Keep this log for detailed debugging

      if (typeof data === "string") {
        setCurrentAssistantMessage((prev) => prev + data);
        setCurrentAssistantResponseParts((prev) => [...prev, data]);
      } else {
        // data is StreamedData object
        const textFromStreamedData =
          data.text ||
          data.message ||
          data.summary ||
          data.payload?.content ||
          data.payload?.text ||
          "";

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
        if (
          textFromStreamedData &&
          ![
            "progress",
            "usage",
            "log",
            "codeContext",
            "chatSummary",
            "error",
          ].includes(data.type)
        ) {
          setCurrentAssistantMessage((prev) => prev + textFromStreamedData);
          setCurrentAssistantResponseParts((prev) => [
            ...prev,
            textFromStreamedData,
          ]);
        }
      }
    },
    [logToTerminal]
  );

  // CRITICAL FIX: handleStreamEnd MUST accept the fullResponse argument from useChatService
  const handleStreamEnd = useCallback(
    async (fullResponse: string) => {
      // <--- ADD fullResponse ARGUMENT HERE
      logToTerminal(
        "Stream ended. Full response length for parsing: " +
          fullResponse.length,
        "info"
      ); // Use the argument directly

      // Add the full assistant response to chat messages for permanent display
      if (fullResponse.trim()) {
        // Use the argument directly
        setChatMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            role: "assistant",
            content: fullResponse,
            type: "text",
          }, // Use the argument directly
        ]);
      }
      setCurrentAssistantMessage(""); // Clear live streaming display
      setCurrentAssistantResponseParts([]); // Reset accumulator for next response

      // Parse the full response for Bolt actions
      const parsedArtifacts = parseBoltResponse(fullResponse); // <--- PASS fullResponse ARGUMENT HERE

      if (parsedArtifacts.length > 0) {
        logToTerminal(
          `Found ${parsedArtifacts.length} bolt artifact(s). Processing...`,
          "info"
        );
        const allNewFiles: AppFile[] = [];
        let startCommandAction: BoltActionCommand | null = null;
        let installNeeded = false;
        let projectBasePath = "";

        for (const artifact of parsedArtifacts) {
          logToTerminal(
            `Processing artifact: ${
              artifact.title || artifact.id || "Untitled"
            }`,
            "info"
          );
          for (const action of artifact.actions) {
            logToTerminal(
              `  Action: ${action.type}, Path: ${
                action.filePath || "N/A"
              }, Content Preview: ${(action.content || "").substring(
                0,
                70
              )}...`,
              "info"
            );

            if (action.type === "shell") {
              const parts =
                action.content.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [] as string[];
              if (parts.length > 0) {
                if (
                  (parts[0] === "npm" &&
                    (parts[1] === "create-vite-app" ||
                      parts[1] === "create")) ||
                  (parts[0] === "npx" && parts[1] === "create-vite-app")
                ) {
                  const appNameIndex =
                    parts.indexOf("create-vite-app") + 1 ||
                    parts.indexOf("create") + 1;
                  if (
                    parts[appNameIndex] &&
                    !parts[appNameIndex].startsWith("--")
                  ) {
                    projectBasePath = parts[appNameIndex].replace(/["']/g, "");
                    logToTerminal(
                      `Project base path identified: '${projectBasePath}' from create command.`,
                      "info"
                    );
                  } else {
                    logToTerminal(
                      `Could not determine app name from: ${action.content}`,
                      "info"
                    );
                  }
                } else if (parts[0] === "cd" && parts[1]) {
                  projectBasePath = parts[1].replace(/["']/g, "");
                  logToTerminal(
                    `Project base path changed to: '${projectBasePath}' from 'cd' command.`,
                    "info"
                  );
                } else {
                  const cwd = projectBasePath
                    ? `./${projectBasePath}`
                    : undefined;
                  await runCommand(
                    parts[0],
                    parts.slice(1),
                    `shell: ${parts[0]}`,
                    cwd
                  );
                }
              }
            } else if (action.type === "file" && action.filePath) {
              let finalPath = action.filePath;
              if (
                projectBasePath &&
                !action.filePath.startsWith("/") &&
                !action.filePath.startsWith(projectBasePath + "/")
              ) {
                finalPath = `${projectBasePath}/${action.filePath}`;
              }
              await writeFile(finalPath, action.content);
              allNewFiles.push({ path: finalPath, content: action.content });
              if (finalPath.endsWith("package.json")) {
                installNeeded = true;
              }
            } else if (action.type === "start") {
              startCommandAction = action;
            }
          }
        }

        if (allNewFiles.length > 0) {
          setProjectFiles((prev) => {
            const filesMap = new Map(prev.map((f) => [f.path, f]));
            allNewFiles.forEach((nf) => filesMap.set(nf.path, nf));
            const updated = Array.from(filesMap.values());
            if (
              updated.length > 0 &&
              (!activeFilePath ||
                !updated.find((f) => f.path === activeFilePath))
            ) {
              const firstNewFileInProject = updated.find((f) =>
                allNewFiles.some((newF) => newF.path === f.path)
              );
              setActiveFilePath(
                firstNewFileInProject?.path || updated[0]?.path || null
              );
            }
            return updated;
          });
        }

        const effectiveCwd = projectBasePath
          ? `./${projectBasePath}`
          : undefined;

        if (installNeeded) {
          logToTerminal(
            `Running npm install ${
              effectiveCwd ? `in ${effectiveCwd}` : "in root"
            }...`,
            "info"
          );
          await runCommand("npm", ["install"], "npm install", effectiveCwd);
        }

        if (startCommandAction) {
          const commandContent = startCommandAction.content;
          const actualCommandToRun = commandContent
            .split("&&")
            .map((s) => s.trim())
            .filter((s) => !s.startsWith("cd "))
            .join(" && ");

          const parts =
            actualCommandToRun.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
          if (parts.length > 0) {
            logToTerminal(
              `Running start command: ${actualCommandToRun} ${
                effectiveCwd ? `in ${effectiveCwd}` : "in root"
              }...`,
              "info"
            );
            await runCommand(
              parts[0] ?? "",
              parts.slice(1),
              `start: ${parts[0]}`,
              effectiveCwd
            );
          }
        }
        if (
          allNewFiles.length === 0 &&
          !startCommandAction &&
          parsedArtifacts.length > 0
        ) {
          logToTerminal(
            "Artifacts parsed, but no files were written and no start command was found.",
            "info"
          );
        }
      } else {
        logToTerminal(
          "No valid bolt artifacts found in the processed response.",
          "info"
        );
      }
    },
    [
      writeFile,
      runCommand,
      logToTerminal,
      setProjectFiles,
      setActiveFilePath,
      activeFilePath,
      setChatMessages,
      setCurrentAssistantMessage,
    ]
  ); // Removed currentAssistantResponseParts from dependencies as it's not directly used here anymore

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
    onStreamEnd: handleStreamEnd, // This now correctly passes the full response
    onStreamError: handleStreamError,
  });

  const generateSimpleId = () => uuidv4();

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
      setCurrentAssistantResponseParts([]); // Reset for new response

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
      currentAssistantResponseParts, // Still useful for debugging accumulation
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
    () => <PromptInput onSubmit={handlePromptSubmit} />,
    [handlePromptSubmit]
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
    () => <LivePreview url={previewUrl} />,
    [previewUrl]
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
    <Stack
      alignItems="center"
      height="90%"
      justifyContent="center"
      p={0}
    >
      {chatMessages.length > 0 ? (
        <ChatGridContainer
          ChatMessages={chatMessagesComponent}
          CodeEditorComponent={codeEditorComponent}
          FileExplorer={fileExplorerComponent}
          LivePreview={livePreviewComponent}
          TerminalOutput={terminalOutputComponent}
          PromptInput={promptInputComponent}
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
