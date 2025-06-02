import React, { useEffect, useState, useRef } from "react";

interface CountdownTimerProps {
  totalMs: number;
  autoStart?: boolean;
  startTrigger?: boolean;
  pauseTrigger?: boolean;
  onTimeUp?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  totalMs,
  autoStart = false,
  startTrigger = false,
  pauseTrigger = false,
  onTimeUp,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(totalMs);
  const [running, setRunning] = useState<boolean>(autoStart);
  const onTimeUpRef = useRef(onTimeUp);

  // Update ref when onTimeUp changes
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

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
    if (timeLeft <= 0 && onTimeUpRef.current) {
      console.log("⏰ CountdownTimer - Time expired, calling onTimeUp");
      onTimeUpRef.current();
    }
  }, [timeLeft]);

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
    } else {
      setRunning(false);
    }
  }, [startTrigger]);

  const formatTimeLeft = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="absolute bottom-5 right-5 z-10 flex flex-col items-center">
      {/* Round timer */}
      <div className="w-20 h-20 relative">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle - updated for Tokyo Night */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="var(--tokyo-bg-lighter)"
            stroke="var(--tokyo-selection)"
            strokeWidth="8"
          />
          {/* Colored progress circle */}
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
        {/* Pause indicator overlay */}
        {pauseTrigger && running && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-tokyo-fg-bright text-xs bg-tokyo-bg-darker bg-opacity-80 rounded px-1">
              PAUSED
            </div>
          </div>
        )}
      </div>
      {/* Time display */}
      <div className="mt-1 font-medium text-sm text-tokyo-fg-bright">
        {formatTimeLeft(timeLeft)}
      </div>
    </div>
  );
};
