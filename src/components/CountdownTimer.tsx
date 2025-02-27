import React, { useEffect, useState } from "react";

interface CountdownTimerProps {
  totalMs: number;
  autoStart?: boolean;
  startTrigger?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  totalMs,
  autoStart = false,
  startTrigger = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(totalMs);
  const [running, setRunning] = useState<boolean>(autoStart);

  // Calculate percentage of time remaining for progress bar
  const timePercentage = Math.max(0, Math.min(100, (timeLeft / totalMs) * 100));
  
  // Determine color based on time remaining
  const getColorClass = () => {
    if (timePercentage > 60) return "bg-green-500";
    if (timePercentage > 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  useEffect(() => {
    if (!running && !startTrigger) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          clearInterval(timer);
          return 0;
        }
        return newTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, startTrigger]);

  // When startTrigger becomes true, start the timer
  useEffect(() => {
    if (startTrigger) {
      setRunning(true);
    }
  }, [startTrigger]);

  const formatTimeLeft = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="rounded p-2 mb-12">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Time remaining:</span>
        <span className="font-medium">{formatTimeLeft(timeLeft)}</span>
      </div>
      
      {/* Simple progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
        <div 
          className={`h-1.5 rounded-full ${getColorClass()}`}
          style={{ width: `${timePercentage}%` }}
        ></div>
      </div>
    </div>
  );
};