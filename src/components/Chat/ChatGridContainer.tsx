/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Alert,
  Box,
  Drawer,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  type DrawerProps,
} from "@mui/material";
import { useMemo, useState, type JSX } from "react";
import TerminalAnimation from "../../../public/terminal.json";
import PreviewAnimation from "../../../public/preview.json";
import Lottie from "lottie-react";
import { Close, Terminal } from "@mui/icons-material";

interface IChatGridContainerProps {
  ChatMessages: JSX.Element;
  PromptInput: JSX.Element;
  FileExplorer: JSX.Element;
  TerminalOutput: JSX.Element;
  CodeEditorComponent: JSX.Element;
  LivePreview: JSX.Element;
  activeFilePath: string | null;
  chatError: Error | null;
}
export const ChatGridContainer = ({
  ChatMessages,
  CodeEditorComponent,
  FileExplorer,
  LivePreview,
  PromptInput,
  TerminalOutput,
  activeFilePath,
  chatError,
}: IChatGridContainerProps) => {
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [showTerminalLogs, setShowTerminalLogs] = useState(false);
  const Drawers = useMemo(
    () => [
      {
        anchor: "right",
        open: showLivePreview,
        onClose: () => setShowLivePreview(false),
        title: "Live Preview",
        content: LivePreview,
        description: "View the live preview of your code",
      },
      {
        anchor: "bottom",
        open: showTerminalLogs,
        onClose: () => setShowTerminalLogs(false),
        title: "Terminal Logs",
        content: TerminalOutput,
        description: "Logs to help you debug your code",
      },
    ],
    [LivePreview, TerminalOutput, showLivePreview, showTerminalLogs]
  );
  return (
    <>
      <Stack
        direction="row"
        width="100%"
        height="100vh"
        justifyContent="space-between"
        alignItems="flex-end" // aligns animation and icon at bottom
        p={2} // padding for breathing space
      >
        {/* Left: Lottie Animation */}
        <Box
          onClick={() => setShowLivePreview(true)}
          sx={{ cursor: "pointer" }}
        >
          <Lottie
            animationData={PreviewAnimation}
            style={{
              height: 100,
              width: 100,
            }}
          />
        </Box>

        {/* Center: Main Content */}
        <Stack
          direction="row"
          gap={2}
          flex={1}
          height="100%"
          alignItems="stretch"
          border="2px solid"
          borderRadius={1}
        >
          {/* Chat Section */}
          <Stack width="50%" justifyContent="space-between">
            <Typography
              textAlign="start"
              p={2}
              variant="subtitle1"
              gutterBottom
            >
              Chat
            </Typography>
            {ChatMessages}
            {PromptInput}
          </Stack>

          {/* File Explorer */}
          <Stack width="20%">
            <Typography
              textAlign="start"
              p={2}
              variant="subtitle1"
              gutterBottom
            >
              File Explorer
            </Typography>
            {FileExplorer}
          </Stack>

          {/* Code Editor */}
          <Stack width="30%">
            <Typography
              textAlign="start"
              p={2}
              variant="subtitle1"
              gutterBottom
            >
              Code
            </Typography>
            {CodeEditorComponent}
          </Stack>
        </Stack>

        {/* Right: Terminal Icon */}
        <Tooltip title="View Terminal Logs">
          <IconButton onClick={() => setShowTerminalLogs(true)} sx={{ mb: 1 }}>
            <Terminal sx={{ fontSize: 60 }} color="primary" />
          </IconButton>
        </Tooltip>
      </Stack>
      {Drawers.map((drawer, index) => (
        <Drawer
          key={index}
          anchor={drawer.anchor as DrawerProps["anchor"]}
          open={drawer.open}
        >
          <Box
            sx={{
              width: "100%",
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: "500px",
            }}
          >
            <Stack
              width="100%"
              justifyContent="space-between"
              direction="row"
              alignItems="center"
            >
              <Typography variant="h6" gutterBottom>
                {drawer.title}
              </Typography>
              <Close onClick={drawer.onClose} sx={{ cursor: "pointer" }} />
            </Stack>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {drawer.description}
            </Typography>
            <Paper
              elevation={2}
              sx={{
                borderRadius: "50px",
                background: "#001f3f",
                boxShadow: "12px 12px 56px #001326, -12px -12px 56px #002b58",
                height: "100%",
              }}
            >
              {drawer.content}
            </Paper>
          </Box>
        </Drawer>
      ))}
    </>
  );
};
