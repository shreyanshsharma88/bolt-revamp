// src/utils/boltActionParser.ts
import type { StreamedData } from "../types"; // Make sure to import StreamedData if it's used directly in this file
import type { AppFile } from '../utils/webContainer'; // Re-evaluate path if AppFile is in different location

export interface BoltActionCommand {
  type: 'shell' | 'file' | 'start' | 'build';
  filePath?: string;
  content: string;
}

export interface ParsedBoltArtifact {
  id?: string | null;
  title?: string | null;
  actions: BoltActionCommand[];
  description?: string;
}

function extractCoreContent(rawMessage: string): string {
  let content = rawMessage;

  const fPrefixMatch = content.match(/^f:(\{[\s\S]*?\})(.*)/s);
  if (fPrefixMatch && fPrefixMatch[2]) {
    content = fPrefixMatch[2];
  }

  const edSuffixRegex = /(e:\{[\s\S]*?\})(d:\{[\s\S]*?\})?$/;
  const edSuffixMatch = content.match(edSuffixRegex);

  if (edSuffixMatch) {
    const suffixStartIndex = content.lastIndexOf(edSuffixMatch[0]);
    if (suffixStartIndex !== -1) {
      content = content.substring(0, suffixStartIndex);
    }
  }

  return content.trim();
}

export const parseBoltResponse = (responseText: string): ParsedBoltArtifact[] => {
    const artifacts: ParsedBoltArtifact[] = [];
    const coreContent = extractCoreContent(responseText); 
    
    console.log("parseBoltResponse: Extracted core content length:", coreContent.length); 
    if (coreContent.length > 0) {
        console.log("parseBoltResponse: Extracted core content preview:", coreContent.substring(0, 500) + "..."); 
    } else {
        console.warn("parseBoltResponse: Extracted core content is empty. Cannot parse artifacts.");
        return artifacts;
    }

    console.log("parseBoltResponse: Attempting to parse artifacts with regex (bypassing DOMParser for robustness)."); 
    
    const artifactRegex = /<boltArtifact(?:\s+id="([^"]*)")?(?:\s+title="([^"]*)")?\s*>([\s\S]*?)<\/boltArtifact>/gi;
    const actionRegex = /<boltAction\s+type="([^"]*)"(?:\s+filePath="([^"]*)")?\s*>([\s\S]*?)<\/boltAction>/gi;
    
    let artifactMatch;

    while ((artifactMatch = artifactRegex.exec(coreContent)) !== null) { 
        const currentArtifact: ParsedBoltArtifact = {
            id: artifactMatch[1] || undefined,
            title: artifactMatch[2] || undefined,
            actions: [],
        };
        const artifactContent = artifactMatch[3]; 
        let actionMatch;

        // Sanitize dependencies and devDependencies keys
        const sanitizeDependencies = (deps: Record<string, string>) => {
          const sanitizedDeps: Record<string, string> = {};
          for (const key in deps) {
            // Remove spaces after '@' in package names like "@ vitejs/plugin-react"
            const sanitizedKey = key.replace(/@\s+/, '@'); 
            sanitizedDeps[sanitizedKey] = deps[key];
          }
          return sanitizedDeps;
        };
        while ((actionMatch = actionRegex.exec(artifactContent)) !== null) {
            let content = actionMatch[3].trim();
            
            // FIX: Sanitize package.json content to remove invalid characters from package names
            if (actionMatch[2]?.endsWith('package.json') && actionMatch[1] === 'file') {
                const stringifyMatch = content.match(/JSON\.stringify\s*\(([\s\S]+?)\s*,\s*null\s*,\s*2\s*\)/s);
                if (stringifyMatch && stringifyMatch[1]) {
                    try {
                        const objLiteral = stringifyMatch[1];
                        const evaluatedObject = new Function(`return (${objLiteral})`)();


                        if (evaluatedObject.dependencies) {
                          evaluatedObject.dependencies = sanitizeDependencies(evaluatedObject.dependencies);
                        }
                        if (evaluatedObject.devDependencies) {
                          evaluatedObject.devDependencies = sanitizeDependencies(evaluatedObject.devDependencies);
                        }

                        content = JSON.stringify(evaluatedObject, null, 2);
                        console.log(`Successfully parsed and sanitized package.json content for ${actionMatch[2]}`);
                    } catch (e) {
                        console.error(`Failed to parse or sanitize JSON.stringify content for ${actionMatch[2]}. Using raw content. Error:`, e, "Raw content:", content);
                    }
                } else if (content.trim().startsWith("{") && content.trim().endsWith("}")) {
                    try {
                        const parsedJson = JSON.parse(content);
                        // Also apply sanitization if it's direct JSON
                        const sanitizedJson = {
                            ...parsedJson,
                            dependencies: parsedJson.dependencies ? sanitizeDependencies(parsedJson.dependencies) : undefined,
                            devDependencies: parsedJson.devDependencies ? sanitizeDependencies(parsedJson.devDependencies) : undefined,
                        };
                        content = JSON.stringify(sanitizedJson, null, 2);
                        console.log(`Successfully sanitized direct JSON package.json content for ${actionMatch[2]}`);
                    } catch (e) {
                        console.warn(`Content for ${actionMatch[2]} looks like JSON but failed to parse directly or sanitize. LLM might be outputting it incorrectly. Content snippet: ${content.substring(0,100)}`);
                    }
                }
            }

            if (actionMatch[1]) { 
                currentArtifact.actions.push({
                    type: actionMatch[1] as BoltActionCommand['type'],
                    filePath: actionMatch[2] || undefined,
                    content: content,
                });
            } else {
                console.warn("Skipping boltAction with no type:", actionMatch[0]);
            }
        }
        artifacts.push(currentArtifact);
    }
    
    if (artifacts.length === 0 && coreContent.includes("<boltAction")) {
        console.warn("Regex parser found no <boltArtifact> but coreContent contains <boltAction>. The XML structure might be malformed or unexpected, or regex needs adjustment.");
    }

    console.log("parseBoltResponse: Parsed artifacts:", artifacts); 
    return artifacts;
};