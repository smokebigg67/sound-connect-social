import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Trash2, Check } from "lucide-react";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  maxDuration?: number;
}

const AudioRecorder = ({ onRecordingComplete, maxDuration = 300 }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (stream.current) {
        stream.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      stream.current = audioStream;
      mediaRecorder.current = new MediaRecorder(audioStream, {
        mimeType: "audio/webm;codecs=opus",
      });

      const chunks: BlobPart[] = [];
      mediaRecorder.current.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.current.start();
      setIsRecording(true);

      let time = 0;
      timerRef.current = setInterval(() => {
        time += 1;
        setRecordingTime(time);
        if (time >= maxDuration) {
          stopRecording();
        }
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const saveRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
      resetRecording();
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {!audioBlob ? (
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? "bg-destructive animate-pulse-glow"
                : "bg-gradient-audio hover:opacity-90"
            }`}
          >
            {isRecording ? (
              <Square className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>

          {isRecording && (
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-8 bg-primary rounded-full animate-wave"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {formatTime(recordingTime)}
              </p>
              <p className="text-sm text-muted-foreground">Recording...</p>
            </div>
          )}

          {!isRecording && (
            <p className="text-sm text-muted-foreground">
              Tap to start recording
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-4 p-4 bg-card rounded-lg border border-border">
            <Button
              onClick={playPause}
              size="icon"
              variant="outline"
              className="rounded-full"
            >
              <Play className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-audio w-1/3" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {formatTime(recordingTime)}
              </p>
            </div>
          </div>

          <audio
            ref={audioRef}
            src={audioUrl || undefined}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          <div className="flex space-x-2">
            <Button
              onClick={saveRecording}
              className="flex-1 bg-gradient-audio hover:opacity-90"
            >
              <Check className="w-4 h-4 mr-2" />
              Use Recording
            </Button>
            <Button
              onClick={resetRecording}
              variant="outline"
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
