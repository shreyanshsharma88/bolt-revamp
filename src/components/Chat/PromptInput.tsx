/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AttachFile as AttachFileIcon,
  Mic as MicIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { useGlobalContext } from "../../providers";

export const PromptInput = ({onSubmit, value, onChange, isLoading}:{
  onSubmit : (e: React.FormEvent<HTMLFormElement>) => void; // Expects a form event
  value: string; // The current input value
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; // The change handler
  isLoading: boolean; // To disable the submit button
}) => {
  const { askLLM } = useGlobalContext();
  // const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const textFieldRef = useRef(null);
  const theme = useTheme();

  const handleSubmitInternal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission
    onSubmit(e); // Call the onSubmit prop with the event
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitInternal(e); // Pass the event
    }
  };


  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        padding: 4,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1],
          delay: 0.1,
        }}
        style={{ width: "100%", maxWidth: "800px" }}
      >
        <motion.div
          animate={{
            scale: isFocused ? 1.02 : isHovered ? 1.008 : 1,
            rotateX: isFocused ? 0.5 : 0,
          }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          style={{ transformStyle: "preserve-3d" }}
        >
          <Paper
            elevation={0}
            sx={{
              position: "relative",
              background: isFocused
                ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255,255,255,0.06) 100%)`
                : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255,255,255,0.03) 100%)`,
              backdropFilter: "blur(20px) saturate(180%)",
              border: `1px solid ${
                isFocused
                  ? theme.palette.primary.main
                  : "rgba(255,255,255,0.12)"
              }`,

              borderRadius: "24px",
              overflow: "hidden",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: isFocused
                ? "0 25px 50px rgba(0,0,0,0.25), 0 0 0 1px rgba(100, 200, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)"
                : isHovered
                ? "0 15px 35px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)"
                : "0 10px 30px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                opacity: isFocused ? 1 : 0,
                transition: "opacity 0.4s ease",
              },
            }}
          >
            {/* Animated background gradient */}
            <motion.div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  "linear-gradient(45deg, rgba(100, 200, 255, 0.04), rgba(255, 100, 200, 0.04), rgba(100, 255, 200, 0.04))",
                backgroundSize: "400% 400%",
              }}
              animate={{
                opacity: isFocused ? 1 : 0,
                backgroundPosition: isFocused
                  ? ["0% 50%", "100% 50%", "0% 50%"]
                  : "0% 50%",
              }}
              transition={{
                opacity: { duration: 0.3 },
                backgroundPosition: {
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
            />

            < form onSubmit={handleSubmitInternal} style={{ position: "relative"}}>
              <TextField
                ref={textFieldRef}
                multiline
                maxRows={6}
                value={value} // Use value from props
                onChange={onChange} // Use onChange from props
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyPress}
                placeholder={
                  !isFocused && !value
                    ? "What would you like to create today?"
                    : ""
                }
                variant="standard"
                fullWidth
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                      >
                        <IconButton
                          size="small"
                          sx={{
                            color: theme.palette.text.secondary,
                            mr: 1,
                            "&:hover": {
                              backgroundColor: "rgba(255,255,255,0.1)",
                              color: theme.palette.secondary.main,
                            },
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        >
                          <AttachFileIcon fontSize="small" />
                        </IconButton>
                      </motion.div>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Box
                        sx={{ display: "flex", gap: 0.5, alignItems: "center" }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 17,
                          }}
                        >
                          <IconButton
                            size="small"
                            sx={{
                              color: "rgba(255,255,255,0.6)",
                              "&:hover": {
                                backgroundColor: "rgba(255,255,255,0.1)",
                                color: theme.palette.error.main,
                              },
                              transition:
                                "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                          >
                            <MicIcon fontSize="small" />
                          </IconButton>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          animate={{
                            opacity: value.trim() ? 1 : 0.5,
                            scale: value.trim() ? 1 : 0.9,
                            rotate: value.trim() ? 360 : 0,
                          }}
                          transition={{
                            duration: 0.3,
                            rotate: { duration: 0.6, ease: "easeInOut" },
                          }}
                        >
                          <IconButton
                            onClick={handleSubmitInternal}
                            disabled={!value.trim()}
                            sx={{
                              background: value.trim()
                                ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                                : "rgba(255,255,255,0.1)",
                              color: theme.palette.text.primary,

                              width: 40,
                              height: 40,
                              ml: 1,
                              position: "relative",
                              overflow: "hidden",
                              "&:hover": {
                                background: value.trim()
                                  ? "linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)"
                                  : "rgba(255,255,255,0.15)",
                                transform: "translateY(-2px)",
                                boxShadow:
                                  "0 12px 30px rgba(102, 126, 234, 0.4)",
                              },
                              "&:disabled": {
                                color: "rgba(255,255,255,0.4)",
                              },
                              transition:
                                "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                              boxShadow: value.trim()
                                ? "0 6px 20px rgba(102, 126, 234, 0.3)"
                                : "none",
                              "&::before": {
                                content: '""',
                                position: "absolute",
                                top: 0,
                                left: "-100%",
                                width: "100%",
                                height: "100%",
                                background:
                                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                                transition: "left 0.6s ease",
                              },
                              "&:hover::before": {
                                left: "100%",
                              },
                            }}
                          >
                            <SendIcon fontSize="small" />
                          </IconButton>
                        </motion.div>
                      </Box>
                    </InputAdornment>
                  ),
                  sx: {
                    color: "rgba(255,255,255,0.9)",
                    fontSize: "16px",
                    lineHeight: "1.6",
                    "& input, & textarea": {
                      padding: "12px 0",
                      "&::placeholder": {
                        color: "rgba(255,255,255,0.5)",
                        opacity: 1,
                        fontSize: "16px",
                        fontWeight: 400,
                      },
                    },
                  },
                }}
              />

              {/* Character counter for long text */}
              <AnimatePresence>
                {value.length > 100 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{
                      duration: 0.3,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    style={{ marginTop: "12px" }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          value.length > 10
                            ? theme.palette.error.main
                            : "rgba(255,255,255,0.5)",
                        fontSize: "12px",
                        textAlign: "right",
                        display: "block",
                        fontWeight: 500,
                        transition: "color 0.3s ease",
                      }}
                    >
                      {value.length.toLocaleString()} characters
                      {value.length > 10 && " • Getting long!"}
                    </Typography>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <AnimatePresence>
              {isFocused && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      style={{
                        position: "absolute",
                        width: "8px",
                        height: "8px",
                        background: "rgba(100, 200, 255, 0.6)",
                        borderRadius: "50%",
                        top: "35%",
                        left: `${20 + i * 30}%`,
                      }}
                      initial={{ opacity: 0, scale: 0, y: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                        y: [0, -30, -60],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </Paper>
        </motion.div>

        <AnimatePresence>
          {value && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              style={{
                marginTop: "16px",
                textAlign: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "12px",
                  fontStyle: "italic",
                }}
              >
                Press Enter to send • Shift+Enter for new line
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Box>
  );
};
