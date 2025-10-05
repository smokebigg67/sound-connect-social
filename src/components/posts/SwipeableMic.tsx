import { useState, useCallback } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { Check, Loader2, Mic } from "lucide-react";

interface SwipeableMicProps {
  onSwipeComplete: () => void;
}

const DRAG_CONSTRAINTS = { left: 0, right: 155 };
const DRAG_THRESHOLD = 0.9;

const BUTTON_STATES = {
  initial: { width: "12rem" },
  completed: { width: "3rem" },
};

const ANIMATION_CONFIG = {
  spring: {
    type: "spring" as const,
    stiffness: 400,
    damping: 40,
    mass: 0.8,
  },
};

const SwipeableMic = ({ onSwipeComplete }: SwipeableMicProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const dragX = useMotionValue(0);
  const springX = useSpring(dragX, ANIMATION_CONFIG.spring);
  const dragProgress = useTransform(
    springX,
    [0, DRAG_CONSTRAINTS.right],
    [0, 1]
  );

  const handleDragStart = useCallback(() => {
    if (completed) return;
    setIsDragging(true);
  }, [completed]);

  const handleDragEnd = () => {
    if (completed) return;
    setIsDragging(false);

    const progress = dragProgress.get();
    if (progress >= DRAG_THRESHOLD) {
      setCompleted(true);
      setStatus("loading");
      
      // Simulate loading, then trigger callback
      setTimeout(() => {
        setStatus("success");
        setTimeout(() => {
          onSwipeComplete();
          // Reset after animation
          setTimeout(() => {
            setCompleted(false);
            setStatus("idle");
            dragX.set(0);
          }, 500);
        }, 300);
      }, 800);
    } else {
      dragX.set(0);
    }
  };

  const handleDrag = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (completed) return;
    const newX = Math.max(0, Math.min(info.offset.x, DRAG_CONSTRAINTS.right));
    dragX.set(newX);
  };

  const adjustedWidth = useTransform(springX, (x) => x + 48);

  return (
    <motion.div
      animate={completed ? BUTTON_STATES.completed : BUTTON_STATES.initial}
      transition={ANIMATION_CONFIG.spring}
      className="relative flex h-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
    >
      {!completed && (
        <motion.div
          style={{
            width: adjustedWidth,
          }}
          className="absolute inset-y-0 left-0 z-0 rounded-full bg-primary/30"
        />
      )}

      <AnimatePresence>
        {!completed && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <span className="text-xs font-medium text-white/70">
              {isDragging ? "Keep swiping →" : "Swipe to comment →"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!completed && (
          <motion.div
            drag="x"
            dragConstraints={DRAG_CONSTRAINTS}
            dragElastic={0.05}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrag={handleDrag}
            style={{ x: springX }}
            className="absolute left-0 z-10 flex cursor-grab items-center justify-start active:cursor-grabbing"
          >
            <motion.div
              animate={{
                scale: isDragging ? 1.1 : 1,
              }}
              className="w-12 h-12 rounded-full bg-primary shadow-lg flex items-center justify-center relative"
            >
              {isDragging && (
                <>
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-primary/40"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                    }}
                  />
                </>
              )}
              <Mic className="w-5 h-5 text-black relative z-10" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {completed && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-12 h-12 rounded-full bg-primary shadow-lg flex items-center justify-center">
              <AnimatePresence mode="wait">
                {status === "loading" && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Loader2 className="animate-spin w-5 h-5 text-black" />
                  </motion.div>
                )}
                {status === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Check className="w-5 h-5 text-black" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SwipeableMic;
