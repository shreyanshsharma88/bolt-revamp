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

import { useChat, type Message as VercelChatMessage } from "ai/react";

import { v4 as uuidv4 } from "uuid"; // For chatSessionId

import { VITE_OPEN_ROUTER_API_KEY } from "../../constants";

import { parseBoltResponse, type BoltActionCommand } from "../../utils"; // Ensure boltActionParser.ts is correctly placed

import { ChatGridContainer } from "./ChatGridContainer";

const extractHumanMessage = (eventStream: string): string => {
  const lines = eventStream.split("\n");
  let capture = false;
  let humanMessage = "";

  for (const line of lines) {
    if (line.startsWith('f:{"messageId"')) {
      capture = true;
      continue;
    }

    if (capture) {
      if (line.startsWith('0:".\\n\\n"') || line.startsWith('0:".\n\n"')) {
        break;
      }

      if (line.startsWith('0:"')) {
        // Extract content between the quotes
        const content = line.substring(3, line.length - 1);
        // Unescape special characters
        humanMessage += content
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
      }
    }
  }

  return humanMessage;
};

// In handleStreamEnd function, use this:

export const ChatContainer = () => {
  // chatMessages will now store the *processed and structured* messages for UI display

  const [chatMessages, setChatMessages] = useState<AppChatMessage[]>([]);

  // currentAssistantMessage will hold the live streaming content for the active assistant message

  const [currentAssistantMessage, setCurrentAssistantMessage] =
    useState<string>("");

  const [projectFiles, setProjectFiles] = useState<AppFile[]>([]);

  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

  const [chatSessionId] = useState(uuidv4());

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

  // Re-define generateSimpleId here to avoid useCallback dependency issues

  const generateSimpleId = useCallback(() => uuidv4(), []);

  // useChat hook from @vercel/ai - This replaces your custom useChatService

  const {
    messages: vercelMessages, // Raw messages from @vercel/ai (user, assistant, tool, system)
    input, // Current input value in the text area (for PromptInput)
    handleInputChange, // Handler for input changes (for PromptInput)
    handleSubmit, // Function to submit the form
    isLoading: isChatLoading, // Loading state from @vercel/ai
    error: vercelChatError, // Error object from @vercel/ai
    // append, // Use append for sending new messages with custom body (if not using handleSubmit directly)
    // reload, stop, setMessages etc. are also available from useChat
  } = useChat({
    api: "http://localhost:5174/api/chat", // Your backend API endpoint
    initialMessages: [], // Start with empty messages or load from history

    // onFinish is called when the stream ends for a message.
    onFinish: (message: VercelChatMessage) => {
      // message.content here is the FULL, accumulated text from the AI
      // This is where we trigger our custom parsing and WebContainer actions.
      handleStreamEnd(message.content, message.id);
    },

    // onError is called if there's a network error or non-2xx response.
    onError: (error: Error) => {
      logToTerminal(`Vercel useChat Error: ${error.message}`, "error");
      setChatMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: `Chat Error: ${error.message}`,
          type: "error",
        },
      ]);
    },

    // onStreamData is deprecated in newer versions. Live display is handled by observing `vercelMessages` content changes.
    // If you need more granular stream data (like `2:{}` chunks for progress), use `onStreamData`
    // with older versions that support it, or handle it differently if your backend sends it
    // as part of `message.content` or a different `useChat` option.
  });

  // Effect to update currentAssistantMessage for live display as vercelMessages change

  useEffect(() => {
    if (isChatLoading) {
      const lastAssistantMessage = vercelMessages.findLast(
        (m) => m.role === "assistant"
      );
      if (lastAssistantMessage) {
        setCurrentAssistantMessage(lastAssistantMessage.content);
      }
    } else {
      setCurrentAssistantMessage(""); // Clear after loading finishes
    }
  }, [isChatLoading, vercelMessages]);

  // handleStreamEnd logic is now triggered by onFinish from useChat

  // This useCallback handles all post-stream processing (parsing, file writing, commands, final chat messages)

  const handleStreamEnd = useCallback(
    async (fullResponseContent: string, messageId: string) => {
      // Receives content and ID from onFinish
      logToTerminal(
        "Stream ended. Full response content length for parsing: " +
          fullResponseContent.length,
        "info"
      );

      setCurrentAssistantMessage(""); // Clear live streaming display after stream ends

      const parsedArtifacts = parseBoltResponse(fullResponseContent); // Parse the complete content

      const finalChatMessagesForDisplay: AppChatMessage[] = [];
      const allNewFiles: AppFile[] = [];
      let startCommandAction: BoltActionCommand | null = null;
      let installNeeded = false;
      let projectBasePath = "";

      // Step 1: Extract main narrative text from the <assistant_response> tag
      let assistantNarrativeText = "";
      const assistantResponseMatch = fullResponseContent.match(
        /<assistant_response>([\s\S]*?)<\/assistant_response>/
      );

      const preambleMatch = fullResponseContent.match(/^([^<]*)/);
      finalChatMessagesForDisplay.push({
        id: generateSimpleId(),
        role: "assistant",
        content: preambleMatch?.[0].trim() ?? "",
        type: "text",
      });

      const postambleMatch = fullResponseContent.match(/[^>]*$/);
      finalChatMessagesForDisplay.push({
        id: generateSimpleId(),
        role: "assistant",
        content: postambleMatch?.[0].trim() ?? "",
        type: "text",
      });
      

      console.log({
        fullResponseContent,
        preambleMatch,
        postambleMatch,
        text1: preambleMatch?.[0].trim(),
        text2: postambleMatch?.[0].trim(),
        finalChatMessagesForDisplay
      });
      setChatMessages(p => [...p , ...finalChatMessagesForDisplay]);
      // return;
      if (assistantResponseMatch && assistantResponseMatch[1]) {
        assistantNarrativeText = assistantResponseMatch[1];
        assistantNarrativeText = assistantNarrativeText
          .replace(/<boltArtifact[\s\S]*?<\/boltArtifact>/g, "")
          .replace(/<examples>[\s\S]*?<\/examples>/g, "")
          .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, "")
          .replace(/<a[^>]*>([\s\S]*?)<\/a>/g, "$1")
          .replace(/<[^>]*>/g, "")
          .trim();

        if (assistantNarrativeText) {
          finalChatMessagesForDisplay.push({
            id: generateSimpleId(), // New ID for this specific message part
            role: "assistant",
            content: assistantNarrativeText,
            type: "text",
          });
        }
      }

      // Step 2: Process parsed artifacts and add structured messages and perform WebContainer actions
      if (parsedArtifacts.length > 0) {
        logToTerminal(
          `Found ${parsedArtifacts.length} bolt artifact(s). Processing...`,
          "info"
        );

        for (const artifact of parsedArtifacts) {
          if (artifact.title) {
            finalChatMessagesForDisplay.push({
              id: generateSimpleId(),
              role: "assistant",
              content: `Project: ${artifact.title}`,
              type: "project_info",
            });
          }

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
                action.content.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ||
                ([] as string[]);
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
                      "warn"
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
                    parts[0] ?? "",
                    parts.slice(1),
                    `shell: ${parts[0]}`,
                    cwd
                  );
                }
              }
              finalChatMessagesForDisplay.push({
                id: generateSimpleId(),
                role: "assistant",
                content: action.content,
                type: "command",
              });
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

              finalChatMessagesForDisplay.push({
                id: generateSimpleId(),
                role: "assistant",
                content: `File created: ${finalPath}`,
                type: "file_action",
              });
              if (finalPath.endsWith("package.json")) {
                installNeeded = true;
              }
            } else if (action.type === "start") {
              startCommandAction = action;
              finalChatMessagesForDisplay.push({
                id: generateSimpleId(),
                role: "assistant",
                content: action.content,
                type: "command",
              });
            }
          }
        }
      } else {
        logToTerminal(
          "No valid bolt artifacts found in the processed response.",
          "info"
        );
      }

      // Keeping index.html and main.tsx creation logic as it's a functional fix for WebContainer project setup
      const defaultMainTsxContent = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; 
