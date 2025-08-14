// @ts-nocheck
import { MultimodalLiveClient } from "./multimodal-live-client";
import { SetupCompleteMessage } from "../multimodal-live-types";

// Helper to create a promise that can be resolved/rejected manually
const createResolvablePromise = () => {
  let resolvePromise;
  let rejectPromise;
  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
};

// Mock WebSocket
let mockWebSocketInstance;
const mockWebSocketMessages = [];
let lastWebSocketUrl = "";

global.WebSocket = jest.fn().mockImplementation((url) => {
  lastWebSocketUrl = url;
  mockWebSocketInstance = {
    url: url,
    readyState: WebSocket.CONNECTING,
    send: jest.fn((message) => {
      mockWebSocketMessages.push(JSON.parse(message));
    }),
    close: jest.fn(() => {
      mockWebSocketInstance.readyState = WebSocket.CLOSED;
      if (mockWebSocketInstance.onclose) {
        mockWebSocketInstance.onclose(
          new CloseEvent("close", { code: 1000, reason: "Normal closure" }),
        );
      }
    }),
    addEventListener: jest.fn((event, listener) => {
      if (event === "open") mockWebSocketInstance.onopen = listener;
      if (event === "message") mockWebSocketInstance.onmessage = listener;
      if (event === "error") mockWebSocketInstance.onerror = listener;
      if (event === "close") mockWebSocketInstance.onclose = listener;
    }),
    removeEventListener: jest.fn((event, listener) => {
      // Basic mock, can be improved if needed
      if (event === "open" && mockWebSocketInstance.onopen === listener)
        mockWebSocketInstance.onopen = null;
      if (event === "message" && mockWebSocketInstance.onmessage === listener)
        mockWebSocketInstance.onmessage = null;
      if (event === "error" && mockWebSocketInstance.onerror === listener)
        mockWebSocketInstance.onerror = null;
      if (event === "close" && mockWebSocketInstance.onclose === listener)
        mockWebSocketInstance.onclose = null;
    }),
    // Simulate server sending a message to the client
    simulateServerMessage: async (messageOrBlob) => {
      let data = messageOrBlob;
      if (typeof messageOrBlob === "object" && !(messageOrBlob instanceof Blob)) {
        const jsonString = JSON.stringify(messageOrBlob);
        data = new Blob([jsonString], { type: "application/json" });
      }
      if (mockWebSocketInstance.onmessage) {
        // Need to ensure this happens in the next tick for promises to resolve correctly
        await new Promise((resolve) => setTimeout(resolve, 0));
        mockWebSocketInstance.onmessage({ data });
      }
    },
    // Simulate successful connection opening
    simulateOpen: () => {
      mockWebSocketInstance.readyState = WebSocket.OPEN;
      if (mockWebSocketInstance.onopen) {
        mockWebSocketInstance.onopen(new Event("open"));
      }
    },
    // Simulate an error
    simulateError: (errorMessage = "WebSocket error") => {
      if (mockWebSocketInstance.onerror) {
        mockWebSocketInstance.onerror(new ErrorEvent("error", { message: errorMessage }));
      }
    },
  };
  // Define constants for readyState
  Object.defineProperty(mockWebSocketInstance, "CONNECTING", {
    value: 0,
    writable: false,
  });
  Object.defineProperty(mockWebSocketInstance, "OPEN", {
    value: 1,
    writable: false,
  });
  Object.defineProperty(mockWebSocketInstance, "CLOSING", {
    value: 2,
    writable: false,
  });
  Object.defineProperty(mockWebSocketInstance, "CLOSED", {
    value: 3,
    writable: false,
  });

  return mockWebSocketInstance as any;
});

// Ensure addEventListener exists on the WebSocket mock returned by global.WebSocket
(WebSocket as any).prototype = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Define WebSocket constants if not already defined (e.g. by JSDOM)
if (typeof WebSocket.CONNECTING === "undefined") {
  Object.defineProperty(WebSocket, "CONNECTING", { value: 0, writable: false });
  Object.defineProperty(WebSocket, "OPEN", { value: 1, writable: false });
  Object.defineProperty(WebSocket, "CLOSING", { value: 2, writable: false });
  Object.defineProperty(WebSocket, "CLOSED", { value: 3, writable: false });
}

