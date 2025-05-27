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
  const wcInstanceRef = useRef<WebContainer | null>(null); // Use ref for teardown

  const logToTerminal = useCallback((message: string, type: 'log' | 'error' | 'info' = 'log') => {
    const prefix = type === 'error' ? 'WC_ERROR:' : type === 'info' ? 'WC_INFO:' : 'WC_LOG:';
    setTerminalOutput(prev => [...prev, `${prefix} ${message}`]);
    if (type === 'error') console.error(prefix, message);
    else console.log(prefix, message);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const boot = async () => {
      if (!isMounted) return;
      setIsBooting(true);
      logToTerminal('Booting WebContainer...', 'info');
      try {
        const wc = await WebContainer.boot({ coep: 'credentialless' }); // Ensure COEP header is set in Vite
        if (!isMounted) {
          wc.teardown();
          return;
        }
        wcInstanceRef.current = wc; // Store in ref
        setWebContainer(wc);
        logToTerminal('WebContainer booted successfully.', 'info');

        wc.on('server-ready', (port, url) => {
          if (!isMounted) return;
          logToTerminal(`Server ready at ${url} on port ${port}`, 'info');
          setPreviewUrl(url);
        });

        wc.on('error', (error) => {
          if (!isMounted) return;
          logToTerminal(`WebContainer error: ${error.message}`, 'error');
        });
         wc.on('preview-message', (msg) => {
          if (!isMounted) return;
          logToTerminal(`Preview Iframe: ${JSON.stringify(msg)}`, 'info');
        });
      } catch (err) {
        if (!isMounted) return;
        logToTerminal(`Failed to boot WebContainer: ${err instanceof Error ? err.message : String(err)}`, 'error');
      } finally {
        if (isMounted) setIsBooting(false);
      }
    };
    boot();

    return () => {
      isMounted = false;
      logToTerminal('Tearing down WebContainer instance...', 'info');
      wcInstanceRef.current?.teardown?.();
      wcInstanceRef.current = null;
      setWebContainer(null); // Also clear state
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const writeFile = useCallback(async (path: string, content: string | Uint8Array) => {
    if (!wcInstanceRef.current) {
      logToTerminal('WebContainer not available to write file.', 'error');
      return;
    }
    try {
      const dir = path.substring(0, path.lastIndexOf('/'));
      if (dir && dir !== '.') { // Avoid trying to create '.' or '/'
        await wcInstanceRef.current.fs.mkdir(dir, { recursive: true }).catch(e => {
          if (!(e instanceof Error && e.message.includes('EEXIST'))){
            logToTerminal(`Could not create directory ${dir}: ${e instanceof Error ? e.message : String(e)}`, 'error');
          }
        });
      }
      await wcInstanceRef.current.fs.writeFile(path, content);
      logToTerminal(`File written: ${path}`, 'info');
    } catch (err) {
      logToTerminal(`Failed to write file ${path}: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  }, [logToTerminal]);


  const runCommand = useCallback(async (command: string, args: string[] = [], title?: string, cwd?: string) => {
    if (!wcInstanceRef.current) {
      logToTerminal('WebContainer not available to run command.', 'error');
      return null;
    }
    if (currentProcess) {
        logToTerminal(`Process "${title || command}" cannot start: Another process is already running. Please wait.`, 'error');
        return null;
    }
    const commandLabel = title || command;
    logToTerminal(`Running command: ${commandLabel} ${args.join(' ')} ${cwd ? `(in ${cwd})` : ''}`, 'info');
    
    const process = await wcInstanceRef.current.spawn(command, args, { output: true, cwd });
    setCurrentProcess(process);

    process.output.pipeTo(new WritableStream({
      write(chunk) {
        logToTerminal(`[${commandLabel}]: ${chunk}`);
      }
    })).catch(err => {
        logToTerminal(`Error piping output for ${commandLabel}: ${err.message}`, 'error');
    });

    try {
        const exitCode = await process.exit;
        logToTerminal(`Command "${commandLabel}" exited with code ${exitCode}`, exitCode === 0 ? 'info' : 'error');
    } catch (err) {
        logToTerminal(`Error waiting for command "${commandLabel}" exit: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
        setCurrentProcess(null);
    }
    return process;
  }, [logToTerminal, currentProcess]); // Added currentProcess

  return {
    webContainer: wcInstanceRef.current, // Expose the ref's current value
    previewUrl,
    terminalOutput,
    setTerminalOutput,
    isBooting,
    writeFile,
    runCommand,
    logToTerminal,
  };
};