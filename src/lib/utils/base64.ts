/**
 * Base64 encoding/decoding utilities
 */

/**
 * Convert a base64 string to an ArrayBuffer
 * @param base64 Base64 encoded string
 * @returns ArrayBuffer containing the decoded binary data
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert a Blob to JSON
 * @param blob Blob containing JSON data
 * @returns Promise resolving to the parsed JSON object
 */
export const blobToJSON = (blob: Blob): Promise<any> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        const json = JSON.parse(reader.result as string);
        resolve(json);
      } else {
        reject(new Error("Failed to read blob"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsText(blob);
  });




