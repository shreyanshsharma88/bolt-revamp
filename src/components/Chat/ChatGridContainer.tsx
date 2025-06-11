/* eslint-disable @typescript-eslint/no-explicit-any */
import { Close, Terminal } from "@mui/icons-material";
import {
  Box,
  Collapse,
  Drawer,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  type DrawerProps,
  type PaperProps,
} from "@mui/material";
import Lottie from "lottie-react";
import { useEffect, useMemo, useState, type JSX } from "react";
import PreviewAnimation from "../../../public/preview.json";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

import { motion, AnimatePresence } from "framer-motion";

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

const fadeSlideUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const iconHover = {
  rest: { scale: 1, boxShadow: "0px 0px 0px rgba(0,0,0,0)" },
  hover: {
    scale: 1.1,
    boxShadow: "0px 4px 10px rgba(0,0,0,0.15)",
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const drawerVariants = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, x: 100, transition: { duration: 0.2, ease: "easeIn" } },
};

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
  const [showFiles, setShowFiles] = useState(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));


  const Drawers = useMemo(
    () => [
      {
        anchor: "right",
        open: showLivePreview,
        onClose: () => setShowLivePreview(false),
        title: "Live Preview",
        content: LivePreview,
        description: "View the live preview of your code",
        PaperProps: {
          sx: {
            width: isMobile ? "100%" : "45%",
            background: "#001f3f",
            boxShadow: "12px 12px 56px #001326, -12px -12px 56px #002b58",
            height: "100%",
          },
        } as PaperProps,
      },
      {
        anchor: "bottom",
        open: showTerminalLogs,
        onClose: () => setShowTerminalLogs(false),
        title: "Terminal Logs",
        content: TerminalOutput,
        description: "Logs to help you debug your code",
        PaperProps: {
          sx: {
            height: isMobile ? "70%" : "50%",
          },
        } as PaperProps,
      },
    ],
    [LivePreview, TerminalOutput, showLivePreview, showTerminalLogs, isMobile]
  );

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeSlideUp}
        style={{ height: "97%" }}
      >
        <Stack
          direction="column"
          width="100%"
          height="100%"
          p={{ xs: 0, md: 3 }}
          spacing={2}
          sx={{
            color: (theme) => theme.palette.text.primary,
            overflow: "hidden",
          }}
        >
          {/* Top Layout: Chat + Code/Files */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            flex={1}
            sx={{ overflow: "hidden" }}
          >
            {/* Left: Chat Section */}
            <Paper
              elevation={24}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                p: 2,
                overflow: "hidden",
              }}
            >
              <Typography variant="h6" mb={1} color="text.primary">
                Chat
              </Typography>
              <Box flex={1} overflow="auto">
                {ChatMessages}
              </Box>
              <Box mt={1}>{PromptInput}</Box>
            </Paper>

            {/* Right: Code + File Explorer */}
            <Stack
              direction="column"
              flex={1.5}
              spacing={2}
              sx={{ overflow: "hidden" }}
            >
              {/* File Explorer */}
              <Paper
                elevation={24}
                sx={{
                  p: 1.5,
                  overflow: "hidden",
                  transition: "height 0.3s ease",
                  display: "flex",
                  flexDirection: "column",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",

                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  onClick={() => setShowFiles((prev) => !prev)}
                  sx={{ cursor: "pointer", userSelect: "none" }}
                >
                  <Typography variant="h6">Files</Typography>
                  {showFiles ? <ExpandLess /> : <ExpandMore />}
                </Stack>

                {/* AnimatePresence for smooth collapse animation */}
                <AnimatePresence initial={false}>
                  {showFiles && (
                    <motion.div
                      key="fileExplorer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <Box
                        mt={1}
                        sx={{
                          overflowY: "auto",
                          maxHeight: 250,
                          pr: 1,
                          "&::-webkit-scrollbar": {
                            display: "none",
                          },
                          scrollbarWidth: "none", // Firefox
                          msOverflowStyle: "none", // IE/Edge
                        }}
                      >
                        {FileExplorer}
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Paper>

              {/* Code Editor */}
              <Paper
                elevation={24}
                sx={{
                  p: 2,
                  flex: showFiles ? 1 : 1.5,
                  overflow: "hidden",
                  transition: "flex 0.3s ease",
                }}
              >
                <Typography variant="h6" mb={1}>
                  Code Editor
                </Typography>
                {CodeEditorComponent}
              </Paper>
            </Stack>
          </Stack>

          {/* Bottom Icons */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            mt={2}
          >
            <motion.div
              whileHover="hover"
              initial="rest"
              animate="rest"
              variants={iconHover}
              style={{ cursor: "pointer" }}
              onClick={() => setShowLivePreview(true)}
            >
              <Lottie
                animationData={PreviewAnimation}
                style={{ height: 60, width: 60 }}
              />
            </motion.div>

            <Tooltip title="Terminal Logs">
              <motion.div
                whileHover="hover"
                initial="rest"
                animate="rest"
                variants={iconHover}
                style={{ display: "inline-block", borderRadius: 8 }}
              >
                <IconButton
                  onClick={() => setShowTerminalLogs(true)}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(4px)",
                    borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.08)",
                    },
                  }}
                >
                  <Terminal sx={{ fontSize: 28 }} color="secondary" />
                </IconButton>
              </motion.div>
            </Tooltip>
          </Stack>
        </Stack>
      </motion.div>

      {/* Drawers */}
      <AnimatePresence>
        {Drawers.map(
          (drawer, index) =>
            drawer.open && (
              <motion.div
                key={index}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={drawerVariants}
                style={{ position: "fixed", inset: 0, zIndex: 1300 }}
              >
                <Drawer
                  anchor={drawer.anchor as DrawerProps["anchor"]}
                  open={drawer.open}
                  PaperProps={{
                    ...drawer.PaperProps,
                  }}
                  onClose={drawer.onClose}
                >
                  <Box
                    sx={{
                      width: "100%",
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
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
                      <Close
                        onClick={drawer.onClose}
                        sx={{ cursor: "pointer" }}
                      />
                    </Stack>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      gutterBottom
                    >
                      {drawer.description}
                    </Typography>
                    <Paper
                      elevation={2}
                      sx={{
                        borderRadius: "50px",
                        background: "#001f3f",
                        boxShadow:
                          "12px 12px 56px #001326, -12px -12px 56px #002b58",
                        height: "100%",
                        mt: 4,
                      }}
                    >
                      {drawer.content}
                    </Paper>
                  </Box>
                </Drawer>
              </motion.div>
            )
        )}
      </AnimatePresence>
    </>
  );
};
