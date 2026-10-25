/**
 * Utils file containing file treatment utils
 */
import { Writable, WritableOptions } from 'node:stream';

const kbytesToBytes = (kbytes: number) => kbytes * 1000;
const bytesToKbytes = (bytes: number) => Math.round((bytes / 1000) * 100) / 100;
const bytesToHumanReadable = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  if (bytes === 0) return '0 Bytes';

  let unit = 0;
  let size = bytes;

  // Step up a unit only when the value actually reaches the next unit.
  // Dividing while the value is merely greater than 1 overshoots by one unit
  // (5,000,000 bytes became 0.005 GB, rounded to "0 GB") instead of stopping
  // at the largest unit that keeps the value at or above 1.
  while (size >= 1000 && unit < sizes.length - 1) {
    size /= 1000;
    unit += 1;
  }

  return `${Math.round(size)} ${sizes[unit]}`;
};

const streamToBuffer = (stream: NodeJS.ReadableStream): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    });
    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    stream.on('error', reject);
  });

const getStreamSize = (stream: NodeJS.ReadableStream) =>
  new Promise((resolve, reject) => {
    let size = 0;
    stream.on('data', (chunk) => {
      size += Buffer.byteLength(chunk);
    });
    stream.on('close', () => resolve(size));
    stream.on('error', reject);
    stream.resume();
  });

/**
 * Create a writeable Node.js stream that discards received data.
 * Useful for testing, draining a stream of data, etc.
 */
function writableDiscardStream(options?: WritableOptions) {
  return new Writable({
    ...options,
    write(chunk, encding, callback) {
      setImmediate(callback);
    },
  });
}

export {
  streamToBuffer,
  bytesToHumanReadable,
  bytesToKbytes,
  kbytesToBytes,
  getStreamSize,
  writableDiscardStream,
};
