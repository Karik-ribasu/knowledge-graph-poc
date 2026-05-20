import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

/** In-process bidirectional MCP transport pair (no subprocess). */
export function createLinkedTransportPair(): [Transport, Transport] {
  let transportA: Transport;
  let transportB: Transport;

  const createSide = (deliver: (message: JSONRPCMessage) => void): Transport => ({
    onclose: undefined,
    onerror: undefined,
    onmessage: undefined,
    async start() {
      /* no-op */
    },
    async close() {
      this.onclose?.();
    },
    async send(message) {
      queueMicrotask(() => deliver(message));
    },
  });

  transportA = createSide((message) => {
    transportB.onmessage?.(message);
  });
  transportB = createSide((message) => {
    transportA.onmessage?.(message);
  });

  return [transportA, transportB];
}
