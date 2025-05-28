export const GROK_API_KEY = import.meta.env.VITE_GROK_KEY || "";

export const VITE_OPEN_ROUTER_API_KEY = import.meta.env.VITE_OPEN_ROUTER_API_KEY || "";
export const LLM_PAYLOAD_TEMPLATE = {
  provider: {
    getApiKeyLink: "https://console.groq.com/keys",
    name: "Groq",
    config: {
      apiTokenKey: "GROQ_API_KEY",
    },
    staticModels: [
      {
        name: "llama-3.1-8b-instant",
        label: "Llama 3.1 8b (Groq)",
        provider: "Groq",
        maxTokenAllowed: 8000,
      },
      {
        name: "llama-3.2-11b-vision-preview",
        label: "Llama 3.2 11b (Groq)",
        provider: "Groq",
        maxTokenAllowed: 8000,
      },
      {
        name: "llama-3.2-90b-vision-preview",
        label: "Llama 3.2 90b (Groq)",
        provider: "Groq",
        maxTokenAllowed: 8000,
      },
      {
        name: "llama-3.2-3b-preview",
        label: "Llama 3.2 3b (Groq)",
        provider: "Groq",
        maxTokenAllowed: 8000,
      },
      {
        name: "llama-3.2-1b-preview",
        label: "Llama 3.2 1b (Groq)",
        provider: "Groq",
        maxTokenAllowed: 8000,
      },
      {
        name: "llama-3.3-70b-versatile",
        label: "Llama 3.3 70b (Groq)",
        provider: "Groq",
        maxTokenAllowed: 8000,
      },
      {
        name: "deepseek-r1-distill-llama-70b",
        label: "Deepseek R1 Distill Llama 70b (Groq)",
        provider: "Groq",
        maxTokenAllowed: 131072,
      },
    ],
  },
  model: "deepseek-r1-distill-llama-70b",
};
