import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import { useEffect, useRef, useState, useCallback } from "react";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import Webcam from "react-webcam";

export interface MatchPosition {
  x: number;
  y: number;
  isVisible: boolean;
}

interface UseCameraAndHandTrackingArgs {
  webcamRef: React.RefObject<Webcam>;
  targetArea?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export const useCameraAndHandTracking = ({
  webcamRef,
  targetArea,
}: UseCameraAndHandTrackingArgs) => {
  const [matchPosition, setMatchPosition] = useState<MatchPosition>({
    x: 0,
    y: 0,
    isVisible: false,
  });

  const detectorRef = useRef<handPoseDetection.HandDetector | null>(null);
  const rafRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  /* ------------------------------------------------------- */
  /* Detection loop                                          */
  /* ------------------------------------------------------- */
  const detectHands = useCallback(async () => {
    const video = webcamRef.current?.video;
    const detector = detectorRef.current;

    if (!video || !detector || video.readyState < 2) {
      // eslint-disable-next-line react-hooks/immutability
      rafRef.current = requestAnimationFrame(detectHands);
      return;
    }

    try {
      const hands = await detector.estimateHands(video, {
        flipHorizontal: true,
      });

      if (hands.length > 0) {
        const tip = hands[0].keypoints[8]; // index finger tip

        if (
          tip &&
          targetArea &&
          targetArea.width > 0 &&
          targetArea.height > 0
        ) {
          // Normalize hand position to 0-1 range
          const normalizedX = tip.x / video.videoWidth;
          const normalizedY = tip.y / video.videoHeight;

          // Map to target area (cake display)
          const x = targetArea.left + normalizedX * targetArea.width;
          const y = targetArea.top + normalizedY * targetArea.height;

          setMatchPosition({
            x,
            y,
            isVisible: true,
          });
        }
      } else {
        setMatchPosition((p) => ({ ...p, isVisible: false }));
      }
    } catch (err) {
      console.error("Hand detection error:", err);
    }

    rafRef.current = requestAnimationFrame(detectHands);
  }, [webcamRef, targetArea]);

  /* ------------------------------------------------------- */
  /* Initialization                                         */
  /* ------------------------------------------------------- */
  useEffect(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    let cancelled = false;

    const init = async () => {
      try {
        await tf.setBackend("webgl");
        await tf.ready();

        if (cancelled) return;

        detectorRef.current = await handPoseDetection.createDetector(
          handPoseDetection.SupportedModels.MediaPipeHands,
          {
            runtime: "mediapipe",
            modelType: "lite",
            maxHands: 1,
            solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
          }
        );

        const video = webcamRef.current?.video;
        if (!video) return;

        // Ensure the video is playing
        if (video.paused) {
          await video.play();
        }

        if (video.videoWidth === 0) {
          console.warn("Video not ready yet, waiting...");
          requestAnimationFrame(init);
          return;
        }

        detectHands();
      } catch (err) {
        console.error("Failed to initialize hand tracking:", err);
      }
    };

    init();

    return () => {
      cancelled = true;
      isRunningRef.current = false;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      detectorRef.current?.dispose();
      detectorRef.current = null;
    };
  }, [detectHands, webcamRef]);

  return { matchPosition };
};
