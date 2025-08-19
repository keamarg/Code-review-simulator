import React, { useEffect, useState, useRef } from "react";
import { appLogger } from "../../lib/utils";

interface CountdownTimerProps {
  totalMs: number;
  autoStart?: boolean;
  startTrigger?: boolean;
  pauseTrigger?: boolean;
  isDeliberatePause?: boolean; // New prop to distinguish deliberate pause from network issues
  onTimeUp?: () => void;
  onIntroduction?: () => void; // New callback for introduction message
  onFarewell?: () => void; // New callback for farewell message
  /**
   * Display style:
   * - "floating": original fixed circular timer at bottom-right
   * - "inline": compact pill suitable for action bars
   */
  variant?: "floating" | "inline";
  /**
   * Optional persistence key. When provided, the timer will restore its remaining time
   * from localStorage on mount and persist on every tick. Useful when the component
   * is conditionally unmounted/remounted (e.g., paused vs connected views).
   */
  persistKey?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  totalMs,
  autoStart = false,
  startTrigger = false,
  pauseTrigger = false,
  isDeliberatePause = false, // Default to false
  onTimeUp,
  onIntroduction,
  onFarewell,
  variant = "floating",
  persistKey,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(totalMs);
  const [running, setRunning] = useState<boolean>(autoStart);
  const onTimeUpRef = useRef(onTimeUp);
  const onIntroductionRef = useRef(onIntroduction);
  const onFarewellRef = useRef(onFarewell);
  const hasCalledOnTimeUp = useRef(false);
  const hasCalledIntroduction = useRef(false);
  const hasCalledFarewell = useRef(false);

  // Update refs when callbacks change
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
    onIntroductionRef.current = onIntroduction;
    onFarewellRef.current = onFarewell;
  }, [onTimeUp, onIntroduction, onFarewell]);

  // Reset flags when timer restarts (new session)
  useEffect(() => {
    if (timeLeft === totalMs) {
      // Timer was reset to full duration - new session
      hasCalledIntroduction.current = false;
      hasCalledFarewell.current = false;
      hasCalledOnTimeUp.current = false;
    }
  }, [timeLeft, totalMs]);

  // Persist remaining time to localStorage and restore on mount/prop changes
  useEffect(() => {
    if (!persistKey) return;
    try {
      const saved = localStorage.getItem(persistKey);
      const n = saved ? parseInt(saved, 10) : NaN;
      if (Number.isFinite(n) && n >= 0 && n <= totalMs) {
        setTimeLeft(n);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistKey, totalMs]);

  useEffect(() => {
    if (!persistKey) return;
    try {
      localStorage.setItem(persistKey, String(timeLeft));
    } catch {}
  }, [persistKey, timeLeft]);

  // Calculate percentage of time remaining for circle timer
  const timePercentage = Math.max(0, Math.min(100, (timeLeft / totalMs) * 100));

  // Calculate stroke-dasharray and stroke-dashoffset for SVG circle
  const circumference = 2 * Math.PI * 45; // 45 is the radius of our circle
  const strokeDashoffset = circumference * (1 - timePercentage / 100);

  // Determine color based on time remaining - updated for Tokyo Night theme
  const getColor = () => {
    if (timePercentage > 60) return "var(--tokyo-accent)"; // primary accent
    if (timePercentage > 30) return "var(--tokyo-purple)"; // purple
    return "var(--tokyo-red)"; // red for low time
  };

  // Handle timer expiration separately
  useEffect(() => {
    if (timeLeft <= 0 && !hasCalledOnTimeUp.current && onTimeUpRef.current) {
      hasCalledOnTimeUp.current = true;
      appLogger.timer.expired();
      onTimeUpRef.current();
    }
  }, [timeLeft]);

  // Handle timed message triggers based on countdown time
  useEffect(() => {
    if (!running) return; // Don't fire messages when not running

    // Introduction message - trigger after 0.5 seconds of countdown (reduced from 1.5s)
    if (timeLeft <= totalMs - 500 && !hasCalledIntroduction.current && onIntroductionRef.current) {
      hasCalledIntroduction.current = true;
      onIntroductionRef.current();
    }

    // Farewell message - trigger when 7 seconds remain
    if (timeLeft <= 7000 && !hasCalledFarewell.current && onFarewellRef.current) {
      hasCalledFarewell.current = true;
      onFarewellRef.current();
    }
  }, [timeLeft, totalMs, running]);

  useEffect(() => {
    if (!running || pauseTrigger) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          clearInterval(timer);
          setRunning(false);
          return 0;
        }
        return newTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, pauseTrigger]);

  // When startTrigger becomes true, start the timer
  useEffect(() => {
    if (startTrigger) {
      setRunning(true);
      appLogger.timer.started(totalMs);
    } else {
      setRunning(false);
    }
  }, [startTrigger, totalMs]);

  const formatTimeLeft = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (variant === "inline") {
    return (
      <div className="ml-2 inline-flex items-center rounded border border-tokyo-selection bg-tokyo-bg-lighter text-tokyo-fg px-2 py-1 text-xs">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="mr-1 text-tokyo-accent"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M15 1H9v2h6V1zM12 7a1 1 0 00-1 1v4.586l3.707 3.707 1.414-1.414L13 11.586V8a1 1 0 00-1-1z" />
          <path d="M12 4a9 9 0 100 18 9 9 0 000-18zm0 16a7 7 0 110-14 7 7 0 010 14z" />
        </svg>
        <span className="font-medium">{formatTimeLeft(timeLeft)}</span>
        {pauseTrigger && running && isDeliberatePause && (
          <span className="ml-2 text-[10px] text-tokyo-comment">PAUSED</span>
        )}
      </div>
    );
  }

  return (
    <div className="absolute bottom-5 right-5 z-10 flex flex-col items-center">
      <div className="w-20 h-20 relative">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="var(--tokyo-bg-lighter)"
            stroke="var(--tokyo-selection)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            stroke={getColor()}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        {pauseTrigger && running && isDeliberatePause && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-tokyo-fg-bright text-xs bg-tokyo-bg-darker bg-opacity-80 rounded px-1">
              PAUSED
            </div>
          </div>
        )}
      </div>
      <div className="mt-1 font-medium text-sm text-tokyo-fg-bright">
        {formatTimeLeft(timeLeft)}
      </div>
    </div>
  );
};