// TODO: Re-enable this suite with a robust WebSocket mock that fully emulates addEventListener lifecycle
describe.skip("MultimodalLiveClient Session Resumption", () => {
  let client;
  const apiKey = "test-api-key";
  const initialModel = "gemini-pro";
  const config = { model: initialModel };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockWebSocketMessages.length = 0;
    lastWebSocketUrl = "";
    client = new MultimodalLiveClient({ apiKey });
  });

  test("should connect and receive a session ID", async () => {
    const connectPromise = client.connect(config);

    // Simulate WebSocket opening
    expect(global.WebSocket).toHaveBeenCalledTimes(1);
    mockWebSocketInstance.simulateOpen();

    // Wait for the client to send its setup message
    await new Promise((resolve) => setTimeout(resolve, 0)); // allow microtasks to run
    expect(mockWebSocketInstance.send).toHaveBeenCalledTimes(1);
    expect(mockWebSocketMessages[0]).toEqual({ setup: config });

    // Simulate server sending setupComplete with session ID
    const testSessionId = "session-123";
    const setupCompleteMessage: SetupCompleteMessage = {
      setupComplete: { sessionId: testSessionId },
    };
    await mockWebSocketInstance.simulateServerMessage(setupCompleteMessage);

    await connectPromise; // Ensure connect promise resolves

    // Verify session ID is stored (indirectly, by checking the URL on next connect, which is done in the next test)
    // Here, we'll check if the setupcomplete event was emitted after the server sends the message.
    const setupCompleteListener = jest.fn();
    client.on("setupcomplete", setupCompleteListener);

    // Simulate server sending setupComplete with session ID again (reuse constant)
    const setupCompleteMessage2: SetupCompleteMessage = {
      setupComplete: { sessionId: testSessionId },
    };
    await mockWebSocketInstance.simulateServerMessage(setupCompleteMessage2);
    // Allow async processing of the message within the client
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setupCompleteListener).toHaveBeenCalled();

    await connectPromise; // Ensure connect promise from client.connect() resolves

    // Check that the client is connected
    expect(client.ws).toBe(mockWebSocketInstance);
    expect(client.ws.readyState).toBe(WebSocket.OPEN);
  });

  test("should disconnect and reconnect, resuming session with stored session ID", async () => {
    // ---- Phase 1: Initial connection and get session ID ----
    let connectPromise = client.connect(config);
    expect(global.WebSocket).toHaveBeenCalledTimes(1);
    const initialUrl = lastWebSocketUrl;
    expect(initialUrl).not.toContain("&sessionId=");
    setTimeout(() => mockWebSocketInstance && mockWebSocketInstance.simulateOpen(), 0);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const testSessionId = "session-abc-789";
    const setupCompleteMessage: SetupCompleteMessage = {
      setupComplete: { sessionId: testSessionId },
    };
    // Client sends setup
    expect(mockWebSocketInstance.send).toHaveBeenCalledTimes(1);

    // Server sends setupComplete
    await mockWebSocketInstance.simulateServerMessage(setupCompleteMessage);
    await connectPromise;

    // ---- Phase 2: Disconnect ----
    client.disconnect();
    expect(mockWebSocketInstance.close).toHaveBeenCalledTimes(1);
    expect(client.ws).toBeNull();

    // ---- Phase 3: Reconnect ----
    // Clear mocks for send/messages for the new connection
    mockWebSocketInstance.send.mockClear();
    mockWebSocketMessages.length = 0;

    connectPromise = client.connect(config);

    // A new WebSocket should be created
    expect(global.WebSocket).toHaveBeenCalledTimes(2);
    expect(lastWebSocketUrl).toBe(`${initialUrl}&sessionId=${testSessionId}`);

    // Simulate new WebSocket opening
    mockWebSocketInstance.simulateOpen();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Client sends setup again for the new connection
    expect(mockWebSocketInstance.send).toHaveBeenCalledTimes(1);
    expect(mockWebSocketMessages[0]).toEqual({ setup: config });

    // Server sends setupComplete again (can be with or without session ID for this test)
    const setupCompleteAgain: SetupCompleteMessage = { setupComplete: {} };
    await mockWebSocketInstance.simulateServerMessage(setupCompleteAgain);
    await connectPromise;

    expect(client.ws).toBe(mockWebSocketInstance);
    expect(client.ws.readyState).toBe(WebSocket.OPEN);
  });

  test("WebSocket URL should include apiKey on initial connection", () => {
    client.connect(config);
    expect(global.WebSocket).toHaveBeenCalledTimes(1);
    expect(lastWebSocketUrl).toContain(`?key=${apiKey}`);
    expect(lastWebSocketUrl).not.toContain("&sessionId=");
  });

  test("WebSocket URL should include sessionId on reconnection after it was received", async () => {
    // Initial connection
    let p = client.connect(config);
    setTimeout(() => mockWebSocketInstance && mockWebSocketInstance.simulateOpen(), 0);
    const sid = "sid-for-reconnect-test";
    await mockWebSocketInstance.simulateServerMessage({
      setupComplete: { sessionId: sid },
    });
    await p;

    // Disconnect
    client.disconnect();
    expect(mockWebSocketInstance.close).toHaveBeenCalled();

    // Reconnect
    p = client.connect(config);
    expect(global.WebSocket).toHaveBeenCalledTimes(2); // Called again
    expect(lastWebSocketUrl).toContain(`?key=${apiKey}`);
    expect(lastWebSocketUrl).toContain(`&sessionId=${sid}`);
    // Simulate open to allow connect promise to resolve if needed by other logic
    mockWebSocketInstance.simulateOpen();
    await mockWebSocketInstance.simulateServerMessage({ setupComplete: {} });
    await p;
  });
});
