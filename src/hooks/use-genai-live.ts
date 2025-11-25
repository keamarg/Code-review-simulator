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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LiveConnectConfig } from "@google/genai";
import { GenAILiveClient } from "../lib/genai-live-client";
import { LiveClientOptions } from "../types";
import { AudioStreamer } from "../lib/audio-streamer";
import { audioContext, appLogger } from "../lib/utils";
import VolMeterWorket from "../lib/worklets/vol-meter";

export type UseGenAILiveResults = {
  client: GenAILiveClient;
  connected: boolean;
  connect: (model: string, config: LiveConnectConfig) => Promise<boolean>;
  disconnect: () => Promise<void>;
  stopAudio: () => void; // Add stopAudio function
  volume: number;
  status: "connected" | "disconnected" | "connecting";
};

// Global client instance to prevent multiple WebSocket connections
let globalClient: GenAILiveClient | null = null;
let globalApiKey: string | null = null;

// eslint-disable-next-line react-hooks/exhaustive-deps
export function useGenAILive(options: LiveClientOptions): UseGenAILiveResults {
  const client = useMemo(() => {
    // If we already have a client with the same API key, reuse it
    if (globalClient && globalApiKey === options.apiKey) {
      // Only log once per session, not on every render
      return globalClient;
    }

    // If we have a different API key, terminate the old client first
    if (globalClient && globalApiKey !== options.apiKey) {
      appLogger.generic.info(`🔄 Terminating old GenAI Live Client for API key change`);
      globalClient.terminateSession();
      globalClient = null;
      globalApiKey = null;
    }

    // Create new client
    appLogger.generic.info(
      `🔄 Creating new GenAI Live Client for API key: ${options.apiKey?.substring(0, 10)}...`,
    );
    const newClient = new GenAILiveClient(options);
    globalClient = newClient;
    globalApiKey = options.apiKey;
    return newClient;
  }, [options.apiKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(0);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      // Don't specify sampleRate - let browser use default to match MediaStream
      audioContext({
        id: "audio-out",
        // DON'T specify sampleRate - let browser use default
      }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>("vumeter-out", VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            // Successfully added worklet
          });
      });
    }
  }, [audioStreamerRef]);

  useEffect(() => {
    const onOpen = () => {
      setConnected(true);
    };

    const onClose = () => {
      // During mid-session voice/environment changes we deliberately reconnect;
      // suppress UI flicker by keeping "connected" true while the client is handling resumption
      const suppressUI =
        (client as any).isVoiceChangeInProgress === true ||
        (client as any).screenChangeInProgress === true;
      if (!suppressUI) {
        setConnected(false);
        // Stop audio streamer when connection closes to immediately stop voice
        audioStreamerRef.current?.stop();
      }
    };

    const stopAudioStreamer = () => audioStreamerRef.current?.stop();

    const onAudio = (data: ArrayBuffer) => audioStreamerRef.current?.addPCM16(new Uint8Array(data));

    client
      .on("open", onOpen)
      .on("close", onClose)
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio);

    return () => {
      client
        .off("open", onOpen)
        .off("close", onClose)
        .off("interrupted", stopAudioStreamer)
        .off("audio", onAudio);
    };
  }, [client]);

  const connect = useCallback(
    async (model: string, config: LiveConnectConfig) => {
      return await client.connect(model, config);
    },
    [client],
  );

  const disconnect = useCallback(async () => {
    // Stop audio streamer immediately to cut off voice
    audioStreamerRef.current?.stop();
    client.disconnect();
  }, [client]);

  const stopAudio = useCallback(() => {
    // Stop audio streamer immediately to cut off AI voice
    audioStreamerRef.current?.stop();
  }, []);

  // Cleanup effect to terminate global client when component unmounts
  useEffect(() => {
    return () => {
      // Only terminate if this is the last component using the client
      // This is a simple approach - in a more complex app you might want reference counting
      if (globalClient && globalApiKey === options.apiKey) {
        // eslint-disable-next-line no-console
        appLogger.generic.info(`🔄 Terminating global GenAI Live Client on unmount`);
        globalClient.terminateSession();
        globalClient = null;
        globalApiKey = null;
      }
    };
  }, [options.apiKey]);

  return {
    client,
    connected,
    connect,
    disconnect,
    stopAudio, // Add stopAudio to return values
    volume,
    status: client.status,
  };
}
