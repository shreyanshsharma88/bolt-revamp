/* eslint-disable @typescript-eslint/no-explicit-any */

// src/components/Chat/ChatContainer.tsx

// src/components/Chat/ChatContainer.tsx

import { Stack, Typography } from "@mui/material";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAppWebContainer, useChatService } from "../../hooks";

import type { ChatRequestBody, Message, StreamedData } from "../../types";

import { type AppChatMessage, type AppFile } from "../../utils/webContainer"; // Re-evaluate path for AppFile

import CodeEditorComponent from "../Code/CodeEditor";

import FileExplorer from "../Code/FileExplorer";

import LivePreview from "../Code/LivePreview";

import TerminalOutput from "../Code/TerminalOutput";

import { Loader } from "../LoaderModal";

import ChatMessages from "./ChatMessages";

import { PromptInput } from "./PromptInput";

import { useChat, type Message as VercelChatMessage } from "ai/react";

import { v4 as uuidv4 } from "uuid"; // For chatSessionId

import { VITE_OPEN_ROUTER_API_KEY } from "../../constants";

import { parseBoltResponse, type BoltActionCommand } from "../../utils"; // Ensure boltActionParser.ts is correctly placed

import { ChatGridContainer } from "./ChatGridContainer";

const dummy = {
  chatMessages: [
    {
      id: "03627cd0-60c6-4189-bccb-a0a96b1a6eea",
      role: "user",
      content: "todo app",
      type: "text",
    },
    {
      id: "46cd0cf2-1259-45bb-8cea-15fc3ed9be1e",
      role: "assistant",
      content:
        "I'll create a simple yet elegant todo app using React and TypeScript. I'll use Vite for the build process and include a clean, modern design with all essential todo features.",
      type: "text",
    },
    {
      id: "b173f786-240c-4329-8c59-3c504840a768",
      role: "assistant",
      content: "",
      type: "text",
    },
    {
      id: "45302d31-2383-4893-90ff-7dc1c4020378",
      role: "assistant",
      content:
        "The todo app includes the following features:\n      - Add new todos\n      - Mark todos as complete/incomplete\n      - Delete todos\n      - Filter todos by all/active/completed\n      - Clear completed todos\n      - Persistent state using React useState\n      - Clean, modern UI with Tailwind CSS\n      - Responsive design\n\n      To use the app:\n      1. Run the command above to start the development server\n      2. Open your browser to http://localhost:5173\n      3. Start adding and managing your todos\n\n      The app will automatically reload if you make any changes to the code.",
      type: "text",
    },
    {
      id: "8e8723c0-bed0-4599-987e-2f6af58d8a04",
      role: "assistant",
      content: "Project: Todo App with React and TypeScript",
      type: "project_info",
    },
    {
      id: "78e96bfd-b496-4efb-ae98-7679e666ea98",
      role: "assistant",
      content: "npm create-vite-app todo-app --template react-ts",
      type: "command",
    },
  ],
  currentAssistantMessage: "",
  projectFiles: [
    {
      path: "todo-app/src/App.tsx",
      content:
        "import { useState } from 'react';\n          interface Todo {\n            id: number;\n            text: string;\n            completed: boolean;\n          }\n\n          function App() {\n            const [todos, setTodos] = useState<Todo[]>([]);\n            const [input, setInput] = useState('');\n            const [viewMode, setViewMode] = useState<'all' | 'active' | 'completed'>('all');\n\n            const handleAddTodo = (e: React.FormEvent) => {\n              e.preventDefault();\n              if (input.trim()) {\n                setTodos([...todos, { id: Date.now(), text: input.trim(), completed: false }]);\n                setInput('');\n              }\n            };\n\n            const toggleTodo = (id: number) => {\n              setTodos(todos.map(todo =>\n                todo.id === id ? { ...todo, completed: !todo.completed } : todo\n              ));\n            };\n\n            const deleteTodo = (id: number) => {\n              setTodos(todos.filter(todo => todo.id !== id));\n            };\n\n            const filteredTodos = todos.filter(todo =>\n              viewMode === 'all' ? todos :\n              viewMode === 'active' ? todos.filter(todo => !todo.completed) :\n              todos.filter(todo => todo.completed)\n            );\n\n            return (\n              <div className=\"min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8\">\n                <div className=\"max-w-md mx-auto\">\n                  <h1 className=\"text-3xl font-bold text-gray-900 mb-8\">Todo List</h1>\n                  \n                  <form onSubmit={handleAddTodo} className=\"mb-6\">\n                    <div className=\"flex gap-2\">\n                      <input\n                        type=\"text\"\n                        value={input}\n                        onChange={(e) => setInput(e.target.value)}\n                        placeholder=\"Add a new todo...\"\n                        className=\"flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none\"\n                      />\n                      <button\n                        type=\"submit\"\n                        className=\"px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2\"\n                      >\n                        Add\n                      </button>\n                    </div>\n                  </form>\n\n                  <div className=\"bg-white rounded-lg shadow p-6 mb-6\">\n                    <div className=\"flex justify-between items-center mb-4\">\n                      <div className=\"flex gap-2\">\n                        <button\n                          onClick={() => setViewMode('all')}\n                          className={`px-4 py-2 rounded-lg ${viewMode === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}\n                        >\n                          All\n                        </button>\n                        <button\n                          onClick={() => setViewMode('active')}\n                          className={`px-4 py-2 rounded-lg ${viewMode === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}\n                        >\n                          Active\n                        </button>\n                        <button\n                          onClick={() => setViewMode('completed')}\n                          className={`px-4 py-2 rounded-lg ${viewMode === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}\n                        >\n                          Completed\n                        </button>\n                      </div>\n                      <button\n                        onClick={() => setTodos(todos.filter(todo => !todo.completed))}\n                        className=\"px-4 py-2 text-red-500 hover:text-red-600\"\n                      >\n                        Clear Completed\n                      </button>\n                    </div>\n\n                    <div className=\"space-y-2\">\n                      {filteredTodos.map(todo => (\n                        <div\n                          key={todo.id}\n                          className={`flex items-center justify-between p-3 rounded-lg border ${\n                            todo.completed ? 'line-through text-gray-400' : ''\n                          }`}\n                        >\n                          <span>{todo.text}</span>\n                          <div className=\"flex gap-2\">\n                            <input\n                              type=\"checkbox\"\n                              checked={todo.completed}\n                              onChange={() => toggleTodo(todo.id)}\n                              className=\"w-4 h-4 text-blue-500 rounded focus:ring-blue-500 cursor-pointer\"\n                            />\n                            <button\n                              onClick={() => deleteTodo(todo.id)}\n                              className=\"text-red-500 hover:text-red-600\"\n                            >\n                              Delete\n                            </button>\n                          </div>\n                        </div>\n                      ))}\n                    </div>\n                  </div>\n                </div>\n              </div>\n            );\n          }\n\n          export default App;",
    },
    {
      path: "todo-app/package.json",
      content:
        '{\n  "name": "todo-app",\n  "version": "0.0.0",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build",\n    "preview": "vite preview"\n  },\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0",\n    "vite": "^4.2.0"\n  },\n  "devDependencies": {\n    "@types/react": "^18.0.28",\n    "@types/react-dom": "^18.0.11",\n    "typescript": "^5.1.3",\n    "@vitejs/plugin-react": "^3.1.0"\n  }\n}',
    },
    {
      path: "todo-app/index.html",
      content:
        '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <link rel="icon" type="image/svg+xml" href="/vite.svg" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>Todo App</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script> \n  </body>\n</html>',
    },
    {
      path: "todo-app/src/main.tsx",
      content:
        "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App'; \n// import './index.css'; \n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n);\n",
    },
  ],
  activeFilePath: "todo-app/src/App.tsx",
  previewUrl:
    "https://k03e2io1v3fx9wvj0vr8qd5q58o56n-fkdo-ndug08x6--5173--55edb8f4.local-credentialless.webcontainer-api.io",
  terminalOutput: [
    "WC_INFO: Booting WebContainer...",
    "WC_INFO: WebContainer booted successfully.",
    "WC_INFO: User prompt: todo app",
    "WC_INFO: Stream ended. Full response content length for parsing: 7335",
    "WC_INFO: Found 1 bolt artifact(s). Processing...",
    "WC_INFO:   Action: shell, Path: N/A, Content Preview: npm create-vite-app todo-app --template react-ts...",
    "WC_INFO: Project base path identified: 'todo-app' from create command.",
    "WC_INFO:   Action: file, Path: todo-app/src/App.tsx, Content Preview: import { useState } from 'react';\n          interface Todo {\n         ...",
    "WC_INFO: File written: todo-app/src/App.tsx",
    'WC_INFO:   Action: file, Path: todo-app/package.json, Content Preview: {\n  "name": "todo-app",\n  "version": "0.0.0",\n  "scripts": {\n    "dev"...',
    "WC_INFO: File written: todo-app/package.json",
    "WC_INFO:   Action: start, Path: N/A, Content Preview: cd todo-app && npm run dev...",
    "WC_INFO: File written: todo-app/index.html",
    "WC_INFO: Generated default index.html at todo-app/index.html",
    "WC_INFO: File written: todo-app/src/main.tsx",
    "WC_INFO: Generated default main.tsx at todo-app/src/main.tsx",
    "WC_INFO: Running npm install in ./todo-app...",
    "WC_INFO: Running command: npm install install (in ./todo-app)",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: \\",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: |",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: /",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: \\",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: |",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: /",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: \\",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: |",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: /",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: \\",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: |",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: /",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: \\",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: |",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: /",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: \\",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: |",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: /",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: \\",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: |",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: /",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: \\",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: |",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: /",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: \\",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: |",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: /",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: \\",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: |",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: /",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: \\",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: |",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: /",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: \\",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: |",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: /",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: \\",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: |",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: /",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: \\",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: |",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: /",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: \\",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: |",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: /",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    'WC_INFO: Command "npm install" exited with code 0',
    "WC_INFO: Running start command: npm run dev in ./todo-app...",
    "WC_INFO: Running command: start: npm run dev (in ./todo-app)",
    "WC_LOG: [npm install]: \r\nadded 61 packages in 8s\r\n",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: \r\n",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: 7 packages are looking for funding\r\n",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]:   run `npm fund` for details\r\n",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [npm install]: -",
    "WC_LOG: [npm install]: ",
    "WC_LOG: [npm install]: ",
    "WC_LOG: [npm install]: \u001b[1G",
    "WC_LOG: [npm install]: \u001b[0K",
    "WC_LOG: [start: npm]: \r\n> todo-app@0.0.0 dev\r\n> vite\r\n\r\n",
    "WC_LOG: [start: npm]: \u001b[1G",
    "WC_LOG: [start: npm]: \u001b[0K",
    "WC_INFO: Server ready at https://k03e2io1v3fx9wvj0vr8qd5q58o56n-fkdo-ndug08x6--5173--55edb8f4.local-credentialless.webcontainer-api.io on port 5173",
    "WC_LOG: [start: npm]: \r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n",
    "WC_LOG: [start: npm]: \u001b[1;1H",
    "WC_LOG: [start: npm]: \u001b[0J",
    "WC_LOG: [start: npm]: \r\n  \u001b[32m\u001b[1mVITE\u001b[22m v4.5.14\u001b[39m  \u001b[2mready in \u001b[0m\u001b[1m1227\u001b[22m\u001b[2m\u001b[0m ms\u001b[22m\r\n\r\n",
    "WC_LOG: [start: npm]:   \u001b[32m➜\u001b[39m  \u001b[1mLocal\u001b[22m:   \u001b[36mhttp://localhost:\u001b[1m5173\u001b[22m/\u001b[39m\r\n",
    "WC_LOG: [start: npm]: \u001b[2m  \u001b[32m➜\u001b[39m  \u001b[1mNetwork\u001b[22m\u001b[2m: use \u001b[22m\u001b[1m--host\u001b[22m\u001b[2m to expose\u001b[22m\r\n",
    "WC_LOG: [start: npm]: \u001b[2m\u001b[32m  ➜\u001b[39m\u001b[22m\u001b[2m  press \u001b[22m\u001b[1mh\u001b[22m\u001b[2m to show help\u001b[22m\r\n",
  ],
  isChatLoading: false,
  vercelMessages: [
    {
      id: "rsvIBfNzU9HOuw15",
      createdAt: "2025-05-29T10:54:58.072Z",
      role: "user",
      content: "todo app",
      parts: [
        {
          type: "text",
          text: "todo app",
        },
      ],
    },
    {
      id: "msg-aaImf16BfqnVAHyxEjo3COpL",
      createdAt: "2025-05-29T10:54:58.119Z",
      role: "assistant",
      content:
        'I\'ll create a simple yet elegant todo app using React and TypeScript. I\'ll use Vite for the build process and include a clean, modern design with all essential todo features.\n\n<todo-app />\n\n<examples>\n  <example>\n    <assistant_response>\n      <boltArtifact id="todo-app" title="Todo App with React and TypeScript">\n        <boltAction type="shell">npm create-vite-app todo-app --template react-ts</boltAction>\n\n        <boltAction type="file" filePath="todo-app/src/App.tsx">\n          import { useState } from \'react\';\n          interface Todo {\n            id: number;\n            text: string;\n            completed: boolean;\n          }\n\n          function App() {\n            const [todos, setTodos] = useState<Todo[]>([]);\n            const [input, setInput] = useState(\'\');\n            const [viewMode, setViewMode] = useState<\'all\' | \'active\' | \'completed\'>(\'all\');\n\n            const handleAddTodo = (e: React.FormEvent) => {\n              e.preventDefault();\n              if (input.trim()) {\n                setTodos([...todos, { id: Date.now(), text: input.trim(), completed: false }]);\n                setInput(\'\');\n              }\n            };\n\n            const toggleTodo = (id: number) => {\n              setTodos(todos.map(todo =>\n                todo.id === id ? { ...todo, completed: !todo.completed } : todo\n              ));\n            };\n\n            const deleteTodo = (id: number) => {\n              setTodos(todos.filter(todo => todo.id !== id));\n            };\n\n            const filteredTodos = todos.filter(todo =>\n              viewMode === \'all\' ? todos :\n              viewMode === \'active\' ? todos.filter(todo => !todo.completed) :\n              todos.filter(todo => todo.completed)\n            );\n\n            return (\n              <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">\n                <div className="max-w-md mx-auto">\n                  <h1 className="text-3xl font-bold text-gray-900 mb-8">Todo List</h1>\n                  \n                  <form onSubmit={handleAddTodo} className="mb-6">\n                    <div className="flex gap-2">\n                      <input\n                        type="text"\n                        value={input}\n                        onChange={(e) => setInput(e.target.value)}\n                        placeholder="Add a new todo..."\n                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"\n                      />\n                      <button\n                        type="submit"\n                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"\n                      >\n                        Add\n                      </button>\n                    </div>\n                  </form>\n\n                  <div className="bg-white rounded-lg shadow p-6 mb-6">\n                    <div className="flex justify-between items-center mb-4">\n                      <div className="flex gap-2">\n                        <button\n                          onClick={() => setViewMode(\'all\')}\n                          className={`px-4 py-2 rounded-lg ${viewMode === \'all\' ? \'bg-blue-500 text-white\' : \'bg-gray-100 text-gray-700\'}`}\n                        >\n                          All\n                        </button>\n                        <button\n                          onClick={() => setViewMode(\'active\')}\n                          className={`px-4 py-2 rounded-lg ${viewMode === \'active\' ? \'bg-blue-500 text-white\' : \'bg-gray-100 text-gray-700\'}`}\n                        >\n                          Active\n                        </button>\n                        <button\n                          onClick={() => setViewMode(\'completed\')}\n                          className={`px-4 py-2 rounded-lg ${viewMode === \'completed\' ? \'bg-blue-500 text-white\' : \'bg-gray-100 text-gray-700\'}`}\n                        >\n                          Completed\n                        </button>\n                      </div>\n                      <button\n                        onClick={() => setTodos(todos.filter(todo => !todo.completed))}\n                        className="px-4 py-2 text-red-500 hover:text-red-600"\n                      >\n                        Clear Completed\n                      </button>\n                    </div>\n\n                    <div className="space-y-2">\n                      {filteredTodos.map(todo => (\n                        <div\n                          key={todo.id}\n                          className={`flex items-center justify-between p-3 rounded-lg border ${\n                            todo.completed ? \'line-through text-gray-400\' : \'\'\n                          }`}\n                        >\n                          <span>{todo.text}</span>\n                          <div className="flex gap-2">\n                            <input\n                              type="checkbox"\n                              checked={todo.completed}\n                              onChange={() => toggleTodo(todo.id)}\n                              className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500 cursor-pointer"\n                            />\n                            <button\n                              onClick={() => deleteTodo(todo.id)}\n                              className="text-red-500 hover:text-red-600"\n                            >\n                              Delete\n                            </button>\n                          </div>\n                        </div>\n                      ))}\n                    </div>\n                  </div>\n                </div>\n              </div>\n            );\n          }\n\n          export default App;\n        </boltAction>\n\n        <boltAction type="file" filePath="todo-app/package.json">\n          {\n            JSON.stringify({\n              "name": "todo-app",\n              "version": "0.0.0",\n              "scripts": {\n                "dev": "vite",\n                "build": "vite build",\n                "preview": "vite preview"\n              },\n              "dependencies": {\n                "react": "^18.2.0",\n                "react-dom": "^18.2.0",\n                "vite": "^4.2.0"\n              },\n              "devDependencies": {\n                "@types/react": "^18.0.28",\n                "@types/react-dom": "^18.0.11",\n                "typescript": "^5.1.3",\n                "@ vitejs/plugin-react": "^3.1.0"\n              }\n            }, null, 2)\n          }\n        </boltAction>\n\n        <boltAction type="start">cd todo-app && npm run dev</boltAction>\n      </boltArtifact>\n\n      The todo app includes the following features:\n      - Add new todos\n      - Mark todos as complete/incomplete\n      - Delete todos\n      - Filter todos by all/active/completed\n      - Clear completed todos\n      - Persistent state using React useState\n      - Clean, modern UI with Tailwind CSS\n      - Responsive design\n\n      To use the app:\n      1. Run the command above to start the development server\n      2. Open your browser to http://localhost:5173\n      3. Start adding and managing your todos\n\n      The app will automatically reload if you make any changes to the code.\n    </assistant_response>\n  </example>\n</examples>',
      parts: [
        {
          type: "step-start",
        },
        {
          type: "text",
          text: 'I\'ll create a simple yet elegant todo app using React and TypeScript. I\'ll use Vite for the build process and include a clean, modern design with all essential todo features.\n\n<todo-app />\n\n<examples>\n  <example>\n    <assistant_response>\n      <boltArtifact id="todo-app" title="Todo App with React and TypeScript">\n        <boltAction type="shell">npm create-vite-app todo-app --template react-ts</boltAction>\n\n        <boltAction type="file" filePath="todo-app/src/App.tsx">\n          import { useState } from \'react\';\n          interface Todo {\n            id: number;\n            text: string;\n            completed: boolean;\n          }\n\n          function App() {\n            const [todos, setTodos] = useState<Todo[]>([]);\n            const [input, setInput] = useState(\'\');\n            const [viewMode, setViewMode] = useState<\'all\' | \'active\' | \'completed\'>(\'all\');\n\n            const handleAddTodo = (e: React.FormEvent) => {\n              e.preventDefault();\n              if (input.trim()) {\n                setTodos([...todos, { id: Date.now(), text: input.trim(), completed: false }]);\n                setInput(\'\');\n              }\n            };\n\n            const toggleTodo = (id: number) => {\n              setTodos(todos.map(todo =>\n                todo.id === id ? { ...todo, completed: !todo.completed } : todo\n              ));\n            };\n\n            const deleteTodo = (id: number) => {\n              setTodos(todos.filter(todo => todo.id !== id));\n            };\n\n            const filteredTodos = todos.filter(todo =>\n              viewMode === \'all\' ? todos :\n              viewMode === \'active\' ? todos.filter(todo => !todo.completed) :\n              todos.filter(todo => todo.completed)\n            );\n\n            return (\n              <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">\n                <div className="max-w-md mx-auto">\n                  <h1 className="text-3xl font-bold text-gray-900 mb-8">Todo List</h1>\n                  \n                  <form onSubmit={handleAddTodo} className="mb-6">\n                    <div className="flex gap-2">\n                      <input\n                        type="text"\n                        value={input}\n                        onChange={(e) => setInput(e.target.value)}\n                        placeholder="Add a new todo..."\n                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"\n                      />\n                      <button\n                        type="submit"\n                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"\n                      >\n                        Add\n                      </button>\n                    </div>\n                  </form>\n\n                  <div className="bg-white rounded-lg shadow p-6 mb-6">\n                    <div className="flex justify-between items-center mb-4">\n                      <div className="flex gap-2">\n                        <button\n                          onClick={() => setViewMode(\'all\')}\n                          className={`px-4 py-2 rounded-lg ${viewMode === \'all\' ? \'bg-blue-500 text-white\' : \'bg-gray-100 text-gray-700\'}`}\n                        >\n                          All\n                        </button>\n                        <button\n                          onClick={() => setViewMode(\'active\')}\n                          className={`px-4 py-2 rounded-lg ${viewMode === \'active\' ? \'bg-blue-500 text-white\' : \'bg-gray-100 text-gray-700\'}`}\n                        >\n                          Active\n                        </button>\n                        <button\n                          onClick={() => setViewMode(\'completed\')}\n                          className={`px-4 py-2 rounded-lg ${viewMode === \'completed\' ? \'bg-blue-500 text-white\' : \'bg-gray-100 text-gray-700\'}`}\n                        >\n                          Completed\n                        </button>\n                      </div>\n                      <button\n                        onClick={() => setTodos(todos.filter(todo => !todo.completed))}\n                        className="px-4 py-2 text-red-500 hover:text-red-600"\n                      >\n                        Clear Completed\n                      </button>\n                    </div>\n\n                    <div className="space-y-2">\n                      {filteredTodos.map(todo => (\n                        <div\n                          key={todo.id}\n                          className={`flex items-center justify-between p-3 rounded-lg border ${\n                            todo.completed ? \'line-through text-gray-400\' : \'\'\n                          }`}\n                        >\n                          <span>{todo.text}</span>\n                          <div className="flex gap-2">\n                            <input\n                              type="checkbox"\n                              checked={todo.completed}\n                              onChange={() => toggleTodo(todo.id)}\n                              className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500 cursor-pointer"\n                            />\n                            <button\n                              onClick={() => deleteTodo(todo.id)}\n                              className="text-red-500 hover:text-red-600"\n                            >\n                              Delete\n                            </button>\n                          </div>\n                        </div>\n                      ))}\n                    </div>\n                  </div>\n                </div>\n              </div>\n            );\n          }\n\n          export default App;\n        </boltAction>\n\n        <boltAction type="file" filePath="todo-app/package.json">\n          {\n            JSON.stringify({\n              "name": "todo-app",\n              "version": "0.0.0",\n              "scripts": {\n                "dev": "vite",\n                "build": "vite build",\n                "preview": "vite preview"\n              },\n              "dependencies": {\n                "react": "^18.2.0",\n                "react-dom": "^18.2.0",\n                "vite": "^4.2.0"\n              },\n              "devDependencies": {\n                "@types/react": "^18.0.28",\n                "@types/react-dom": "^18.0.11",\n                "typescript": "^5.1.3",\n                "@ vitejs/plugin-react": "^3.1.0"\n              }\n            }, null, 2)\n          }\n        </boltAction>\n\n        <boltAction type="start">cd todo-app && npm run dev</boltAction>\n      </boltArtifact>\n\n      The todo app includes the following features:\n      - Add new todos\n      - Mark todos as complete/incomplete\n      - Delete todos\n      - Filter todos by all/active/completed\n      - Clear completed todos\n      - Persistent state using React useState\n      - Clean, modern UI with Tailwind CSS\n      - Responsive design\n\n      To use the app:\n      1. Run the command above to start the development server\n      2. Open your browser to http://localhost:5173\n      3. Start adding and managing your todos\n\n      The app will automatically reload if you make any changes to the code.\n    </assistant_response>\n  </example>\n</examples>',
        },
      ],
      annotations: [
        {
          type: "usage",
          value: {
            completionTokens: 2023,
            promptTokens: 6842,
            totalTokens: 8865,
          },
        },
      ],
      revisionId: "T9EJEs40H3QmYZ0k",
    },
  ],
  isWebContainerBooting: false,
  activeFileContent:
    "import { useState } from 'react';\n          interface Todo {\n            id: number;\n            tex...",
};

