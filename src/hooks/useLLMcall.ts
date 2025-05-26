// useLLMCall.ts
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { LLM_PAYLOAD_TEMPLATE } from "../constants";
import { useGlobalContext } from "../providers";

interface LLMRequestPayload {
  message: string;
  model: string;
  provider: {
    getApiKeyLink: string;
    name: string;
    config: {
      apiTokenKey: string;
    };
    staticModels: {
      name: string;
      label: string;
      provider: string;
      maxTokenAllowed: number;
    }[];
  };
  system: string;
}

export const useLLMCall = () => {
  const cookies = document.cookie;
  const { popToast } = useGlobalContext();
  return useMutation({
    mutationFn: async (prompt: string) => {
      const payload: LLMRequestPayload = {
        message: prompt,
        ...LLM_PAYLOAD_TEMPLATE,
        system: `"\nYou are an experienced developer who helps people choose the best starter template for their projects, Vite is preferred.\n\nAvailable templates:\n<template>\n  <name>blank</name>\n  <description>Empty starter for simple scripts and trivial tasks that don't require a full template setup</description>\n  <tags>basic, script</tags>\n</template>\n\n<template>\n  <name>Expo App</name>\n  <description>Expo starter template for building cross-platform mobile apps</description>\n  <tags>mobile, expo, mobile-app, android, iphone</tags>\n</template>\n\n\n<template>\n  <name>Basic Astro</name>\n  <description>Lightweight Astro starter template for building fast static websites</description>\n  <tags>astro, blog, performance</tags>\n</template>\n\n\n<template>\n  <name>NextJS Shadcn</name>\n  <description>Next.js starter fullstack template integrated with shadcn/ui components and styling system</description>\n  <tags>nextjs, react, typescript, shadcn, tailwind</tags>\n</template>\n\n\n<template>\n  <name>Vite Shadcn</name>\n  <description>Vite starter fullstack template integrated with shadcn/ui components and styling system</description>\n  <tags>vite, react, typescript, shadcn, tailwind</tags>\n</template>\n\n\n<template>\n  <name>Qwik Typescript</name>\n  <description>Qwik framework starter with TypeScript for building resumable applications</description>\n  <tags>qwik, typescript, performance, resumable</tags>\n</template>\n\n\n<template>\n  <name>Remix Typescript</name>\n  <description>Remix framework starter with TypeScript for full-stack web applications</description>\n  <tags>remix, typescript, fullstack, react</tags>\n</template>\n\n\n<template>\n  <name>Slidev</name>\n  <description>Slidev starter template for creating developer-friendly presentations using Markdown</description>\n  <tags>slidev, presentation, markdown</tags>\n</template>\n\n\n<template>\n  <name>Sveltekit</name>\n  <description>SvelteKit starter template for building fast, efficient web applications</description>\n  <tags>svelte, sveltekit, typescript</tags>\n</template>\n\n\n<template>\n  <name>Vanilla Vite</name>\n  <description>Minimal Vite starter template for vanilla JavaScript projects</description>\n  <tags>vite, vanilla-js, minimal</tags>\n</template>\n\n\n<template>\n  <name>Vite React</name>\n  <description>React starter template powered by Vite for fast development experience</description>\n  <tags>react, vite, frontend, website, app</tags>\n</template>\n\n\n<template>\n  <name>Vite Typescript</name>\n  <description>Vite starter template with TypeScript configuration for type-safe development</description>\n  <tags>vite, typescript, minimal</tags>\n</template>\n\n\n<template>\n  <name>Vue</name>\n  <description>Vue.js starter template with modern tooling and best practices</description>\n  <tags>vue, typescript, frontend</tags>\n</template>\n\n\n<template>\n  <name>Angular</name>\n  <description>A modern Angular starter template with TypeScript support and best practices configuration</description>\n  <tags>angular, typescript, frontend, spa</tags>\n</template>\n\n\nResponse Format:\n<selection>\n  <templateName>{selected template name}</templateName>\n  <title>{a proper title for the project}</title>\n</selection>\n\nExamples:\n\n<example>\nUser: I need to build a ${prompt}\nResponse:\n<selection>\n  <templateName>react-basic-starter</templateName>\n  <title>Simple React todo application</title>\n</selection>\n</example>\n\n<example>\nUser: Write a script to generate numbers from 1 to 100\nResponse:\n<selection>\n  <templateName>blank</templateName>\n  <title>script to generate numbers from 1 to 100</title>\n</selection>\n</example>\n\nInstructions:\n1. For trivial tasks and simple scripts, always recommend the blank template\n2. For more complex projects, recommend templates from the provided list\n3. Follow the exact XML format\n4. Consider both technical requirements and tags\n5. If no perfect match exists, recommend the closest option\n\nImportant: Provide only the selection tags in your response, no additional text.\nMOST IMPORTANT: YOU DONT HAVE TIME TO THINK JUST START RESPONDING BASED ON HUNCH \n"`,
      };
      const response = await axios.post(
        "http://localhost:5174/api/llmcall",
        payload,
        {
          headers: {
            Accept: "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            Connection: "keep-alive",
            Referer: "http://localhost:5173/",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
            "sec-ch-ua":
              '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": '"Android"',
            Cookie: cookies,
          },
          withCredentials: true,
          params: {},
        }
      );
      return response.data;
    },
    onError: () => {
      popToast("Error Occurred while calling LLM Model", {
        type: "error",
      });
    },
  });
};
