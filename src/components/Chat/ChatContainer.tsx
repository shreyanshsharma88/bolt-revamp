import { Stack, Typography } from "@mui/material"
import { PromptInput } from "./PromptInput"

export const ChatContainer = () => {
    return (
        <Stack alignItems='center' height='90%' justifyContent='center' p={2}>
            <Typography variant="h2">Let's code your [ IDEAS ]</Typography>
            <PromptInput/>
        </Stack>
    )
}