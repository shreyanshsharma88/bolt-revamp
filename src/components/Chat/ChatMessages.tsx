/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/Chat/ChatMessages.tsx
import React, { useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  type SxProps,
  List,
  ListItem,
} from "@mui/material";
import type { AppChatMessage } from "../../utils/webContainer";

interface ChatMessagesProps {
  messages: AppChatMessage[];
  streamingMessage?: string;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  streamingMessage,
}) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only scroll if the user hasn't scrolled up manually
    const element = endOfMessagesRef.current;
    if (element) {
      const isScrolledToBottom =
        element.scrollHeight - element.clientHeight <= element.scrollTop + 1;
      if (isScrolledToBottom) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages, streamingMessage]);

  const getBubbleStyle = (role: "user" | "assistant", type?: string) => ({
    p: 1.5,
    mb: 1,
    borderRadius: "10px",
    maxWidth: "80%",
    wordWrap: "break-word",
    bgcolor:
      role === "user"
        ? "primary.main"
        : type === "command"
        ? "rgba(76, 175, 80, 0.1)"
        : "background.paper",
    color:
      role === "user"
        ? "primary.contrastText"
        : type === "command"
        ? "#66BB6A"
        : "text.primary",
    alignSelf: role === "user" ? "flex-end" : "flex-start",
    boxShadow: 1,
    border: type === "command" ? "1px solid #4CAF50" : "none",
  });

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        pr: 0.5,
      }}
    >
      {messages
        // Filter out internal structured logs (progress, usage, unknown_structured_data) from displaying in chat
        .filter(
          (msg) =>
            msg.role === "user" ||
            (msg.type !== "progress" &&
              msg.type !== "usage" &&
              !msg.type?.startsWith("unknown_structured_data") &&
              msg.type !== "internal_log")
        )
        .map((msg) => (
          <Paper
            key={msg.id}
            elevation={0}
            sx={{ ...(getBubbleStyle(msg.role, msg.type) as SxProps) }}
          >
            <Typography
              variant="body2"
              component="div"
              sx={{ whiteSpace: "pre-wrap" }}
            >
              {/* Conditionally display type prefix for specific message types */}
              {msg.type &&
                ["file_action", "command", "project_info"].includes(
                  msg.type
                ) && (
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ opacity: 0.7, mb: 0.5 }}
                  >
                    [{msg.type.replace(/_/g, " ").toUpperCase()}]
                  </Typography>
                )}
              {/* Display content based on message type */}
              {msg.type === "file_list" && msg.files && (
                <Box
                  sx={{
                    mt: 1,
                    p: 1,
                    backgroundColor: "rgba(0,0,0,0.05)",
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ opacity: 0.7, mb: 1 }}
                  >
                    [FILE LIST]
                  </Typography>
                  <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
                    {msg.files.map((file, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={file.path}
                          primaryTypographyProps={{
                            variant: "body2",
                            fontFamily: "monospace",
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              {msg.type === "command" ? (
                <Box
                  component="pre"
                  sx={{
                    backgroundColor: "rgba(0,0,0,0.1)",
                    p: 1,
                    borderRadius: "5px",
                    overflowX: "auto",
                    color: "inherit",
                  }}
                >
                  <Typography
                    component="code"
                    variant="body2"
                    sx={{ color: "inherit" }}
                  >
                    $ {msg.content}
                  </Typography>
                </Box>
              ) : (
                msg.content
              )}
            </Typography>
          </Paper>
        ))}
      {streamingMessage && (
        <Paper elevation={0} sx={getBubbleStyle("assistant") as SxProps}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography
              variant="body2"
              component="div"
              sx={{ whiteSpace: "pre-wrap", flexGrow: 1 }}
            >
              {streamingMessage}
            </Typography>
          </Box>
        </Paper>
      )}
      <div ref={endOfMessagesRef} />
    </Box>
  );
};

export default ChatMessages;
