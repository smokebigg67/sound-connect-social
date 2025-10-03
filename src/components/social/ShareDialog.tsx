import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Repeat2, Quote } from "lucide-react";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}

const ShareDialog = ({ open, onOpenChange, postId }: ShareDialogProps) => {
  const handleReecho = () => {
    toast.success("Reechoed to your followers!");
    onOpenChange(false);
  };

  const handleLouderrrrr = () => {
    toast.success("Time to make it louderrrrr!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Share this Echo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <Button
            onClick={handleReecho}
            className="w-full justify-start h-auto py-4 bg-muted hover:bg-muted/80 text-foreground border border-border"
            variant="ghost"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-gradient-echo flex items-center justify-center flex-shrink-0">
                <Repeat2 className="w-5 h-5 text-black" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Reecho</p>
                <p className="text-sm text-muted-foreground">Share this echo with your followers</p>
              </div>
            </div>
          </Button>

          <Button
            onClick={handleLouderrrrr}
            className="w-full justify-start h-auto py-4 bg-muted hover:bg-muted/80 text-foreground border border-border"
            variant="ghost"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-gradient-echo flex items-center justify-center flex-shrink-0">
                <Quote className="w-5 h-5 text-black" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Louderrrrr</p>
                <p className="text-sm text-muted-foreground">Add your voice and reshare</p>
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
