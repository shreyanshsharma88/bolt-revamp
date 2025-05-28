/* eslint-disable @typescript-eslint/no-explicit-any */
import { VITE_OPEN_ROUTER_API_KEY } from "./constants";
interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface RequestBody {
  body: string;
}

interface ResponseHeaders {
  "alt-svc": string;
  "cache-control": string;
  "cf-cache-status": string;
  "cf-ray": string;
  connection: string;
  "content-encoding": string;
  "content-type": string;
  date: string;
  server: string;
  "set-cookie": string;
  "transfer-encoding": string;
  vary: string;
  "x-groq-region": string;
  "x-ratelimit-limit-requests": string;
  "x-ratelimit-limit-tokens": string;
  "x-ratelimit-remaining-requests": string;
  "x-ratelimit-remaining-tokens": string;
  "x-ratelimit-reset-requests": string;
  "x-ratelimit-reset-tokens": string;
  "x-request-id": string;
}

interface MessageContent {
  type: string;
  text: string;
}

interface ResponseMessage {
  role: string;
  content: MessageContent[];
  id: string;
}

interface APIResponse {
  id: string;
  timestamp: string;
  modelId: string;
  headers: ResponseHeaders;
  messages: ResponseMessage[];
}

interface Step {
  stepType: string;
  text: string;
  toolCalls: any[];
  toolResults: any[];
  finishReason: string;
  usage: Usage;
  warnings: any[];
  request: RequestBody;
  response: APIResponse;
  experimental_providerMetadata: {
    openai: Record<string, any>;
  };
  isContinued: boolean;
}

export interface ILlmAPIResponse {
  text: string;
  toolCalls: any[];
  toolResults: any[];
  finishReason: string;
  usage: Usage;
  warnings: any[];
  request: RequestBody;
  response: APIResponse;
  steps: Step[];
  experimental_providerMetadata: {
    openai: Record<string, any>;
  };
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system"; // System messages might be added by backend
  content: {
    type: string;
    text: string;
  }[];
}

export interface ChatRequestBody {
  id: string;
  messages: Message[];
  files?: Record<string, { code: string }>; // Or a more complex FileMap if needed
  promptId?: string;
  contextOptimization?: boolean;
  apiKeys: {
    AmazonBedrock: "";
    OpenRouter: typeof VITE_OPEN_ROUTER_API_KEY;
  };
  supabase: {
    isConnected: false;
    hasSelectedProject: false;
    credentials: Record<string, any>;
  };
}

export interface StreamedData {
  type:
    | "chat"
    | "code"
    | "file"
    | "command"
    | "progress"
    | "previewUrl"
    | "usage"
    | "error"
    | "log"
    | "chatSummary"
    | "codeContext"
    | string; // Allow custom types
  payload: any;
  text?: string; // For simple text chunks
  label?: string;
  status?: "in-progress" | "complete" | "error";
  order?: number;
  message?: string; // For progress messages
  summary?: string; // For chatSummary
  files?: string[]; // For codeContext
}
