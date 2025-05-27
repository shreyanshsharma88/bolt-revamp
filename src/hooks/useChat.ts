// src/hooks/useChat.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import type { ChatRequestBody, StreamedData } from "../types";
import { parseStreamedBoltData } from "../utils/streamParser";

export interface ChatServiceOptions {
  onStreamChunk: (data: StreamedData | string) => void; // string for raw text, StreamedData for parsed objects
  onStreamEnd: (fullResponse: string, finalData?: any) => void;
  onStreamError: (error: Error) => void;
}

export const useChatService = ({
  onStreamChunk,
  onStreamEnd,
  onStreamError,
}: ChatServiceOptions) => {
  const cookies = document.cookie;
  const mutation = useMutation<
    string, // On success, we might return the full concatenated text or a success message
    Error,
    ChatRequestBody
  >({
    mutationFn: async (body: ChatRequestBody) => {
      // FIX 1: Add http:// protocol to the Axios URL
      // NOTE: This Axios call seems redundant if you're using Fetch API below for streaming.
      // If the backend truly streams, the Axios call with responseType: "stream" might not fully resolve
      // until the stream is complete, or it needs a more complex onDownloadProgress handler.
      // For SSE, the Fetch API with getReader() is generally preferred.
      // Keeping it for now as per your original code, but consider if it's actually needed.
      const response = await axios.post("http://localhost:5174/api/chat", body, {
        responseType: "stream",
        onDownloadProgress: (progressEvent) => {
          // console.log("Axios Progress event:", progressEvent.event.currentTarget.responseText);
        },
        withCredentials: true, // Ensure cookies are sent if needed
        headers:{
          "Cookie": cookies, // Include cookies in the request if needed
        }
      });

      // ---- SIMPLIFIED STREAM HANDLING USING FETCH FOR SSE ----
      // This is the primary stream handler for your application.
      const fetchResponse = await fetch(`http://localhost:5174/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Ensure cookies are sent if your backend relies on them for auth/API keys
          // Note: 'credentials: "include"' is generally sufficient for sending cookies
          // if the backend is on the same origin or configured for CORS with credentials.
          // Explicitly setting "Cookie" header might be restricted by browser security policies
          // for cross-origin requests, even with credentials: "include".
          // It's usually better to rely on `credentials: "include"`.
          // "Cookie": cookies, // Removed, rely on credentials: "include"
        },
        body: JSON.stringify(body),
        credentials: "include", // Ensure cookies are sent with fetch
      });

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        throw new Error(`Chat API error: ${fetchResponse.status} ${errorText}`);
      }
      if (!fetchResponse.body) {
        throw new Error("Response body is null");
      }

      const reader = fetchResponse.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullAssistantResponseText = ""; // This accumulates the full response string
      let lastProcessedData: any = null; // To hold the last structured data object if stream ends with one

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const parsedItems = parseStreamedBoltData(chunk);
          parsedItems.forEach((item: any) => {
            // Always call onStreamChunk for every item for live display/logging
            onStreamChunk(item);

            // CRITICAL FIX: Accumulate text from StreamedData objects robustly
            // This ensures fullAssistantResponseText gets the full LLM response for parsing.
            // We only want to accumulate actual LLM response text, not just progress/usage updates.
            // Heuristic: If it's not a known non-content type, assume it might be text.
            if (typeof item === "string") {
              fullAssistantResponseText += item; // Accumulate direct strings
            } else {
              // Extract text from various possible fields within StreamedData
              const textToAccumulate = item.text || item.message || item.summary || item.payload?.content || item.payload?.text || '';
              
              // Only accumulate if it's actual text content, not just a progress/usage update
              // Adjust this condition if your backend sends other types that are part of the main narrative
              if (textToAccumulate && !['progress', 'usage', 'log', 'codeContext', 'chatSummary', 'error'].includes(item.type)) {
                fullAssistantResponseText += textToAccumulate;
              }
              lastProcessedData = item; // Update lastProcessedData for the final argument
            }
          });
        }
      }
      onStreamEnd(fullAssistantResponseText, lastProcessedData); // Pass the correctly accumulated string
      return fullAssistantResponseText; // Or some indicator of success
    },
    onError: (error: Error) => {
      onStreamError(error);
    },
  });

  return {
    sendMessage: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
};