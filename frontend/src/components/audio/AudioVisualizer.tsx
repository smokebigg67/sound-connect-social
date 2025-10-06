import { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
  audioSrc?: string;
  isRecording?: boolean;
  className?: string;
  height?: number;
  barCount?: number;
  color?: string;
}

export default function AudioVisualizer({
  audioSrc,
  isRecording = false,
  className = '',
  height = 60,
  barCount = 32,
  color = 'hsl(var(--primary))'
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioSrc && !audioElement) {
      const audio = new Audio(audioSrc);
      audio.crossOrigin = 'anonymous';
      setAudioElement(audio);
    }
  }, [audioSrc, audioElement]);

  useEffect(() => {
    if (!audioElement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up audio context
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;
    
    if (!analyserRef.current) {
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
    }

    const analyser = analyserRef.current;

    if (!sourceRef.current) {
      sourceRef.current = audioContext.createMediaElementSource(audioElement);
      sourceRef.current.connect(analyser);
      analyser.connect(audioContext.destination);
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!ctx || !canvas) return;

      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / barCount;
      let x = 0;

      // Draw frequency bars
      for (let i = 0; i < barCount; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '40'); // Add transparency
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        
        x += barWidth;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    // Start animation when audio plays
    const handlePlay = () => {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      draw();
    };

    const handlePause = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handlePause);

    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handlePause);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement, barCount, color]);

  // Recording visualization
  useEffect(() => {
    if (!isRecording || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const drawRecordingBars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / barCount;
      let x = 0;

      for (let i = 0; i < barCount; i++) {
        // Create random heights for recording animation
        const barHeight = Math.random() * canvas.height * 0.8;
        
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, 'hsl(var(--destructive))');
        gradient.addColorStop(1, 'hsl(var(--destructive))' + '40');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        
        x += barWidth;
      }

      animationId = requestAnimationFrame(drawRecordingBars);
    };

    drawRecordingBars();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isRecording, barCount]);

  // Static bars when not playing
  useEffect(() => {
    if (audioSrc || isRecording) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / barCount;
    let x = 0;

    for (let i = 0; i < barCount; i++) {
      const barHeight = Math.random() * canvas.height * 0.3;
      
      ctx.fillStyle = color + '20'; // Very transparent
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
      
      x += barWidth;
    }
  }, [audioSrc, isRecording, barCount, color]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={height}
      className={`w-full ${className}`}
      style={{ height: `${height}px` }}
    />
  );
}