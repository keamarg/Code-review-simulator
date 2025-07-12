/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Content,
  GoogleGenAI,
  LiveCallbacks,
  LiveClientToolResponse,
  LiveConnectConfig,
  LiveServerContent,
  LiveServerMessage,
  LiveServerToolCall,
  LiveServerToolCallCancellation,
  Part,
  Session,
} from "@google/genai";

import { EventEmitter } from "eventemitter3";
import { difference } from "lodash";
import { LiveClientOptions, StreamingLog } from "../types";
import { base64ToArrayBuffer } from "./utils";

/**
 * Event types that can be emitted by the GenAILiveClient.
 * Each event corresponds to a specific message from GenAI or client state change.
 */
export interface LiveClientEventTypes {
  // Emitted when audio data is received
  audio: (data: ArrayBuffer) => void;
  // Emitted when the connection closes
  close: (event: CloseEvent) => void;
  // Emitted when content is received from the server
  content: (data: LiveServerContent) => void;
  // Emitted when the server interrupts the current generation
  interrupted: () => void;
  // Emitted for logging events
  log: (log: StreamingLog) => void;
  // Emitted when the connection opens
  open: () => void;
  // Emitted when the initial setup is complete
  setupcomplete: () => void;
  // Emitted when a tool call is received
  toolcall: (toolCall: LiveServerToolCall) => void;
  // Emitted when a tool call is cancelled
  toolcallcancellation: (
    toolcallCancellation: LiveServerToolCallCancellation
  ) => void;
  // Emitted when the current turn is complete
  turncomplete: () => void;
  // Emitted when output transcription is received (AI speech)
  transcript: (transcription: string) => void;
  // Emitted when input transcription is received (user speech)
  userTranscript: (transcription: string) => void;
  // Emitted when server sends GoAway message (advance warning before disconnection)
  goAway: (timeLeft: number) => void;
}

/**
 * A event-emitting class that manages the connection to the websocket and emits
 * events to the rest of the application.
 * If you dont want to use react you can still use this.
 */
export class GenAILiveClient extends EventEmitter<LiveClientEventTypes> {
  protected client: GoogleGenAI;

  private callbacks: LiveCallbacks = {
    onopen: this.onopen,
    onmessage: this.onmessage,
    onerror: this.onerror,
    onclose: this.onclose,
  };

  private _status: "connected" | "disconnected" | "connecting" = "disconnected";
  public get status() {
    return this._status;
  }

  private sessionResumptionHandle: string | undefined = "";
  private reconnectionAttempts: number = 0;
  private readonly maxReconnectionAttempts: number = 1; // Enable automatic reconnection with session resumption
  private manualDisconnect: boolean = false;
  private voiceChangeInProgress: boolean = false;

  private _session: Session | null = null;
  public get session() {
    return this._session;
  }

  private _model: string | null = null;
  public get model() {
    return this._model;
  }

  protected config: LiveConnectConfig | null = null;

  public getConfig() {
    return { ...this.config };
  }

  public get isVoiceChangeInProgress() {
    return this.voiceChangeInProgress;
  }

  constructor(options: LiveClientOptions) {
    super();
    this.client = new GoogleGenAI(options);
    this.send = this.send.bind(this);
    this.onopen = this.onopen.bind(this);
    this.onerror = this.onerror.bind(this);
    this.onclose = this.onclose.bind(this);
    this.onmessage = this.onmessage.bind(this);
  }

  protected log(type: string, message: StreamingLog["message"]) {
    const log: StreamingLog = {
      date: new Date(),
      type,
      message,
    };
    this.emit("log", log);
  }

  async connect(model: string, config: LiveConnectConfig): Promise<boolean> {
    if (this._status === "connected" || this._status === "connecting") {
      return false;
    }

    this._status = "connecting";
    this.manualDisconnect = false;
    this.config = config;
    this._model = model;

    const callbacks: LiveCallbacks = {
      onopen: this.onopen,
      onmessage: this.onmessage,
      onerror: this.onerror,
      onclose: this.onclose,
    };

    try {
      this._session = await this.client.live.connect({
        model,
        config,
        callbacks,
      });
    } catch (e) {
      console.error("Error connecting to GenAI Live:", e);
      this._status = "disconnected";
      return false;
    }

    this._status = "connected";
    return true;
  }

