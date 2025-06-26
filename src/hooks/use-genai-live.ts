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
import { audioContext } from "../lib/utils";
import VolMeterWorket from "../lib/worklets/vol-meter";
import { getCurrentModel } from "../config/aiConfig";

export type UseGenAILiveResults = {
  client: GenAILiveClient;
  connected: boolean;
  connect: (model: string, config: LiveConnectConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  resume: (model: string, config: LiveConnectConfig) => Promise<void>;
  volume: number;
  status: "connected" | "disconnected" | "connecting";
};

export function useGenAILive(options: LiveClientOptions): UseGenAILiveResults {
  const client = useMemo(
    () => new GenAILiveClient(options),
    [options.apiKey] // Only recreate if API key changes
  );
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(0);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({
        id: "audio-out",
        sampleRate: 24000, // Match AudioStreamer and AudioRecorder sample rate
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
      setConnected(false);
      // Stop audio streamer when connection closes to immediately stop voice
      audioStreamerRef.current?.stop();
    };

    const stopAudioStreamer = () => audioStreamerRef.current?.stop();

    const onAudio = (data: ArrayBuffer) =>
      audioStreamerRef.current?.addPCM16(new Uint8Array(data));

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
      await client.connect(model, config);
    },
    [client]
  );

  const disconnect = useCallback(async () => {
    // Stop audio streamer immediately to cut off voice
    audioStreamerRef.current?.stop();
    client.disconnect();
  }, [client]);

  const resume = useCallback(
    async (model: string, config: LiveConnectConfig) => {
      await client.resume(model, config);
    },
    [client]
  );

  return {
    client,
    connected,
    connect,
    disconnect,
    resume,
    volume,
    status: client.status,
  };
}