// In handleStreamEnd function, use this:

export const ChatContainer = () => {
  // chatMessages will now store the *processed and structured* messages for UI display

  const [chatMessages, setChatMessages] = useState<AppChatMessage[]>([]);

  // currentAssistantMessage will hold the live streaming content for the active assistant message

  const [currentAssistantMessage, setCurrentAssistantMessage] =
    useState<string>("");

  const [projectFiles, setProjectFiles] = useState<AppFile[]>([]);

  const [activeFilePath, setActiveFilePath] = useState<string | null>("");

  const [chatSessionId] = useState(uuidv4());

  const [selectedModel, setSelectedModel] = useState<string>(
    "agentica-org/deepcoder-14b-preview:free"
  );

  const [selectedProvider, setSelectedProvider] =
    useState<string>("OpenRouter");

  const {
    webContainer,

    previewUrl,

    terminalOutput,

    isBooting: isWebContainerBooting,

    writeFile,

    runCommand,

    logToTerminal,
  } = useAppWebContainer();

  // Re-define generateSimpleId here to avoid useCallback dependency issues

  const generateSimpleId = useCallback(() => uuidv4(), []);

  // useChat hook from @vercel/ai - This replaces your custom useChatService

  const {
    messages: vercelMessages, // Raw messages from @vercel/ai (user, assistant, tool, system)
    input, // Current input value in the text area (for PromptInput)
    handleInputChange, // Handler for input changes (for PromptInput)
    handleSubmit, // Function to submit the form
    isLoading: isChatLoading, // Loading state from @vercel/ai
    error: vercelChatError, // Error object from @vercel/ai
    // append, // Use append for sending new messages with custom body (if not using handleSubmit directly)
    // reload, stop, setMessages etc. are also available from useChat
  } = useChat({
    api: "http://localhost:5174/api/chat", // Your backend API endpoint
    initialMessages: [], // Start with empty messages or load from history

    // onFinish is called when the stream ends for a message.
    onFinish: (message: VercelChatMessage) => {
      // message.content here is the FULL, accumulated text from the AI
      // This is where we trigger our custom parsing and WebContainer actions.
      handleStreamEnd(message.content, message.id);
    },

    // onError is called if there's a network error or non-2xx response.
    onError: (error: Error) => {
      logToTerminal(`Vercel useChat Error: ${error.message}`, "error");
      setChatMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: `Chat Error: ${error.message}`,
          type: "error",
        },
      ]);
    },

    // onStreamData is deprecated in newer versions. Live display is handled by observing `vercelMessages` content changes.
    // If you need more granular stream data (like `2:{}` chunks for progress), use `onStreamData`
    // with older versions that support it, or handle it differently if your backend sends it
    // as part of `message.content` or a different `useChat` option.
  });

  // Effect to update currentAssistantMessage for live display as vercelMessages change

  useEffect(() => {
    if (isChatLoading) {
      const lastAssistantMessage = vercelMessages.findLast(
        (m) => m.role === "assistant"
      );
      if (lastAssistantMessage) {
        setCurrentAssistantMessage(lastAssistantMessage.content);
      }
    } else {
      setCurrentAssistantMessage(""); // Clear after loading finishes
    }
  }, [isChatLoading, vercelMessages]);

  // handleStreamEnd logic is now triggered by onFinish from useChat

  // This useCallback handles all post-stream processing (parsing, file writing, commands, final chat messages)

  const handleStreamEnd = useCallback(
    async (fullResponseContent: string, messageId: string) => {
      // Receives content and ID from onFinish
      logToTerminal(
        "Stream ended. Full response content length for parsing: " +
          fullResponseContent.length,
        "info"
      );

      setCurrentAssistantMessage(""); // Clear live streaming display after stream ends

      const parsedArtifacts = parseBoltResponse(fullResponseContent); // Parse the complete content

      const finalChatMessagesForDisplay: AppChatMessage[] = [];
      const allNewFiles: AppFile[] = [];
      let startCommandAction: BoltActionCommand | null = null;
      let installNeeded = false;
      let projectBasePath = "";

      // Step 1: Extract main narrative text from the <assistant_response> tag
      let assistantNarrativeText = "";
      const assistantResponseMatch = fullResponseContent.match(
        /<assistant_response>([\s\S]*?)<\/assistant_response>/
      );

      const preambleMatch = fullResponseContent.match(/^([^<]*)/);
      finalChatMessagesForDisplay.push({
        id: generateSimpleId(),
        role: "assistant",
        content: preambleMatch?.[0].trim() ?? "",
        type: "text",
      });

      const postambleMatch = fullResponseContent.match(/[^>]*$/);
      finalChatMessagesForDisplay.push({
        id: generateSimpleId(),
        role: "assistant",
        content: postambleMatch?.[0].trim() ?? "",
        type: "text",
      });

      console.log({
        fullResponseContent,
        preambleMatch,
        postambleMatch,
        text1: preambleMatch?.[0].trim(),
        text2: postambleMatch?.[0].trim(),
        finalChatMessagesForDisplay,
      });
      setChatMessages((p) => [...p, ...finalChatMessagesForDisplay]);
      // return;
      if (assistantResponseMatch && assistantResponseMatch[1]) {
        assistantNarrativeText = assistantResponseMatch[1];
        assistantNarrativeText = assistantNarrativeText
          .replace(/<boltArtifact[\s\S]*?<\/boltArtifact>/g, "")
          .replace(/<examples>[\s\S]*?<\/examples>/g, "")
          .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, "")
          .replace(/<a[^>]*>([\s\S]*?)<\/a>/g, "$1")
          .replace(/<[^>]*>/g, "")
          .trim();

        if (assistantNarrativeText) {
          finalChatMessagesForDisplay.push({
            id: generateSimpleId(), // New ID for this specific message part
            role: "assistant",
            content: assistantNarrativeText,
            type: "text",
          });
        }
      }

      // Step 2: Process parsed artifacts and add structured messages and perform WebContainer actions
      if (parsedArtifacts.length > 0) {
        logToTerminal(
          `Found ${parsedArtifacts.length} bolt artifact(s). Processing...`,
          "info"
        );

        for (const artifact of parsedArtifacts) {
          if (artifact.title) {
            finalChatMessagesForDisplay.push({
              id: generateSimpleId(),
              role: "assistant",
              content: `Project: ${artifact.title}`,
              type: "project_info",
            });
          }

          for (const action of artifact.actions) {
            logToTerminal(
              `  Action: ${action.type}, Path: ${
                action.filePath || "N/A"
              }, Content Preview: ${(action.content || "").substring(
                0,
                70
              )}...`,
              "info"
            );

            if (action.type === "shell") {
              const parts =
                action.content.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ||
                ([] as string[]);
              if (parts.length > 0) {
                if (
                  (parts[0] === "npm" &&
                    (parts[1] === "create-vite-app" ||
                      parts[1] === "create")) ||
                  (parts[0] === "npx" && parts[1] === "create-vite-app")
                ) {
                  const appNameIndex =
                    parts.indexOf("create-vite-app") + 1 ||
                    parts.indexOf("create") + 1;
                  if (
                    parts[appNameIndex] &&
                    !parts[appNameIndex].startsWith("--")
                  ) {
                    projectBasePath = parts[appNameIndex].replace(/["']/g, "");
                    logToTerminal(
                      `Project base path identified: '${projectBasePath}' from create command.`,
                      "info"
                    );
                  } else {
                    logToTerminal(
                      `Could not determine app name from: ${action.content}`,
                      "warn"
                    );
                  }
                } else if (parts[0] === "cd" && parts[1]) {
                  projectBasePath = parts[1].replace(/["']/g, "");
                  logToTerminal(
                    `Project base path changed to: '${projectBasePath}' from 'cd' command.`,
                    "info"
                  );
                } else {
                  const cwd = projectBasePath
                    ? `./${projectBasePath}`
                    : undefined;
                  await runCommand(
                    parts[0] ?? "",
                    parts.slice(1),
                    `shell: ${parts[0]}`,
                    cwd
                  );
                }
              }
              finalChatMessagesForDisplay.push({
                id: generateSimpleId(),
                role: "assistant",
                content: action.content,
                type: "command",
              });
            } else if (action.type === "file" && action.filePath) {
              let finalPath = action.filePath;
              if (
                projectBasePath &&
                !action.filePath.startsWith("/") &&
                !action.filePath.startsWith(projectBasePath + "/")
              ) {
                finalPath = `${projectBasePath}/${action.filePath}`;
              }
              await writeFile(finalPath, action.content);
              allNewFiles.push({ path: finalPath, content: action.content });

              finalChatMessagesForDisplay.push({
                id: generateSimpleId(),
                role: "assistant",
                content: `File created: ${finalPath}`,
                type: "file_action",
              });
              if (finalPath.endsWith("package.json")) {
                installNeeded = true;
              }
            } else if (action.type === "start") {
              startCommandAction = action;
              finalChatMessagesForDisplay.push({
                id: generateSimpleId(),
                role: "assistant",
                content: action.content,
                type: "command",
              });
            }
          }
        }
      } else {
        logToTerminal(
          "No valid bolt artifacts found in the processed response.",
          "info"
        );
      }

      // Keeping index.html and main.tsx creation logic as it's a functional fix for WebContainer project setup
      const defaultMainTsxContent = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; 
// import './index.css'; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;

      const defaultIndexHtmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Todo App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script> 
  </body>
</html>`;

      let indexHtmlWrittenByLLM = false;
      let mainTsxWrittenByLLM = false;

      for (const artifact of parsedArtifacts) {
        for (const action of artifact.actions) {
          if (action.type === "file" && action.filePath) {
            if (action.filePath.includes("index.html")) {
              indexHtmlWrittenByLLM = true;
            }
            if (
              action.filePath.includes("src/main.tsx") ||
              action.filePath.includes("src/main.jsx")
            ) {
              mainTsxWrittenByLLM = true;
            }
          }
        }
      }

      if (projectBasePath) {
        if (!indexHtmlWrittenByLLM) {
          const indexHtmlPath = `${projectBasePath}/index.html`;
          await writeFile(indexHtmlPath, defaultIndexHtmlContent);
          allNewFiles.push({
            path: indexHtmlPath,
            content: defaultIndexHtmlContent,
          });
          logToTerminal(
            `Generated default index.html at ${indexHtmlPath}`,
            "info"
          );
          finalChatMessagesForDisplay.push({
            id: generateSimpleId(),
            role: "assistant",
            content: `Generated default index.html for the project.`,
            type: "file_action",
          });
        }

        if (!mainTsxWrittenByLLM) {
          const mainTsxPath = `${projectBasePath}/src/main.tsx`;
          await writeFile(mainTsxPath, defaultMainTsxContent);
          allNewFiles.push({
            path: mainTsxPath,
            content: defaultMainTsxContent,
          });
          logToTerminal(`Generated default main.tsx at ${mainTsxPath}`, "info");
          finalChatMessagesForDisplay.push({
            id: generateSimpleId(),
            role: "assistant",
            content: `Generated default main.tsx for the project.`,
            type: "file_action",
          });
        }
      }

      if (allNewFiles.length > 0) {
        setProjectFiles((prev) => {
          const filesMap = new Map(prev.map((f) => [f.path, f]));
          allNewFiles.forEach((nf) => filesMap.set(nf.path, nf));
          const updated = Array.from(filesMap.values());
          if (
            updated.length > 0 &&
            (!activeFilePath || !updated.find((f) => f.path === activeFilePath))
          ) {
            const firstNewFileInProject = updated.find((f) =>
              allNewFiles.some((newF) => newF.path === f.path)
            );
            setActiveFilePath(
              firstNewFileInProject?.path || updated[0]?.path || null
            );
          }
          return updated;
        });
      }

      const effectiveCwd = projectBasePath ? `./${projectBasePath}` : undefined;

      if (installNeeded) {
        logToTerminal(
          `Running npm install ${
            effectiveCwd ? `in ${effectiveCwd}` : "in root"
          }...`,
          "info"
        );
        await runCommand("npm", ["install"], "npm install", effectiveCwd);
      }

      if (startCommandAction) {
        const commandContent = startCommandAction.content;
        const actualCommandToRun = commandContent
          .split("&&")
          .map((s) => s.trim())
          .filter((s) => !s.startsWith("cd "))
          .join(" && ");

        const parts =
          actualCommandToRun.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
        if (parts.length > 0) {
          logToTerminal(
            `Running start command: ${actualCommandToRun} ${
              effectiveCwd ? `in ${effectiveCwd}` : "in root"
            }...`,
            "info"
          );
          await runCommand(
            parts[0] ?? "",
            parts.slice(1),
            `start: ${parts[0]}`,
            effectiveCwd
          );
        }
      }
      if (
        allNewFiles.length === 0 &&
        !startCommandAction &&
        parsedArtifacts.length > 0
      ) {
        logToTerminal(
          "Artifacts parsed, but no files were written and no start command was found.",
          "info"
        );
      }

      // FIX: Update chatMessages state - combine @vercel/ai's messages with processed custom messages
      setChatMessages((prev) => {
        // Find the Vercel message corresponding to this finished assistant response.
        // This ensures we get the latest content from useChat's internal accumulation.
        const vercelFinishedMessage = vercelMessages.find(
          (msg) => msg.id === messageId
        );
        console.log("INSIDE LOG", finalChatMessagesForDisplay);

        if (!vercelFinishedMessage) {
          // This should not happen if onFinish provides a valid message ID
          logToTerminal(
            `Error: Finished message with ID ${messageId} not found in vercelMessages.`,
            "error"
          );
          return [prev, ...finalChatMessagesForDisplay]; // Return previous state
        }

        // Map @vercel/ai's finished message to AppChatMessage format
        const mappedVercelMessage: AppChatMessage = {
          id: vercelFinishedMessage.id,
          role: vercelFinishedMessage.role as "user" | "assistant",
          content: vercelFinishedMessage.content, // Full text content from @vercel/ai
          type: "text", // Default type for the main text message
        };

        // Build the new chatMessages array:
        // 1. All existing user messages.
        // 2. All existing assistant messages that are NOT the one just finished (to avoid duplication).
        // 3. The newly completed assistant message (main text).
        // 4. Any custom structured messages (commands, file actions, project info) from `finalChatMessagesForDisplay`.
        const newChatHistory: AppChatMessage[] = [];

        // Add previous user messages
        prev.forEach((msg) => {
          if (msg.role === "user") {
            newChatHistory.push(msg);
          }
        });

        // Add the newly completed assistant message (main narrative text)
        newChatHistory.push(mappedVercelMessage);

        // Add custom structured messages (commands, file actions, project info)
        // Filter out the main text message if it was already added from parsedArtifacts in some edge case
        finalChatMessagesForDisplay.forEach((msg) => {
          if (msg.id !== messageId || msg.type !== "text") {
            // Avoid duplicating the main text message
            newChatHistory.push(msg);
          }
        });

        return newChatHistory;
      });
    },
    // Dependencies for useCallback - essential for correct behavior
    [
      writeFile,
      runCommand,
      logToTerminal,
      setProjectFiles,
      setActiveFilePath,
      activeFilePath,
      setChatMessages,
      setCurrentAssistantMessage,
      generateSimpleId,
      vercelMessages, // CRITICAL: This dependency ensures handleStreamEnd sees the latest vercelMessages
    ]
  );

  const handleStreamError = useCallback(
    (error: Error) => {
      logToTerminal(`Chat stream error: ${error.message}`, "error");
      setChatMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: "assistant",
          content: `Error: ${error.message}`,
          type: "error",
        },
      ]);
      // setCurrentAssistantMessage(""); // No need to clear this here, useChat manages it
    },
    [logToTerminal]
  );

  const handlePromptSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      // useChat's handleSubmit takes a form event
      event.preventDefault(); // Prevent default form submission

      if (!webContainer && !isWebContainerBooting) {
        logToTerminal(
          "WebContainer not ready. Please wait for it to boot.",
          "error"
        );
        setChatMessages((prev) => [
          ...prev,
          {
            id: generateSimpleId(),
            role: "assistant",
            content: "WebContainer not ready!",
            type: "error",
          },
        ]);
        return;
      }
      logToTerminal(`User prompt: ${input}`, "info");

      // Add user message to your local chatMessages state immediately for display
      const userMessageForDisplay: AppChatMessage = {
        id: generateSimpleId(), // Use generateSimpleId for consistency
        role: "user",
        content: input, // Display the original prompt content
        type: "text",
      };
      setChatMessages((prev) => [...prev, userMessageForDisplay]);

      // Construct the message object for @vercel/ai (which will also be sent to backend by `handleSubmit`)
      const messageForAI: VercelChatMessage = {
        id: userMessageForDisplay.id, // Re-use the ID for consistency
        role: "user",
        content: `[Model: ${selectedModel}]\n\n[Provider: ${selectedProvider}]\n\n${input}`, // Prefix content for backend
      };

      // Construct the custom body for the backend API, passing the transformed message
      const filesForContext = projectFiles.reduce((acc, file) => {
        acc[file.path] = { code: file.content };
        return acc;
      }, {} as Record<string, { code: string }>);

      const customBody: ChatRequestBody = {
        id: chatSessionId,
        messages: [messageForAI as any], // @vercel/ai expects `Message[]`, but `content` is string in `VercelChatMessage`
        files: filesForContext,
        contextOptimization: true,
        promptId: "default",
        apiKeys: {
          AmazonBedrock: "",
          OpenRouter: VITE_OPEN_ROUTER_API_KEY,
        },
        supabase: {
          isConnected: false,
          hasSelectedProject: false,
          credentials: {},
        },
      };

      // Call @vercel/ai's handleSubmit to send the message and custom body
      handleSubmit(event, {
        // Pass the event and options object
        body: customBody, // Pass your custom backend payload here
      });

      // Clear live streaming message and parts for the new response
      setCurrentAssistantMessage("");
    },
    [
      webContainer,
      isWebContainerBooting,
      logToTerminal,
      generateSimpleId,
      input, // Input from useChat
      projectFiles,
      chatSessionId,
      selectedModel,
      selectedProvider,
      handleSubmit, // From useChat
      setChatMessages, // Added setChatMessages to dependencies
    ]
  );

  const handleFileSelect = (path: string) => {
    setActiveFilePath(path);
  };

  const handleCodeChange = useCallback(
    (path: string, newContent: string) => {
      if (!path) return;
      setProjectFiles((prev) =>
        prev.map((f) => (f.path === path ? { ...f, content: newContent } : f))
      );
      if (webContainer) {
        writeFile(path, newContent);
      }
    },
    [webContainer, writeFile]
  );

  const activeFile = projectFiles.find((f) => f.path === activeFilePath);

  useEffect(() => {
    console.log("ChatContainer State Update:", {
      chatMessages,

      currentAssistantMessage,

      projectFiles,

      activeFilePath,

      previewUrl,

      terminalOutput,

      isChatLoading,

      vercelMessages,

      isWebContainerBooting,

      activeFileContent: activeFile?.content
        ? activeFile.content.substring(0, 100) + "..."
        : "No active file",
    });
  }, [
    chatMessages,

    currentAssistantMessage,

    projectFiles,

    activeFilePath,

    previewUrl,

    terminalOutput,

    isChatLoading,

    vercelMessages,

    isWebContainerBooting,

    activeFile,
  ]);

  const promptInputComponent = useMemo(
    () => (
      <PromptInput
        onSubmit={handlePromptSubmit}
        isLoading={isChatLoading || (isWebContainerBooting && !webContainer)}
        value={input} // Bind input from useChat
        onChange={handleInputChange} // Bind handleInputChange from useChat
      />
    ),

    [
      handlePromptSubmit,
      isChatLoading,
      isWebContainerBooting,
      webContainer,
      input,
      handleInputChange,
    ]
  );

  const terminalOutputComponent = useMemo(
    () => <TerminalOutput output={terminalOutput} />,

    [terminalOutput]
  );

  const codeEditorComponent = useMemo(
    () => (
      <CodeEditorComponent
        filePath={activeFile?.path}
        initialContent={activeFile?.content || ""}
        onContentChange={handleCodeChange}
      />
    ),

    [activeFile, handleCodeChange]
  );

  const livePreviewComponent = useMemo(
    () => (
      <LivePreview
        url={previewUrl}
        isLoading={
          (isChatLoading || (isWebContainerBooting && !webContainer)) &&
          !previewUrl
        }
      />
    ),

    [previewUrl, isChatLoading, isWebContainerBooting, webContainer]
  );

  const fileExplorerComponent = useMemo(
    () => (
      <FileExplorer
        files={projectFiles}
        onFileSelect={handleFileSelect}
        activeFilePath={activeFilePath}
      />
    ),

    [activeFilePath, projectFiles]
  );

  const chatMessagesComponent = useMemo(
    () => (
      <ChatMessages
        messages={chatMessages} // Pass local chatMessages state
        streamingMessage={
          isChatLoading
            ? vercelMessages.findLast((m) => m.role === "assistant")?.content ||
              ""
            : ""
        } // Live content from useChat
        createdFiles={projectFiles.map((i) => i.path)}
      />
    ),

    [chatMessages, isChatLoading, projectFiles, vercelMessages]
  );

  return (
    <Stack alignItems="center" height="100%" justifyContent="center">
      {chatMessages.length > 0 ? (
        <ChatGridContainer
          ChatMessages={chatMessagesComponent}
          CodeEditorComponent={codeEditorComponent}
          FileExplorer={fileExplorerComponent}
          LivePreview={livePreviewComponent}
          TerminalOutput={terminalOutputComponent}
          PromptInput={promptInputComponent}
          activeFilePath={activeFilePath}
          chatError={null}
        />
      ) : (
        <Stack direction="column">
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "1.8rem", sm: "2.125rem", md: "3rem" }, // h5 -> h2
              fontWeight: 600,
            }}
            mb={2}
          >
            Let's Code your [ IDEAS ]
          </Typography>

          {promptInputComponent}
        </Stack>
      )}
      {(isWebContainerBooting && !webContainer) ||
        (isChatLoading && <Loader />)}
    </Stack>
  );
};

export default ChatContainer;
