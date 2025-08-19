import React, { useCallback, useMemo, useState } from "react";
import { useGenAILiveContext } from "../../../contexts/GenAILiveContext";

interface UserPromptInputProps {
  className?: string;
}

export const UserPromptInput: React.FC<UserPromptInputProps> = ({ className }) => {
  const { client, connected, status, stopAudio } = useGenAILiveContext();
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isDisabled = useMemo(
    () => isSending || !connected || status !== "connected",
    [isSending, connected, status],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed || isDisabled) return;
      setIsSending(true);
      try {
        // Interrupt current AI output before sending a new text prompt
        try {
          (client as any)?.interrupt?.();
        } catch {}
        // Ensure audio playback is cut immediately even if interrupt isn't supported
        try {
          stopAudio();
        } catch {}
        client.send([{ text: trimmed }]);
        setText("");
      } catch {
        // no-op
      } finally {
        setIsSending(false);
      }
    },
    [client, stopAudio, text, isDisabled],
  );

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div
        className="w-full flex items-center gap-2 px-4 py-3 rounded-md border"
        style={{
          backgroundColor: "var(--tokyo-bg)",
          borderColor: "var(--tokyo-border)",
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={connected ? "Send a text-based prompt…" : "Connect to send text prompts…"}
          disabled={isDisabled}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "var(--tokyo-fg)" }}
        />
        <button
          type="submit"
          disabled={isDisabled}
          onMouseEnter={() => {
            if (!isDisabled) setIsHovered(true);
          }}
          onMouseLeave={() => setIsHovered(false)}
          className="text-sm font-semibold px-3 py-1.5 rounded-md"
          style={{
            backgroundColor: isDisabled
              ? "var(--tokyo-comment)"
              : isHovered
                ? "var(--tokyo-accent-darker)"
                : "var(--tokyo-accent)",
            color: "#ffffff",
            opacity: isDisabled ? 0.7 : 1,
            cursor: isDisabled ? "not-allowed" : "pointer",
            transition: "background-color 150ms ease-in-out, opacity 150ms ease-in-out",
          }}
        >
          Send
        </button>
      </div>
    </form>
  );
};
