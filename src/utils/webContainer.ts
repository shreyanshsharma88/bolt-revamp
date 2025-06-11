/* eslint-disable @typescript-eslint/no-explicit-any */

// Basic regex to find markdown code blocks with optional filenames
// ```language:path/to/file.ext
// code content
// ```
// or
// ```language
// code content
// ```

export interface AppChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type?: 'text' | 'log' | 'error' | 'progress' | 'codeContext' | 'chatSummary' | 'command' | 'usage' | 'internal log'; // For styling/handling
    data?: any; // Store structured data if any
  }
  
  export interface AppFile {
    path: string;
    content: string;
  }
export const codeBlockRegex = /```(?:([\w.-]+)(?::([\w./-]+))?)\s*([\s\S]*?)```/g;


export interface ParsedCodeBlock {
  language?: string;
  path?: string;
  content: string;
}

export const extractCodeBlocks = (text: string): ParsedCodeBlock[] => {
  const blocks: ParsedCodeBlock[] = [];
  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const languageOrPath = match[1]; // Could be language or path if no colon
    const pathIfColon = match[2];   // Path if colon was present
    const content = match[3].trim();

    let language: string | undefined;
    let path: string | undefined;

    if (pathIfColon) { // Format: ```language:path/to/file.ext
      language = languageOrPath;
      path = pathIfColon;
    } else if (languageOrPath && (languageOrPath.includes('.') || languageOrPath.includes('/'))) { // Format: ```path/to/file.ext
      path = languageOrPath;
      // Infer language from path extension if possible
      const ext = path.split('.').pop();
      if (ext) language = ext; // Simple inference
    } else { // Format: ```language
      language = languageOrPath;
    }

    blocks.push({ language, path, content });
  }
  return blocks;
};


// Example: Convert to FileSystemTree for WebContainer
export const appFilesToFSChunks = (files: AppFile[]): Record<string, { file?: { contents: string | Uint8Array }, directory?: Record<string, any> }> => {
  const fsTree: Record<string, {
      file?: { contents: string | Uint8Array },
      directory?: Record<string, any>
}> = {};
  files.forEach(file => {
    // Basic: assumes flat paths or paths already contain full directory structure
    // e.g., "src/components/Button.tsx"
    const pathParts = file.path.split('/');
    let currentLevel = fsTree;
    let currentPath = "";

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (i === pathParts.length - 1) { // It's a file
        // Ensure we don't overwrite a directory with a file of the same name
        if (currentLevel[part]?.directory) {
          console.error(`Cannot create file ${currentPath}, a directory with this name already exists.`);
          continue;
        }
        currentLevel[part] = { file: { contents: file.content } };
      } else { // It's a directory
        if (!currentLevel[part]) {
          currentLevel[part] = { directory: {} };
        } else if (currentLevel[part].file) {
          console.error(`Cannot create directory ${currentPath}, a file with this name already exists.`);
          // Skip this path or handle error appropriately
          return; // Stop processing this file path
        }
        currentLevel = (currentLevel[part] as unknown as { directory: any }).directory;
      }
    }
  });
  return fsTree;
};

export const determineCommands = (files: AppFile[]): { install: boolean, dev: boolean, devCommand?: string[], installCommand?: string[] } => {
  let install = false;
  let dev = false;
  let devCommand: string[] | undefined = ['npm', 'run', 'dev']; // Default
  const installCommand: string[] | undefined = ['npm', 'install'];

  const packageJsonFile = files.find(f => f.path === 'package.json' || f.path.endsWith('/package.json'));
  if (packageJsonFile) {
    install = true;
    try {
      const pkg = JSON.parse(packageJsonFile.content);
      if (pkg.scripts?.dev) {
        devCommand = ['npm', 'run', 'dev'];
        dev = true;
      } else if (pkg.scripts?.start) {
        devCommand = ['npm', 'run', 'start'];
        dev = true;
      } else if (Object.keys(pkg.dependencies || {}).includes('vite')) {
        devCommand = ['npx', 'vite']; // Vite typically uses 'npm run dev' but 'npx vite' also works
        dev = true;
      } else if (Object.keys(pkg.dependencies || {}).includes('react-scripts')) {
        devCommand = ['npm', 'start'];
        dev = true;
      }
    } catch (e) {
      console.warn("Could not parse package.json to determine dev command", e);
    }
  } else {
    // If no package.json, but there is an index.html, suggest a simple static server
    if (files.some(f => f.path === 'index.html' || f.path.endsWith('/index.html'))) {
        devCommand = ['npx', 'serve', '.']; // Requires npx and serve to be available or installed
        dev = true; // We can try to serve it
        install = false; // No package.json, so no install usually
    }
  }


  return { install, dev, devCommand, installCommand };
};