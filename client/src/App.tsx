import React, { useState, useCallback, useRef, useEffect } from "react";
import { useCameraAndHandTracking } from "./common/hooks/use-camera-and-hand-tracking.hook";
import { useBlowDetection } from "./common/hooks/use-blow-detection.hook";
import CakeDisplay from "./components/CakeDisplay";
import Webcam from "react-webcam";

import "./App.css";

type CandleState = "lit" | "unlit";

const videoConstraints = {
  width: 640,
  height: 360,
  facingMode: "user",
};

const App: React.FC = () => {
  const [candleState, setCandleState] = useState<CandleState>("lit");
  const [isRelightCoolingDown, setIsRelightCoolingDown] = useState(false);

  // --- Refs ---
  const webcamRef = useRef<Webcam>(null!);
  const cakeRef = useRef<HTMLDivElement>(null);
  const [cakeArea, setCakeArea] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  // Update cake area on mount and resize
  useEffect(() => {
    const updateCakeArea = () => {
      if (cakeRef.current) {
        const rect = cakeRef.current.getBoundingClientRect();
        setCakeArea({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    // Initial update with a slight delay to ensure DOM is ready
    setTimeout(updateCakeArea, 100);

    window.addEventListener("resize", updateCakeArea);
    window.addEventListener("scroll", updateCakeArea);

    return () => {
      window.removeEventListener("resize", updateCakeArea);
      window.removeEventListener("scroll", updateCakeArea);
    };
  }, []);

  // --- Hand Tracking ---
  const { matchPosition } = useCameraAndHandTracking({
    webcamRef,
    targetArea: cakeArea,
  });

  // Callback to extinguish the candles
  const handleBlowDetected = useCallback(() => {
    if (candleState === "lit") {
      setCandleState("unlit");
    }
  }, [candleState]);

  const { status: audioStatus } = useBlowDetection(handleBlowDetected);

  // --- Relighting Logic ---
  const handleRelight = useCallback(() => {
    if (candleState === "unlit" && !isRelightCoolingDown) {
      setCandleState("lit");
      setIsRelightCoolingDown(true);
      setTimeout(() => setIsRelightCoolingDown(false), 2000);
    }
  }, [candleState, isRelightCoolingDown]);

  return (
    <div className="bg-gray-900 p-4">
      <h1 className="text-3xl font-bold text-yellow-300 mb-6 text-center">
        Birthday Cake
      </h1>
      <div className="min-h-screen flex justify-center items-center">
        <div>
          {/* Camera Feed Section */}
          <div className="relative w-full max-w-xl mb-6 flex flex-col items-center">
            <h2 className="text-lg font-semibold text-white mb-2">
              Move your hand to guide the match
            </h2>

            {/* Webcam component */}
            <Webcam
              ref={webcamRef}
              audio={false}
              mirrored={true}
              width={videoConstraints.width}
              height={videoConstraints.height}
              videoConstraints={videoConstraints}
            />

            <p className="text-sm text-gray-400 mt-1">
              {audioStatus !== "listening" && "Microphone Error"}
            </p>
          </div>
        </div>

        {/* Cake Display Section */}
        <div ref={cakeRef}>
          <CakeDisplay
            candleState={candleState}
            matchPosition={matchPosition}
            onRelight={handleRelight}
          />
        </div>

        {/* Status and Instructions */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg max-w-xl w-full text-center">
          <p className="text-xl font-bold text-white">
            Candles are currently:{" "}
            <span
              className={
                candleState === "lit" ? "text-green-400" : "text-red-400"
              }
            >
              {candleState === "lit" ? "LIT! 🕯️" : "OUT! 💨"}
            </span>
          </p>
          <p className="text-gray-300 mt-2">
            {candleState === "lit"
              ? "💨 Blow into your microphone to extinguish the candles!"
              : "✋ Use your hand in front of the camera to move the match to the top of the cake to relight them."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
