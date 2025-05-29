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
  id: string; // Top-level session ID for the conversation
  messages: Message[]; // Array of messages in the format your backend expects
  files?: Record<string, { code: string }>; // Current project files for context
  promptId?: string; // As per your backend's default payload
  contextOptimization?: boolean; // As per your backend's default payload
  apiKeys?: { 
    AmazonBedrock?: string;
    OpenRouter?: string;
    [key: string]: string | undefined; 
  };
  supabase?: { 
    isConnected: boolean;
    hasSelectedProject: boolean;
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
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/types.ts

// Keep existing interfaces that are still relevant for API requests or LLM responses
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

// Keep the Message and ChatRequestBody types as they are used for your backend API structure
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: MessageContent[]; // Changed to MessageContent[] to match backend payload
  createdAt?: Date; // Add if you use it in API messages
}

export interface ChatRequestBody {
  id: string; // Top-level session ID
  messages: Message[];
  files?: Record<string, { code: string }>;
  promptId?: string;
  contextOptimization?: boolean;
  apiKeys?: {
    AmazonBedrock: "";
    OpenRouter: typeof VITE_OPEN_ROUTER_API_KEY;
  };
  supabase?: { isConnected: false; hasSelectedProject: false; credentials: Record<string, any> }; // Add this back if your backend expects it
}

// Remove StreamedData and ChatServiceOptions as they are replaced by @vercel/ai
// export interface StreamedData { ... }
// export interface ChatServiceOptions { ... }

// You will also need to define a type for messages coming from @vercel/ai if you want to augment them
// For now, we'll use their Message type directly and convert if needed.


export interface AppChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'command' | 'file_action' | 'project_info' | 'error' | 'file_list' | string;
  files?: { path: string; content: string }[]; // Add files array
  data?: any;
}
export interface AppFile {
  path: string;
  content: string;
}

// Define the Message interface as expected by @vercel/ai and your backend payload
// @vercel/ai's internal Message type is { id: string, role: 'user' | 'assistant' | 'tool', content: string }
// We use 'VercelChatMessage' from ai/react for their internal messages.
// Your backend payload expects 'Message' with content: MessageContent[]
export interface Message { // This is the type for your backend's API request `messages` array
  id: string;
  role: 'user' | 'assistant' | 'system'; // 'system' is also common in AI chat history
  content: { type: string; text: string; }[]; // Content formatted as array of parts for your backend
  createdAt?: Date; // Optional: if your backend expects this
}

// The ChatRequestBody for your backend API
// src/types.ts (or a new src/types/streamedData.ts)

export enum BoltStreamDataType {
  PROGRESS = 'progress',
  CONTEXT_INFO = 'contextInfo',
  TOKEN_USAGE = 'tokenUsage',
  STREAM_ERROR = 'streamError',
  INTERNAL_LOG = 'internal_log', // For backend logs you want to show in frontend terminal
  // Add other specific types your backend might send
}

export interface BaseStreamedData {
  type: BoltStreamDataType | string; // Allow string for forward compatibility if backend adds types
  timestamp?: number;
}

export interface ProgressStreamData extends BaseStreamedData {
  type: BoltStreamDataType.PROGRESS;
  step: string; // e.g., "LLM_REQUEST", "FILE_ANALYSIS"
  message: string;
  status: 'started' | 'in-progress' | 'completed' | 'failed';
  details?: Record<string, any>;
}

export interface ContextInfoDetail { // Renamed from ContextFile to be more generic
  identifier: string; // e.g., file path, or a summary title
  description?: string; // e.g., "Used 30 lines", "Relevant section"
}

export interface ContextInfoStreamData extends BaseStreamedData {
  type: BoltStreamDataType.CONTEXT_INFO;
  summary?: string;
  details?: ContextInfoDetail[];
  tokensForContext?: number;
}

export interface TokenUsageStreamData extends BaseStreamedData {
  type: BoltStreamDataType.TOKEN_USAGE;
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface StreamErrorData extends BaseStreamedData {
  type: BoltStreamDataType.STREAM_ERROR;
  errorMessage: string;
  errorCode?: string;
  isFatal?: boolean;
}

export interface InternalLogStreamData extends BaseStreamedData {
    type: BoltStreamDataType.INTERNAL_LOG;
    message: string;
    level: 'info' | 'warn' | 'error' | 'debug';
}

// Union type for all structured data objects
export type BoltStreamedDataObject =
  | ProgressStreamData
  | ContextInfoStreamData
  | TokenUsageStreamData
  | StreamErrorData
  | InternalLogStreamData;

// Type for the `data` array from useChat
export type BoltClientStreamData = BoltStreamedDataObject[];