import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Volume2 } from "lucide-react";
import { motion } from "framer-motion";

interface CommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WaveAnimation = () => {
  const bars = Array.from({ length: 5 });
  
  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {bars.map((_, index) => (
        <motion.div
          key={index}
          className="w-1 bg-primary rounded-full"
          animate={{
            height: ["8px", "32px", "8px"],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

const CommentDialog = ({ open, onOpenChange }: CommentDialogProps) => {
  const [mode, setMode] = useState<"choose" | "record" | "listen">("choose");
  const [isRecording, setIsRecording] = useState(false);

  const handleRecord = () => {
    setMode("record");
    setIsRecording(true);
    // Start recording logic here
  };

  const handleListen = () => {
    setMode("listen");
    // Load comments logic here
  };

  const handleClose = () => {
    setMode("choose");
    setIsRecording(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Comments</DialogTitle>
          <DialogDescription>
            {mode === "choose" && "Choose an option to continue"}
            {mode === "record" && "Recording your comment (30s max)"}
            {mode === "listen" && "Listen to other comments"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {mode === "choose" && (
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleRecord}
                  className="w-full h-32 flex flex-col gap-3 bg-gradient-echo hover:opacity-90"
                  size="lg"
                >
                  <Mic className="w-8 h-8" />
                  <span className="font-semibold">Record</span>
                  <span className="text-xs opacity-90">30s max</span>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleListen}
                  className="w-full h-32 flex flex-col gap-3"
                  variant="outline"
                  size="lg"
                >
                  <Volume2 className="w-8 h-8" />
                  <span className="font-semibold">Listen</span>
                  <span className="text-xs opacity-90">Other comments</span>
                </Button>
              </motion.div>
            </div>
          )}

          {mode === "record" && (
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              <div className="w-24 h-24 rounded-full bg-gradient-echo flex items-center justify-center animate-pulse-glow">
                <Mic className="w-12 h-12 text-black" />
              </div>
              
              <WaveAnimation />
              
              <div className="text-center">
                <p className="text-2xl font-bold">00:05</p>
                <p className="text-sm text-muted-foreground">Time remaining: 25s</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  setIsRecording(false);
                  // Save recording logic here
                  setTimeout(handleClose, 500);
                }}>
                  Save Comment
                </Button>
              </div>
            </div>
          )}

          {mode === "listen" && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                No comments yet. Be the first to leave one!
              </p>
              <Button variant="outline" onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentDialog;
