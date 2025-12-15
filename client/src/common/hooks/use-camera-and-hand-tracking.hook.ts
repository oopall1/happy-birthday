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
  const initAttemptRef = useRef(0);

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
        // Wait a bit for the page to fully load
        if (initAttemptRef.current === 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        initAttemptRef.current++;

        // Set backend with retry logic
        try {
          await tf.setBackend("webgl");
          await tf.ready();
        } catch (backendError) {
          console.warn(
            "WebGL backend failed, trying CPU backend:",
            backendError
          );
          await tf.setBackend("cpu");
          await tf.ready();
        }

        if (cancelled) return;

        // Wait for video to be ready
        const video = webcamRef.current?.video;
        if (!video) {
          console.warn("Video element not found, retrying...");
          if (initAttemptRef.current < 10) {
            setTimeout(init, 500);
          }
          return;
        }

        // Ensure video is playing
        if (video.paused) {
          try {
            await video.play();
          } catch (playError) {
            console.warn("Could not auto-play video:", playError);
          }
        }

        // Wait for video dimensions to be available
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          console.warn("Video dimensions not ready, waiting...");
          if (initAttemptRef.current < 10) {
            setTimeout(init, 500);
          }
          return;
        }

        if (cancelled) return;

        // Create hand detector
        console.log("Creating hand detector...");
        detectorRef.current = await handPoseDetection.createDetector(
          handPoseDetection.SupportedModels.MediaPipeHands,
          {
            runtime: "mediapipe",
            modelType: "lite",
            maxHands: 1,
            solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
          }
        );

        console.log("Hand detector initialized successfully");

        if (cancelled) return;

        // Start detection loop
        detectHands();
      } catch (err) {
        console.error("Failed to initialize hand tracking:", err);

        // Retry with exponential backoff
        if (initAttemptRef.current < 5 && !cancelled) {
          const delay = Math.min(
            1000 * Math.pow(2, initAttemptRef.current),
            5000
          );
          console.log(`Retrying initialization in ${delay}ms...`);
          setTimeout(init, delay);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      isRunningRef.current = false;
      initAttemptRef.current = 0;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (detectorRef.current) {
        detectorRef.current.dispose();
        detectorRef.current = null;
      }
    };
  }, [detectHands, webcamRef]);

  return { matchPosition };
};