  public disconnect() {
    if (!this.session) {
      return false;
    }
    // Set flag to prevent automatic reconnection
    this.manualDisconnect = true;

    // Debug logging for session resumption
    console.log("🔍 Disconnect Debug:", {
      hasSessionHandle: !!this.sessionResumptionHandle,
      sessionHandle: this.sessionResumptionHandle,
      hasConfig: !!this.config,
      hasModel: !!this._model,
    });

    this.log(
      "client.disconnect",
      `Session handle: ${
        this.sessionResumptionHandle || "none"
      } - preserving for resumption`
    );

    // Keep session resumption handle, config, and model for resumption
    // Only terminateSession() should clear these

    this.session?.close();
    this._session = null;
    this._status = "disconnected";

    this.log("client.close", `Disconnected - session can be resumed`);
    return true;
  }

  // Add explicit method to terminate session completely
  public terminateSession() {
    console.log("🛑 Terminating session completely - no resumption possible");
    this.manualDisconnect = true;
    this.sessionResumptionHandle = undefined;
    this.config = null;
    this._model = null;
    this.reconnectionAttempts = this.maxReconnectionAttempts; // Prevent any reconnection attempts

    if (this.session) {
      this.session.close();
      this._session = null;
    }
    this._status = "disconnected";
    this.log("client.terminate", "Session terminated completely");
  }

  // Add manual reconnection method for user-initiated reconnection
  public async reconnectWithResumption(): Promise<boolean> {
    if (!this.config || !this._model) {
      console.log("❌ Cannot reconnect: Missing config or model");
      return false;
    }

    console.log("🔄 Manual reconnection with session resumption...");

    // Use session resumption if we have a handle, just like automatic reconnection does
    const resumptionConfig = this.sessionResumptionHandle
      ? {
          ...this.config,
          sessionResumption: { handle: this.sessionResumptionHandle },
        }
      : { ...this.config };

    console.log(
      this.sessionResumptionHandle
        ? `🔄 Resuming with session handle: ${this.sessionResumptionHandle?.substring(
            0,
            20
          )}...`
        : "⚠️ No session handle available, starting fresh session"
    );

    try {
      const success = await this.connect(this._model, resumptionConfig);
      if (success) {
        console.log(
          this.sessionResumptionHandle
            ? "✅ Session resumption successful - conversation context preserved"
            : "✅ Fresh session created successfully"
        );
      }
      return success;
    } catch (error) {
      console.error("❌ Manual reconnection failed:", error);
      return false;
    }
  }

