import { useState, useRef, useEffect } from "react";
import { Mic } from "lucide-react";

interface SwipeableMicProps {
  onSwipeComplete: () => void;
}

const SwipeableMic = ({ onSwipeComplete }: SwipeableMicProps) => {
  const [dragPosition, setDragPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const threshold = 120; // pixels to swipe before triggering

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX - dragPosition);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    
    const newPosition = clientX - startX;
    // Clamp between 0 and threshold
    const clampedPosition = Math.max(0, Math.min(threshold, newPosition));
    setDragPosition(clampedPosition);
  };

  const handleEnd = () => {
    if (dragPosition >= threshold) {
      onSwipeComplete();
      setDragPosition(0);
    } else {
      // Spring back
      setDragPosition(0);
    }
    setIsDragging(false);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const handleMouseUp = () => handleEnd();
    const handleTouchEnd = () => handleEnd();

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, dragPosition]);

  const progress = (dragPosition / threshold) * 100;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-12 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden"
    >
      {/* Progress background */}
      <div 
        className="absolute inset-0 bg-primary/20 transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
      
      {/* Swipe hint text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-xs font-medium text-white/60">
          {dragPosition > 0 ? "Keep swiping →" : "Swipe to comment →"}
        </span>
      </div>

      {/* Draggable mic button */}
      <div
        className="absolute left-0 top-0 h-12 w-12 cursor-grab active:cursor-grabbing z-10"
        style={{ 
          transform: `translateX(${dragPosition}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      >
        <div className={`w-full h-full rounded-full bg-primary shadow-lg flex items-center justify-center relative
          ${isDragging ? 'scale-110' : 'scale-100'} 
          transition-all duration-300`}
        >
          {/* Ripple effect */}
          {isDragging && (
            <>
              <div className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse" />
            </>
          )}
          
          <Mic 
            className={`w-5 h-5 text-black relative z-10 transition-all duration-300 ${
              dragPosition > threshold / 2 ? 'animate-pulse scale-110' : ''
            } ${
              isDragging ? 'rotate-12' : 'rotate-0'
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default SwipeableMic;
