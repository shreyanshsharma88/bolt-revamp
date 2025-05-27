
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
 * We want to extract "Actual XML/Text Content Here".
 */
function extractCoreContent(rawMessage: string): string {
  let content = rawMessage;

  // Remove f:{...} prefix if it exists and is well-formed JSON
  const fPrefixMatch = content.match(/^f:(\{.*?\})(.*)/s);
  if (fPrefixMatch && fPrefixMatch[1] && fPrefixMatch[2]) {
    try {
      JSON.parse(fPrefixMatch[1]); // Validate JSON
      content = fPrefixMatch[2];
    } catch (e) {
      // Not valid JSON, proceed with original content
      console.warn("Could not parse f:{} prefix as JSON, using content as is for now.", e);
    }
  }

  // Remove e:{...}d:{...} suffix if it exists and is well-formed JSON
  // This regex is a bit more greedy to capture the last valid JSONs
  const edSuffixMatch = content.match(/(.*)(e:(\{.*?\})(d:(\{.*?\})?)?$)/s);
  if (edSuffixMatch && edSuffixMatch[1] && edSuffixMatch[3]) {
    try {
      JSON.parse(edSuffixMatch[3]); // Validate JSON of e:{...}
      if (edSuffixMatch[5]) { // If d:{...} exists
        JSON.parse(edSuffixMatch[5]); // Validate JSON of d:{...}
      }
      content = edSuffixMatch[1];
    } catch (e) {
      // Not valid JSON, proceed with content before suffix attempt
      console.warn("Could not parse e:{}d:{} suffix as JSON, using content as is for now.", e);
    }
  }
  return content.trim();
}


export const parseBoltResponse = (responseText: string): ParsedBoltArtifact[] => {
  const artifacts: ParsedBoltArtifact[] = [];
  const coreContent = extractCoreContent(responseText);

  if (!coreContent) {
    console.warn("Extracted core content is empty from response:", responseText.substring(0,100) + "...");
    return artifacts;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<root>${coreContent}</root>`, "text/xml");

    const parserError = doc.querySelector("parsererror");
    if (parserError) {
      console.error("XML Parsing Error:", parserError.textContent);
      console.warn("Falling back to regex parsing for bolt artifacts due to XML parser error.");
      return parseBoltArtifactsWithRegex(coreContent); // Fallback
    }

    doc.querySelectorAll("boltArtifact").forEach(artifactElement => {
      const artifact: ParsedBoltArtifact = {
        id: artifactElement.getAttribute("id"),
        title: artifactElement.getAttribute("title"),
        actions: [],
      };

      artifactElement.querySelectorAll("boltAction").forEach(actionElement => {
        const type = actionElement.getAttribute("type") as BoltActionCommand['type'];
        const filePath = actionElement.getAttribute("filePath") || undefined;
        let content = actionElement.textContent || "";

        if (filePath?.endsWith('package.json') && type === 'file') {
          // Attempt to extract the pure JSON string if it's wrapped in "{ JSON.stringify(...) }"
          const stringifyMatch = content.match(/JSON\.stringify\s*\(([\s\S]+?)\s*,\s*null\s*,\s*2\s*\)/s);
          if (stringifyMatch && stringifyMatch[1]) {
            try {
              // This is risky: new Function to evaluate the object literal.
              // The LLM should ideally output the direct JSON string.
              const objLiteral = stringifyMatch[1];
              const evaluatedObject = new Function(`return (${objLiteral})`)();
              content = JSON.stringify(evaluatedObject, null, 2);
              console.log(`Successfully parsed package.json content for ${filePath}`);
            } catch (e) {
              console.error(`Failed to parse JSON.stringify content for ${filePath}. Using raw content. Error:`, e, "Raw content:", content);
              // If parsing fails, use the raw textContent, which might be the string "{ JSON.stringify... }"
            }
          } else if (content.trim().startsWith("{") && content.trim().endsWith("}")) {
            // If it looks like JSON but wasn't matched by stringify, try to parse directly
            try {
                JSON.parse(content); // Validate if it's already a valid JSON string
            } catch (e) {
                console.warn(`Content for ${filePath} looks like JSON but failed to parse directly. LLM might be outputting it incorrectly. Content: ${content.substring(0,100)}`);
            }
          }
        }

        if (type) {
          artifact.actions.push({ type, filePath, content });
        } else {
            console.warn("Skipping boltAction with no type:", actionElement.outerHTML);
        }
      });
      artifacts.push(artifact);
    });

  } catch (e) {
    console.error("Error during DOM parsing of Bolt response:", e);
    console.warn("Falling back to regex parsing for bolt artifacts due to DOMParser exception.");
    return parseBoltArtifactsWithRegex(coreContent); // Fallback
  }

  return artifacts;
};

function parseBoltArtifactsWithRegex(responseText: string): ParsedBoltArtifact[] {
    console.log("Using regex fallback for parsing artifacts.");
    const artifacts: ParsedBoltArtifact[] = [];
    // Regex to find <boltArtifact ...>...</boltArtifact>
    const artifactRegex = /<boltArtifact\s*(?:id="([^"]*)")?\s*(?:title="([^"]*)")?\s*>([\s\S]*?)<\/boltArtifact>/gi;
    // Regex to find <boltAction ...>...</boltAction>
    const actionRegex = /<boltAction\s+type="([^"]*)"(?:\s+filePath="([^"]*)")?\s*>([\s\S]*?)<\/boltAction>/gi;
    let artifactMatch;

    while ((artifactMatch = artifactRegex.exec(responseText)) !== null) {
        const currentArtifact: ParsedBoltArtifact = {
            id: artifactMatch[1] || undefined,
            title: artifactMatch[2] || undefined,
            actions: [],
        };
        const artifactContent = artifactMatch[3];
        let actionMatch;
        while ((actionMatch = actionRegex.exec(artifactContent)) !== null) {
            let content = actionMatch[3].trim();
            // CDATA sections are not automatically handled by this regex's textContent,
            // but DOMParser handles them. If regex is used, ensure CDATA is stripped if present.
            // For now, assuming textContent is the desired content.
             if (actionMatch[2]?.endsWith('package.json') && actionMatch[1] === 'file') {
                const stringifyMatch = content.match(/JSON\.stringify\s*\(([\s\S]+?)\s*,\s*null\s*,\s*2\s*\)/s);
                if (stringifyMatch && stringifyMatch[1]) {
                    try {
                        const objLiteral = stringifyMatch[1];
                        const evaluatedObject = new Function(`return (${objLiteral})`)();
                        content = JSON.stringify(evaluatedObject, null, 2);
                    } catch (e) { /* use raw content */ }
                }
            }
            currentArtifact.actions.push({
                type: actionMatch[1] as BoltActionCommand['type'],
                filePath: actionMatch[2] || undefined,
                content: content,
            });
        }
        artifacts.push(currentArtifact);
    }
    if (artifacts.length === 0 && responseText.includes("<boltAction")) {
        console.warn("Regex parser found no <boltArtifact> but response contains <boltAction>. The XML structure might be malformed or unexpected.");
    }
    return artifacts;
}