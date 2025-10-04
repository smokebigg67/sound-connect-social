import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface AudioPlayerProps {
  audioUrl: string;
  duration?: number;
  className?: string;
}

const WaveformVisualizer = ({ isPlaying, audioRef }: { isPlaying: boolean; audioRef: React.RefObject<HTMLAudioElement> }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;

    // Initialize audio context and analyser
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      
      const source = audioContextRef.current.createMediaElementSource(audioRef.current);
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioRef]);

  useEffect(() => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isPlaying) {
        // Draw static bars when paused
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = canvas.width / 8;
        for (let i = 0; i < 8; i++) {
          const height = 10 + Math.random() * 5;
          ctx.fillRect(i * barWidth + barWidth / 4, (canvas.height - height) / 2, barWidth / 2, height);
        }
        return;
      }

      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "rgba(255, 215, 0, 0.8)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0.6)");
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth * 0.7, barHeight);
        
        x += barWidth;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={60}
      className="w-full h-full"
    />
  );
};

const AudioPlayer = ({ audioUrl, duration = 0, className = "" }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setAudioDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePlay}
        className="rounded-full w-12 h-12 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm"
      >
        {isPlaying ? (
          <Pause className="w-6 h-6 text-white" />
        ) : (
          <Play className="w-6 h-6 text-white ml-0.5" />
        )}
      </Button>

      <div className="flex-1 space-y-2">
        {/* Waveform visualizer */}
        <div className="h-16 bg-black/20 backdrop-blur-sm rounded-lg overflow-hidden">
          <WaveformVisualizer isPlaying={isPlaying} audioRef={audioRef} />
        </div>
        
        {/* Time display */}
        <div className="flex justify-between text-xs text-white/80 drop-shadow-md">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(audioDuration || duration || 0)}</span>
        </div>
      </div>

      <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />
    </div>
  );
};

export default AudioPlayer;
