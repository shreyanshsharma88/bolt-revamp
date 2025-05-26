import { useState, useEffect, useRef, useCallback } from 'react';
import { WebContainer, type WebContainerProcess, type FileSystemTree } from '@webcontainer/api';

export interface AppWebContainerOutput {
  log: (message: string) => void;
  error: (message: string) => void;
  message: (message: string) => void;
}


export const useAppWebContainer = () => {
  const [webContainer, setWebContainer] = useState<WebContainer | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isBooting, setIsBooting] = useState(true);
  const [currentProcess, setCurrentProcess] = useState<WebContainerProcess | null>(null);

  const logToTerminal = useCallback((message: string, type: 'log' | 'error' | 'info' = 'log') => {
    const prefix = type === 'error' ? 'WC_ERROR:' : type === 'info' ? 'WC_INFO:' : 'WC_LOG:';
    setTerminalOutput(prev => [...prev, `${prefix} ${message}`]);
    if (type === 'error') console.error(prefix, message);
    else console.log(prefix, message);
  }, []);

  useEffect(() => {
    const boot = async () => {
      setIsBooting(true);
      logToTerminal('Booting WebContainer...', 'info');
      try {
        const wc = await WebContainer.boot();
        setWebContainer(wc);
        logToTerminal('WebContainer booted successfully.', 'info');

        wc.on('server-ready', (port, url) => {
          logToTerminal(`Server ready at ${url} on port ${port}`, 'info');
          setPreviewUrl(url);
        });

        wc.on('error', (error) => {
          logToTerminal(`WebContainer error: ${error.message}`, 'error');
        });
         wc.on('preview-message', (msg) => {
          logToTerminal(`Preview Iframe: ${JSON.stringify(msg)}`, 'info');
        });
      } catch (err) {
        logToTerminal(`Failed to boot WebContainer: ${err instanceof Error ? err.message : String(err)}`, 'error');
      } finally {
        setIsBooting(false);
      }
    };
    boot();

    return () => {
      webContainer?.teardown?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Boot once

  const mountFiles = useCallback(async (files: FileSystemTree) => {
    if (!webContainer) {
      logToTerminal('WebContainer not available to mount files.', 'error');
      return;
    }
    logToTerminal(`Mounting files: ${Object.keys(files).join(', ')}`, 'info');
    await webContainer.mount(files);
  }, [webContainer, logToTerminal]);

  const writeFile = useCallback(async (path: string, content: string) => {
    if (!webContainer) {
      logToTerminal('WebContainer not available to write file.', 'error');
      return;
    }
    try {
      const dir = path.substring(0, path.lastIndexOf('/'));
      if (dir) {
        await webContainer.fs.mkdir(dir, { recursive: true }).catch(e => {
          if (!(e instanceof Error && e.message.includes('EEXIST'))){ // Only warn if not "already exists"
            logToTerminal(`Could not create directory ${dir}: ${e instanceof Error ? e.message : String(e)}`, 'error');
          }
        });
      }
      await webContainer.fs.writeFile(path, content);
      logToTerminal(`File written: ${path}`, 'info');
    } catch (err) {
      logToTerminal(`Failed to write file ${path}: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  }, [webContainer, logToTerminal]);


  const runCommand = useCallback(async (command: string, args: string[] = [], title?: string) => {
    if (!webContainer) {
      logToTerminal('WebContainer not available to run command.', 'error');
      return null;
    }
    if (currentProcess) {
        logToTerminal(`A process is already running. Please wait or stop it.`, 'error');
        // Or, you could implement a way to kill the currentProcess, e.g., currentProcess.kill()
        // return null;
    }
    logToTerminal(`Running command: ${title || command} ${args.join(' ')}`, 'info');
    const process = await webContainer.spawn(command, args);
    setCurrentProcess(process);

    process.output.pipeTo(new WritableStream({
      write(chunk) {
        logToTerminal(`[${title || command}]: ${chunk}`);
      }
    }));

    const exitCode = await process.exit;
    logToTerminal(`Command "${title || command}" exited with code ${exitCode}`, exitCode === 0 ? 'info' : 'error');
    setCurrentProcess(null);
    return process;
  }, [webContainer, logToTerminal, currentProcess]);

  return {
    webContainer,
    previewUrl,
    terminalOutput,
    setTerminalOutput, // Allow direct manipulation if needed
    isBooting,
    mountFiles,
    writeFile,
    runCommand,
    logToTerminal, // Expose for direct logging
  };
};