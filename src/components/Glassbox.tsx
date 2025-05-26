/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Stack, type BoxProps } from "@mui/material";
import type { FC, PropsWithChildren } from "react";

export const GlassBox = ({
  children,
  props,
}: {
  children: any;
  props?: BoxProps;
}) => {
  return (
    <GlassBoxImage>
      <Box
        sx={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
          color: "#fff",
          p: 4,
          width: "100%",
          height: "100%",
          textAlign: "center",
        }}
        {...props}
      >
        {children}
      </Box>
    </GlassBoxImage>
  );
};

const GlassBoxImage: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Stack
      height="100dvh"
      width="100%"
      sx={{
        backgroundImage: "url('https://media.gettyimages.com/id/1290890844/video/purple-4k-square-blocks-glow-beautiful-clean-abtract-futuristic-modern-vibrant-background.jpg?s=640x640&k=20&c=pYBR64zAb9xaK3UEarU1_AODUZVRdn6ocIa0b0d9_Q0=')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {children}
    </Stack>
  );
};
