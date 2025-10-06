import { motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InstallPromptProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export default function InstallPrompt({ onInstall, onDismiss }: InstallPromptProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
    >
      <div className="bg-card border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Download className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Install ECHO</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Install our app for a better experience and offline access
            </p>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={onInstall}
                className="flex-1"
              >
                Install
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onDismiss}
              >
                Not now
              </Button>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
