// src/components/Chat/ChatMessages.tsx
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Box,
  CircularProgress,
  Divider,
  Paper,
  Typography
} from "@mui/material";
import React, { useEffect, useRef } from "react";
import type { AppChatMessage } from "../../utils/webContainer";

interface ChatMessagesProps {
  messages: AppChatMessage[];
  streamingMessage?: string;
  createdFiles?: string[]; // new prop
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  streamingMessage,
  createdFiles = [],
}) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = endOfMessagesRef.current;
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingMessage]);

  const getBubbleStyle = (role: "user" | "assistant", type?: string) => ({
    px: type === "command" ? 1.2 : 2,
    py: type === "command" ? 1 : 1.5,
    mb: 1,
    borderRadius: 2,
    maxWidth: "85%",
    wordWrap: "break-word",
    bgcolor:
      role === "user"
        ? "primary.main"
        : type === "command"
        ? "#111"
        : "background.paper",
    color:
      role === "user"
        ? "primary.contrastText"
        : type === "command"
        ? "#4CAF50"
        : "text.primary",
    alignSelf: role === "user" ? "flex-end" : "flex-start",
    boxShadow: type === "command" ? "0 0 0 1px #333" : 1,
    fontFamily: type === "command" ? "monospace" : undefined,
  });

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        pr: 1,
        px: 1,
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {messages
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
            sx={{ ...getBubbleStyle(msg.role, msg.type) }}
          >
            <Typography
              variant="body2"
              component="div"
              sx={{ whiteSpace: "pre-wrap" }}
            >
              {msg.type === "command" ? (
                <Box
                  component="pre"
                  sx={{
                    p: 0,
                    m: 0,
                    overflowX: "auto",
                    fontSize: "0.85rem",
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  $ {msg.content}
                </Box>
              ) : (
                msg.content
              )}
            </Typography>
          </Paper>
        ))}

      {streamingMessage && (
        <Paper elevation={0} sx={getBubbleStyle("assistant")}>
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

      {createdFiles.length > 0 && (
        <Box
          sx={{
            mt: 2,
            backgroundColor: "#111",
            borderRadius: 2,
            px: 2,
            py: 1.5,
            color: "#fff",
            border: "1px solid #333",
            boxShadow: "inset 0 0 0 1px #000",
            fontSize: "0.875rem",
          }}
        >
          <Typography sx={{ fontWeight: 600, mb: 1 }}>
            Project Created
          </Typography>
         
          <Divider sx={{ backgroundColor: "#333", my: 1 }} />
          <Box>
            {createdFiles.map((file, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 0.5,
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                  color: "#d0ffd0",
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 16, mr: 1, color: "#4CAF50" }} />
                {file}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <div ref={endOfMessagesRef} />
    </Box>
  );
};

export default ChatMessages;
