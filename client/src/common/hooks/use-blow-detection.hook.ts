import { useEffect, useRef, useState } from "react";

const BLOW_THRESHOLD = 0.05;

export const useBlowDetection = (onBlowDetected: () => void) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isListeningRef = useRef<boolean>(false);
  const [status, setStatus] = useState<"idle" | "listening" | "error">("idle");

  const checkVolume = useRef<VoidFunction>(() => {});

  useEffect(() => {
    const setupAudio = async () => {
      if (isListeningRef.current) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioContextRef.current = new window.AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();

        analyserRef.current.fftSize = 2048;
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        isListeningRef.current = true;
        setStatus("listening");

        checkVolume.current = () => {
          if (!analyserRef.current) return;

          const bufferLength = analyserRef.current.fftSize;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteTimeDomainData(dataArray);

          let sumOfSquares = 0;
          for (let i = 0; i < bufferLength; i++) {
            const normalized = dataArray[i] / 128 - 1;
            sumOfSquares += normalized * normalized;
          }
          const rms = Math.sqrt(sumOfSquares / bufferLength);

          if (rms > BLOW_THRESHOLD) {
            onBlowDetected();
          }

          if (isListeningRef.current) {
            requestAnimationFrame(checkVolume.current);
          }
        };

        requestAnimationFrame(checkVolume.current);
      } catch (err) {
        console.error("Microphone access failed:", err);
        setStatus("error");
      }
    };

    setupAudio();

    return () => {
      isListeningRef.current = false;
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, [onBlowDetected]);

  return { status };
};