  // Add method to change voice while preserving session context
  public async changeVoice(newVoiceName: string): Promise<boolean> {
    if (!this.config || !this._model) {
      console.error("❌ Cannot change voice: Missing config or model");
      return false;
    }

    // Set flag to prevent ExamWorkflow from interfering
    this.voiceChangeInProgress = true;
    console.log(`🎤 Changing voice to ${newVoiceName}...`);

    // Create new config with updated voice but keep everything else the same
    const newConfig = {
      ...this.config,
      speechConfig: {
        ...this.config.speechConfig,
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: newVoiceName,
          },
        },
      },
    };

    // Update stored config for future use
    this.config = newConfig;

    // Helper function to wait for status change
    const waitForDisconnect = async (
      maxWait: number = 2000
    ): Promise<boolean> => {
      const startTime = Date.now();
      while (
        this._status !== "disconnected" &&
        Date.now() - startTime < maxWait
      ) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return this._status === "disconnected";
    };

    // If we have a session resumption handle, use it to preserve context
    if (this.sessionResumptionHandle) {
      console.log(
        `🔄 Using session resumption to preserve conversation context`
      );

      // Disconnect current session (preserves session handle)
      const wasConnected = this._status === "connected";
      if (wasConnected) {
        this.disconnect();
        // Wait for actual disconnect to complete
        const disconnected = await waitForDisconnect();
        if (!disconnected) {
          console.log("❌ Failed to disconnect properly");
          return false;
        }
      }

      // Use session resumption to continue the conversation with new voice
      const resumptionConfig = {
        ...newConfig,
        sessionResumption: { handle: this.sessionResumptionHandle },
      };

      try {
        const success = await this.connect(this._model, resumptionConfig);
        if (success) {
          console.log(
            `✅ Voice changed to ${newVoiceName} with conversation context preserved`
          );

          // Send continuation message to let AI know we're back, similar to pause/resume
          // Wait a moment for connection to fully establish before sending
          setTimeout(() => {
            if (this._status === "connected") {
              this.send([
                {
                  text: `Voice changed successfully. Please continue with the code review.`,
                },
              ]);
            }
          }, 1000); // 1 second delay to ensure connection is ready
        } else {
          console.log(`❌ Failed to reconnect with session resumption`);
        }
        // Clear flag before returning
        this.voiceChangeInProgress = false;
        return success;
      } catch (error) {
        console.error("❌ Voice change with resumption failed:", error);
        // Clear flag before returning
        this.voiceChangeInProgress = false;
        return false;
      }
    } else {
      // No session resumption handle available - this is normal for early session changes
      console.log(`🔄 Applying voice change with fresh connection`);

      try {
        // Disconnect if currently connected
        if (this._status === "connected") {
          this.disconnect();
          // Wait for actual disconnect to complete
          const disconnected = await waitForDisconnect();
          if (!disconnected) {
            console.log("❌ Failed to disconnect properly");
            // Clear flag before returning
            this.voiceChangeInProgress = false;
            return false;
          }
        }

        const success = await this.connect(this._model, newConfig);
        if (success) {
          console.log(
            `✅ Voice changed to ${newVoiceName} (fresh connection - no conversation context to preserve)`
          );

          // Send continuation message for fresh connection voice changes
          // Wait a moment for connection to fully establish before sending
          setTimeout(() => {
            if (this._status === "connected") {
              this.send([
                {
                  text: `Voice changed successfully. Please continue with the code review.`,
                },
              ]);
            }
          }, 1000); // 1 second delay to ensure connection is ready
        } else {
          console.log(`❌ Failed to reconnect with new voice`);
        }
        // Clear flag before returning
        this.voiceChangeInProgress = false;
        return success;
      } catch (error) {
        console.error("❌ Voice change with fresh connection failed:", error);
        // Clear flag before returning
        this.voiceChangeInProgress = false;
        return false;
      }
    }
  }

  protected onopen() {
    this.reconnectionAttempts = 0; // Reset counter on successful connection
    this.log("client.open", "Connected");
    this.emit("open");
  }

  protected onerror(e: ErrorEvent) {
    this.log("server.error", e.message);
  }

  protected async onclose(e: CloseEvent) {
    // Reset status to disconnected when connection closes
    this._status = "disconnected";
    this._session = null;

    // Only clear session data if it was a manual disconnect
    // For all other disconnections (network issues, server errors), preserve session data for manual reconnection

    // Try automatic reconnection only for specific error codes
    if (
      e.code === 1011 &&
      this.sessionResumptionHandle &&
      this.config &&
      this._model &&
      this.reconnectionAttempts < this.maxReconnectionAttempts &&
      !this.manualDisconnect
    ) {
      // reconnect with resumption handle
      // BUT only once! keep a counter
      this.reconnectionAttempts++;
      this.log(
        "client.reconnect",
        `🔄 Attempting automatic reconnection with session resumption (attempt ${this.reconnectionAttempts}/${this.maxReconnectionAttempts})`
      );

      const resumptionConfig = {
        ...this.config!,
        sessionResumption: { handle: this.sessionResumptionHandle },
      };

      // Add a small delay to ensure WebSocket is fully closed before reconnecting
      setTimeout(async () => {
        try {
          await this.connect(this._model!, resumptionConfig);
        } catch (e) {
          console.error("❌ Error during automatic reconnection:", e);
          this.log("client.reconnect.error", (e as Error).message);
        }
      }, 500); // 500ms delay

      return;
    } else {
      // IMPORTANT: Don't clear session data here!
      // Even if automatic reconnection is skipped, we want to preserve session data for manual reconnection
    }

    this.log(
      `server.close`,
      `disconnected ${e.reason ? `with reason: ${e.reason}` : ``}`
    );
    this.emit("close", e);
  }

  protected async onmessage(message: LiveServerMessage) {
    if (message.setupComplete) {
      this.log("server.send", "setupComplete");
      this.emit("setupcomplete");
      return;
    }
    if (message.toolCall) {
      this.log("server.toolCall", message);
      this.emit("toolcall", message.toolCall);
      return;
    }
    if (message.toolCallCancellation) {
      this.log("server.toolCallCancellation", message);
      this.emit("toolcallcancellation", message.toolCallCancellation);
      return;
    }

    if (message.sessionResumptionUpdate) {
      if ("newHandle" in message.sessionResumptionUpdate) {
        this.sessionResumptionHandle =
          message.sessionResumptionUpdate.newHandle;
        this.log(
          "session.resumption",
          `Handle received: ${this.sessionResumptionHandle?.substring(
            0,
            20
          )}...`
        );
      }
      return; // Important: return here to prevent falling through to "unmatched message"
    }

    // Handle GoAway messages - advance warning before connection termination
    if (message.goAway) {
      const timeLeft = Number(message.goAway.timeLeft) || 0;
      console.log(
        `⚠️ GoAway message received: Connection will close in ${timeLeft}ms`
      );
      this.log("server.goAway", `Connection closing in ${timeLeft}ms`);
      this.emit("goAway", timeLeft);
      return;
    }

    // this json also might be `contentUpdate { interrupted: true }`
    // or contentUpdate { end_of_turn: true }
    if (message.serverContent) {
      const { serverContent } = message;

      if ("interrupted" in serverContent) {
        this.log("server.content", "interrupted");
        this.emit("interrupted");
        return;
      }
      if ("turnComplete" in serverContent) {
        this.log("server.content", "turnComplete");
        this.emit("turncomplete");
      }

      if ("outputTranscription" in serverContent) {
        // Removed console.log to reduce noise - logging moved to conversation tracker when chunks are saved
        if (serverContent.outputTranscription) {
          // Extract text from transcription object
          const transcriptText =
            typeof serverContent.outputTranscription === "string"
              ? serverContent.outputTranscription
              : (serverContent.outputTranscription as any).text ||
                JSON.stringify(serverContent.outputTranscription);
          this.emit("transcript", transcriptText);
        }
      }

      if ("inputTranscription" in serverContent) {
        // Handle user speech transcription
        if (serverContent.inputTranscription) {
          // Extract text from transcription object
          const transcriptText =
            typeof serverContent.inputTranscription === "string"
              ? serverContent.inputTranscription
              : (serverContent.inputTranscription as any).text ||
                JSON.stringify(serverContent.inputTranscription);
          this.emit("userTranscript", transcriptText);
        }
      }

      if ("modelTurn" in serverContent) {
        let parts: Part[] = serverContent.modelTurn?.parts || [];

        // when its audio that is returned for modelTurn
        const audioParts = parts.filter(
          (p) => p.inlineData && p.inlineData.mimeType?.startsWith("audio/pcm")
        );
        const base64s = audioParts.map((p) => p.inlineData?.data);

        // strip the audio parts out of the modelTurn
        const otherParts = difference(parts, audioParts);
        // console.log("otherParts", otherParts);

        base64s.forEach((b64) => {
          if (b64) {
            const data = base64ToArrayBuffer(b64);
            this.emit("audio", data);
            this.log(`server.audio`, `buffer (${data.byteLength})`);
          }
        });
        if (!otherParts.length) {
          return;
        }

        parts = otherParts;

        const content: { modelTurn: Content } = { modelTurn: { parts } };
        this.emit("content", content);
        this.log(`server.content`, message);
      }
    } else {
      console.log("received unmatched message", message);
    }
  }

  /**
   * send realtimeInput, this is base64 chunks of "audio/pcm" and/or "image/jpg"
   */
  sendRealtimeInput(chunks: Array<{ mimeType: string; data: string }>) {
    let hasAudio = false;
    let hasVideo = false;

    for (const ch of chunks) {
      this.session?.sendRealtimeInput({ media: ch });
      if (ch.mimeType.includes("audio")) {
        hasAudio = true;
      }
      if (ch.mimeType.includes("image")) {
        hasVideo = true;
      }
      if (hasAudio && hasVideo) {
        break;
      }
    }

    const message =
      hasAudio && hasVideo
        ? "audio + video"
        : hasAudio
        ? "audio"
        : hasVideo
        ? "video"
        : "unknown";
    this.log(`client.realtimeInput`, message);
  }

  /**
   *  send a response to a function call and provide the id of the functions you are responding to
   */
  sendToolResponse(toolResponse: LiveClientToolResponse) {
    if (
      toolResponse.functionResponses &&
      toolResponse.functionResponses.length
    ) {
      this.session?.sendToolResponse({
        functionResponses: toolResponse.functionResponses,
      });
      this.log(`client.toolResponse`, toolResponse);
    }
  }

  /**
   * send normal content parts such as { text }
   */
  send(parts: Part | Part[], turnComplete: boolean = true) {
    this.session?.sendClientContent({ turns: parts, turnComplete });
    this.log(`client.send`, {
      turns: Array.isArray(parts) ? parts : [parts],
      turnComplete,
    });
  }
}