// import './index.css'; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;

      const defaultIndexHtmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Todo App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script> 
  </body>
</html>`;

      let indexHtmlWrittenByLLM = false;
      let mainTsxWrittenByLLM = false;

      for (const artifact of parsedArtifacts) {
        for (const action of artifact.actions) {
          if (action.type === "file" && action.filePath) {
            if (action.filePath.includes("index.html")) {
              indexHtmlWrittenByLLM = true;
            }
            if (
              action.filePath.includes("src/main.tsx") ||
              action.filePath.includes("src/main.jsx")
            ) {
              mainTsxWrittenByLLM = true;
            }
          }
        }
      }

      if (projectBasePath) {
        if (!indexHtmlWrittenByLLM) {
          const indexHtmlPath = `${projectBasePath}/index.html`;
          await writeFile(indexHtmlPath, defaultIndexHtmlContent);
          allNewFiles.push({
            path: indexHtmlPath,
            content: defaultIndexHtmlContent,
          });
          logToTerminal(
            `Generated default index.html at ${indexHtmlPath}`,
            "info"
          );
          finalChatMessagesForDisplay.push({
            id: generateSimpleId(),
            role: "assistant",
            content: `Generated default index.html for the project.`,
            type: "file_action",
          });
        }

        if (!mainTsxWrittenByLLM) {
          const mainTsxPath = `${projectBasePath}/src/main.tsx`;
          await writeFile(mainTsxPath, defaultMainTsxContent);
          allNewFiles.push({
            path: mainTsxPath,
            content: defaultMainTsxContent,
          });
          logToTerminal(`Generated default main.tsx at ${mainTsxPath}`, "info");
          finalChatMessagesForDisplay.push({
            id: generateSimpleId(),
            role: "assistant",
            content: `Generated default main.tsx for the project.`,
            type: "file_action",
          });
        }
      }

      if (allNewFiles.length > 0) {
        setProjectFiles((prev) => {
          const filesMap = new Map(prev.map((f) => [f.path, f]));
          allNewFiles.forEach((nf) => filesMap.set(nf.path, nf));
          const updated = Array.from(filesMap.values());
          if (
            updated.length > 0 &&
            (!activeFilePath || !updated.find((f) => f.path === activeFilePath))
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

      const effectiveCwd = projectBasePath ? `./${projectBasePath}` : undefined;

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

      // FIX: Update chatMessages state - combine @vercel/ai's messages with processed custom messages
      setChatMessages((prev) => {
        // Find the Vercel message corresponding to this finished assistant response.
        // This ensures we get the latest content from useChat's internal accumulation.
        const vercelFinishedMessage = vercelMessages.find(
          (msg) => msg.id === messageId
        );
        console.log("INSIDE LOG", finalChatMessagesForDisplay);
        
        if (!vercelFinishedMessage) {
          // This should not happen if onFinish provides a valid message ID
          logToTerminal(
            `Error: Finished message with ID ${messageId} not found in vercelMessages.`,
            "error"
          );
          return [prev , ...finalChatMessagesForDisplay]; // Return previous state
        }

        // Map @vercel/ai's finished message to AppChatMessage format
        const mappedVercelMessage: AppChatMessage = {
          id: vercelFinishedMessage.id,
          role: vercelFinishedMessage.role as "user" | "assistant",
          content: vercelFinishedMessage.content, // Full text content from @vercel/ai
          type: "text", // Default type for the main text message
        };

        // Build the new chatMessages array:
        // 1. All existing user messages.
        // 2. All existing assistant messages that are NOT the one just finished (to avoid duplication).
        // 3. The newly completed assistant message (main text).
        // 4. Any custom structured messages (commands, file actions, project info) from `finalChatMessagesForDisplay`.
        const newChatHistory: AppChatMessage[] = [];

        // Add previous user messages
        prev.forEach((msg) => {
          if (msg.role === "user") {
            newChatHistory.push(msg);
          }
        });

        // Add the newly completed assistant message (main narrative text)
        newChatHistory.push(mappedVercelMessage);

        // Add custom structured messages (commands, file actions, project info)
        // Filter out the main text message if it was already added from parsedArtifacts in some edge case
        finalChatMessagesForDisplay.forEach((msg) => {
          if (msg.id !== messageId || msg.type !== "text") {
            // Avoid duplicating the main text message
            newChatHistory.push(msg);
          }
        });

        return newChatHistory;
      });
    },
    // Dependencies for useCallback - essential for correct behavior
    [
      writeFile,
      runCommand,
      logToTerminal,
      setProjectFiles,
      setActiveFilePath,
      activeFilePath,
      setChatMessages,
      setCurrentAssistantMessage,
      generateSimpleId,
      vercelMessages, // CRITICAL: This dependency ensures handleStreamEnd sees the latest vercelMessages
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
      // setCurrentAssistantMessage(""); // No need to clear this here, useChat manages it
    },
    [logToTerminal]
  );

  const handlePromptSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      // useChat's handleSubmit takes a form event
      event.preventDefault(); // Prevent default form submission

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
      logToTerminal(`User prompt: ${input}`, "info");

      // Add user message to your local chatMessages state immediately for display
      const userMessageForDisplay: AppChatMessage = {
        id: generateSimpleId(), // Use generateSimpleId for consistency
        role: "user",
        content: input, // Display the original prompt content
        type: "text",
      };
      setChatMessages((prev) => [...prev, userMessageForDisplay]);

      // Construct the message object for @vercel/ai (which will also be sent to backend by `handleSubmit`)
      const messageForAI: VercelChatMessage = {
        id: userMessageForDisplay.id, // Re-use the ID for consistency
        role: "user",
        content: `[Model: ${selectedModel}]\n\n[Provider: ${selectedProvider}]\n\n${input}`, // Prefix content for backend
      };

      // Construct the custom body for the backend API, passing the transformed message
      const filesForContext = projectFiles.reduce((acc, file) => {
        acc[file.path] = { code: file.content };
        return acc;
      }, {} as Record<string, { code: string }>);

      const customBody: ChatRequestBody = {
        id: chatSessionId,
        messages: [messageForAI as any], // @vercel/ai expects `Message[]`, but `content` is string in `VercelChatMessage`
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

      // Call @vercel/ai's handleSubmit to send the message and custom body
      handleSubmit(event, {
        // Pass the event and options object
        body: customBody, // Pass your custom backend payload here
      });

      // Clear live streaming message and parts for the new response
      setCurrentAssistantMessage("");
    },
    [
      webContainer,
      isWebContainerBooting,
      logToTerminal,
      generateSimpleId,
      input, // Input from useChat
      projectFiles,
      chatSessionId,
      selectedModel,
      selectedProvider,
      handleSubmit, // From useChat
      setChatMessages, // Added setChatMessages to dependencies
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

      projectFiles,

      activeFilePath,

      previewUrl,

      terminalOutput,

      isChatLoading,

      vercelMessages,

      isWebContainerBooting,

      activeFileContent: activeFile?.content
        ? activeFile.content.substring(0, 100) + "..."
        : "No active file",
    });
  }, [
    chatMessages,

    currentAssistantMessage,

    projectFiles,

    activeFilePath,

    previewUrl,

    terminalOutput,

    isChatLoading,

    vercelMessages,

    isWebContainerBooting,

    activeFile,
  ]);

  const promptInputComponent = useMemo(
    () => (
      <PromptInput
        onSubmit={handlePromptSubmit}
        isLoading={isChatLoading || (isWebContainerBooting && !webContainer)}
        value={input} // Bind input from useChat
        onChange={handleInputChange} // Bind handleInputChange from useChat
      />
    ),

    [
      handlePromptSubmit,
      isChatLoading,
      isWebContainerBooting,
      webContainer,
      input,
      handleInputChange,
    ]
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
        messages={chatMessages} // Pass local chatMessages state
        streamingMessage={
          isChatLoading
            ? vercelMessages.findLast((m) => m.role === "assistant")?.content ||
              ""
            : ""
        } // Live content from useChat
      />
    ),

    [chatMessages, isChatLoading, vercelMessages]
  );

  if ((isWebContainerBooting && !webContainer) || isChatLoading) {
    return <Loader />;
  }

  return (
    <Stack alignItems="center" height="90%" justifyContent="center" p={0}>
      {chatMessages.length > 0 ? (
        <ChatGridContainer
          ChatMessages={chatMessagesComponent}
          CodeEditorComponent={codeEditorComponent}
          FileExplorer={fileExplorerComponent}
          LivePreview={livePreviewComponent}
          TerminalOutput={terminalOutputComponent}
          PromptInput={promptInputComponent}
          activeFilePath={activeFilePath}
          chatError={null}
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
