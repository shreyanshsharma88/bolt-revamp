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
  const cookies = document.cookie
  const mutation = useMutation<
    string, // On success, we might return the full concatenated text or a success message
    Error,
    ChatRequestBody
  >({
    mutationFn: async (body: ChatRequestBody) => {
      // FIX 1: Add http:// protocol to the Axios URL
      const response = await axios.post("http://localhost:5174/api/chat", body, {
        responseType: "stream",
        onDownloadProgress: (progressEvent) => {
          // console.log("Progress event:", progressEvent.event.currentTarget.responseText);
        },
        withCredentials: true, // Ensure cookies are sent if needed
        headers:{
          "Cookie": cookies, // Include cookies in the request if needed
        }
      });

      // ---- SIMPLIFIED STREAM HANDLING USING FETCH FOR SSE ----
      // Axios is great for many things, but raw fetch is often easier for SSE text/event-stream.

      // FIX 2: Add http:// protocol to the Fetch API URL
      const fetchResponse = await fetch(`http://localhost:5174/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Ensure cookies are sent if your backend relies on them for auth/API keys
          ...{ credentials: "include" },
        },
        body: JSON.stringify(body),
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
      let fullAssistantResponseText = "";
      let lastProcessedData: any = null; // To hold the last structured data object if stream ends with one

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          // Process the chunk - this is where you parse bolt.diy's stream format
          const parsedItems = parseStreamedBoltData(chunk); // You need to implement parseStreamedBoltData
          parsedItems.forEach((item: any) => {
            if (typeof item === "string") {
              fullAssistantResponseText += item;
              onStreamChunk(item);
            } else {
              // It's a StreamedData object
              if (item.text) {
                // Some structured data might also have primary text
                fullAssistantResponseText += item.text;
              }
              onStreamChunk(item);
              lastProcessedData = item; // Keep track of the last structured data
            }
          });
        }
      }
      onStreamEnd(fullAssistantResponseText, lastProcessedData);
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