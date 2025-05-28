import type { StreamedData } from "../types";

/**
 * Parses the raw chunk from bolt.diy's /api/chat SSE stream.
 * Bolt.diy uses Vercel AI SDK's `createDataStream`, which has a specific protocol.
 * Examples from `api.chat.ts` transform stream:
 * - `0:"<text chunk>"`
 * - `0:"<div class=\"__boltThought__\">"` (transformed from 'g' prefix)
 * - `2:{"type":"progress","label":"summary",...}` (JSON data)
 * - `data: {"type":"chatSummary", ...}` (if it were standard SSE with JSON)
 *
 * This parser needs to handle these cases and potentially multi-line JSON.
 * @param chunk Raw string chunk from the stream.
 * @returns An array of parsed items (string for text, StreamedData for objects).
 */
export const parseStreamedBoltData = (chunk: string): (string | StreamedData)[] => {
  const results: (string | StreamedData)[] = [];
  const lines = chunk.split('\n').filter(line => line.trim() !== '');

  for (const line of lines) {
    // console.log("Parsing line:", line);
    if (line.startsWith('0:')) {
      try {
        // The content after "0:" is expected to be a JSON string
        const content = JSON.parse(line.substring(2));
        results.push(String(content)); // Treat as plain text string from LLM
      } catch (e) {
        console.warn("Failed to parse '0:'-prefixed line as JSON string, treating raw:", line.substring(2), e);
        results.push(line.substring(2)); // Fallback to raw content if not valid JSON string
      }
    } else if (line.match(/^\d+:/)) { // Matches "1:", "2:", etc. for structured data
        try {
            const firstColonIndex = line.indexOf(':');
            const jsonDataString = line.substring(firstColonIndex + 1);
            const dataObject = JSON.parse(jsonDataString);

            // Assuming it's a StreamedData compatible object from bolt.diy
            // You might need to map fields if the structure is different
             const streamedItem: StreamedData = {
                type: dataObject.type || 'unknown_structured_data',
                payload: dataObject, // Store the whole object
                text: dataObject.message || dataObject.summary || dataObject.token, // Heuristic for text
                // Copy other known fields from bolt.diy's annotations
                label: dataObject.label,
                status: dataObject.status,
                order: dataObject.order,
                message: dataObject.message, // from ProgressAnnotation
                summary: dataObject.summary, // from ContextAnnotation
                files: dataObject.files,     // from ContextAnnotation (codeContext)
                // value: dataObject.value, // from UsageAnnotation
             };
            results.push(streamedItem);
        } catch (e) {
            console.warn("Failed to parse structured data line, treating as raw text:", line, e);
            results.push(line); // Fallback for malformed JSON
        }
    } else if (line.startsWith('data: ')) { // Standard SSE JSON data
      try {
        const jsonData = JSON.parse(line.substring(6));
        // Adapt this part based on the actual structure of your SSE data
        const streamedItem: StreamedData = {
          type: jsonData.type || 'sse_event',
          payload: jsonData,
          text: jsonData.content || jsonData.text || jsonData.token,
        };
        results.push(streamedItem);
      } catch (e) {
        console.warn("Failed to parse SSE 'data:' line as JSON, treating as raw text:", line.substring(6), e);
        results.push(line.substring(6));
      }
    }
    else {
      // If no known prefix, assume it's a raw text chunk (less likely with Vercel AI SDK default framing)
      // Or part of a multi-line message not yet fully formed.
      // For simplicity, we'll treat un-prefixed lines as raw text for now.
      // A more robust solution would buffer and try to re-parse combined lines.
      results.push(line);
    }
  }
   console.log("parseStreamedBoltData results for chunk:", chunk, "->", results);
  return results;
};