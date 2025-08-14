import React, { useEffect, useState } from "react";
import {
  LightBulbIcon,
  PencilIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

interface LoadingAnimationProps {
  isLoading: boolean;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  isLoading,
}) => {
  const [activeIconIndex, setActiveIconIndex] = useState(0);

  const icons = [
    { component: LightBulbIcon },
    { component: PencilIcon },
    { component: AcademicCapIcon },
  ];

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setActiveIconIndex((prev) => (prev + 1) % icons.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isLoading, icons.length]);

  if (!isLoading) return null;

  return (
    <div className="flex flex-col items-center justify-center h-40">
      <div className="relative h-10 w-10 overflow-hidden">
        {icons.map((icon, index) => {
          const Icon = icon.component;
          const isActive = index === activeIconIndex;
          const isPrevious =
            index === (activeIconIndex - 1 + icons.length) % icons.length;

          return (
            <div
              key={index}
              className={`absolute top-0 left-0 w-full h-full transition-all duration-500 transform flex flex-col items-center
                ${
                  isActive
                    ? "opacity-100 translate-y-0"
                    : isPrevious
                    ? "opacity-0 -translate-y-full"
                    : "opacity-0 translate-y-full"
                }`}
            >
              <Icon className="w-16 h-16 text-blue-500" />
            </div>
          );
        })}
      </div>
      <div className="mt-4">
        <div className="text-sm text-gray-500">
          Preparing code review content
        </div>
      </div>
    </div>
  );
};
