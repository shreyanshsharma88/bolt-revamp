import { Box, Dialog, Stack, Typography } from "@mui/material";
import Lottie from "lottie-react";
import LoadingAnimation from "../../public/loading-animation.json";
import { motion } from "framer-motion";

const MotionStack = motion(Stack);


export const Loader = () => {
  return (
    <Dialog open fullScreen>
     <MotionStack
        height="100%"
        width="100%"
        justifyContent="center"
        alignItems="center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
       
        <Box height={350} width={350}>
          <Lottie animationData={LoadingAnimation} />
        </Box>
        <Typography variant="body1" fontStyle="italic">
          Please be patient
        </Typography>
      </MotionStack>
    </Dialog>
  );
};
