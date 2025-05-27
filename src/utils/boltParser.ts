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

/**
 * Extracts the main content from the Vercel AI SDK stream framing.
 * Example raw message: f:{"messageId":"..."}Actual XML/Text Content Heree:{"finishReason":"stop",...}d:{"usage":{...}}
 * This improved version is more robust at stripping the framing.
 */
function extractCoreContent(rawMessage: string): string {
  let content = rawMessage;

  // Remove f:{...} prefix
  const fPrefixMatch = content.match(/^f:(\{[\s\S]*?\})(.*)/s); // Use [\s\S] to match any character including newline
  if (fPrefixMatch && fPrefixMatch[2]) {
    content = fPrefixMatch[2];
  }

  // Remove e:{...}d:{...} suffix
  // This regex looks for the last e:{...} and optional d:{...} at the end of the string.
  // Using non-greedy match for the JSON content and `[\s\S]*` for content between, then `$` anchor.
  const edSuffixRegex = /(e:\{[\s\S]*?\})(d:\{[\s\S]*?\})?$/;
  const edSuffixMatch = content.match(edSuffixRegex);

  if (edSuffixMatch) {
    // Find the starting index of the matched suffix
    const suffixStartIndex = content.lastIndexOf(edSuffixMatch[0]);
    if (suffixStartIndex !== -1) {
      content = content.substring(0, suffixStartIndex);
    }
  }

  // Trim any leading/trailing whitespace or newlines
  return content.trim();
}

// Renamed from parseBoltArtifactsWithRegex to be the primary parser
export const parseBoltResponse = (responseText: string): ParsedBoltArtifact[] => {
    const artifacts: ParsedBoltArtifact[] = [];
    const coreContent = extractCoreContent(responseText); // Always extract core content first
    
    console.log("parseBoltResponse: Extracted core content length:", coreContent.length); // Debug log
    if (coreContent.length > 0) {
        console.log("parseBoltResponse: Extracted core content preview:", coreContent.substring(0, 500) + "..."); // Debug log
    } else {
        console.warn("parseBoltResponse: Extracted core content is empty. Cannot parse artifacts.");
        return artifacts;
    }


    console.log("parseBoltResponse: Attempting to parse artifacts with regex (bypassing DOMParser for robustness)."); // Always use regex
    
    // Regex to find <boltArtifact ...>...</boltArtifact>
    // This regex needs to be very robust to handle various whitespace and attribute formats.
    const artifactRegex = /<boltArtifact(?:\s+id="([^"]*)")?(?:\s+title="([^"]*)")?\s*>([\s\S]*?)<\/boltArtifact>/gi;
    
    // Regex to find <boltAction ...>...</boltAction>
    const actionRegex = /<boltAction\s+type="([^"]*)"(?:\s+filePath="([^"]*)")?\s*>([\s\S]*?)<\/boltAction>/gi;
    
    let artifactMatch;

    while ((artifactMatch = artifactRegex.exec(coreContent)) !== null) { // Operate on coreContent
        const currentArtifact: ParsedBoltArtifact = {
            id: artifactMatch[1] || undefined,
            title: artifactMatch[2] || undefined,
            actions: [],
        };
        const artifactContent = artifactMatch[3]; // Content inside <boltArtifact>
        let actionMatch;

        while ((actionMatch = actionRegex.exec(artifactContent)) !== null) {
            let content = actionMatch[3].trim();
            
            // Special handling for package.json content with JSON.stringify wrapper
            if (actionMatch[2]?.endsWith('package.json') && actionMatch[1] === 'file') {
                const stringifyMatch = content.match(/JSON\.stringify\s*\(([\s\S]+?)\s*,\s*null\s*,\s*2\s*\)/s);
                if (stringifyMatch && stringifyMatch[1]) {
                    try {
                        const objLiteral = stringifyMatch[1];
                        // This is risky: new Function to evaluate the object literal.
                        // The LLM should ideally output the direct JSON string.
                        const evaluatedObject = new Function(`return (${objLiteral})`)();
                        content = JSON.stringify(evaluatedObject, null, 2);
                        console.log(`Successfully parsed package.json content for ${actionMatch[2]}`);
                    } catch (e) {
                        console.error(`Failed to parse JSON.stringify content for ${actionMatch[2]}. Using raw content. Error:`, e);
                        // If parsing fails, use the raw textContent, which might be the string "{ JSON.stringify... }"
                    }
                } else if (content.trim().startsWith("{") && content.trim().endsWith("}")) {
                    // If it looks like JSON but wasn't matched by stringify, try to parse directly
                    try {
                        JSON.parse(content); // Validate if it's already a valid JSON string
                    } catch (e) {
                        console.warn(`Content for ${actionMatch[2]} looks like JSON but failed to parse directly. LLM might be outputting it incorrectly. Content snippet: ${content.substring(0,100)}`);
                    }
                }
            }

            if (actionMatch[1]) { // Ensure type exists
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

    console.log("parseBoltResponse: Parsed artifacts:", artifacts); // Debug log
    return artifacts;
};

// You might not need parseBoltArtifactsWithRegex as a separate export if it's now internal.
// If you do, ensure its name is consistent and it calls extractCoreContent.
// For simplicity, I've merged its logic into parseBoltResponse and made it the primary method.