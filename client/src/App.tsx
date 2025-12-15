import React, { useState, useCallback, useRef, useEffect } from "react";
import { useCameraAndHandTracking } from "./common/hooks/useCameraAndHandTracking.hook";
import { useBlowDetection } from "./common/hooks/useBlowDetection.hook";
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
    <div className="min-h-screen min-w-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl overflow-y-hidden font-bold text-transparent bg-clip-text bg-linear-to-r from-yellow-300 via-pink-300 to-purple-300 mb-3">
          Birthday Cake
        </h1>
        <p className="text-gray-300 text-lg">
          Make a wish and blow out the candles!
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Camera Feed */}
        <div className="flex flex-col items-center">
          <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700 w-full">
            <h2 className="text-2xl font-semibold text-white mb-4 text-center flex items-center justify-center gap-2">
              <span>👋</span> Camera Control
            </h2>

            <div className="relative rounded-xl overflow-hidden shadow-lg mb-4">
              <Webcam
                ref={webcamRef}
                audio={false}
                mirrored={true}
                width={videoConstraints.width}
                height={videoConstraints.height}
                videoConstraints={videoConstraints}
                className="w-full h-auto"
              />
            </div>

            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <p className="text-sm text-gray-400 text-center">
                {audioStatus === "listening" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Microphone Active
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 text-red-400">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Microphone Error
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Instructions Card */}
          <div className="mt-6 bg-linear-to-r from-purple-800 to-pink-800 rounded-2xl p-6 shadow-xl border border-purple-600 w-full">
            <h3 className="text-xl font-bold text-white mb-3 text-center">
              How to Play
            </h3>
            <div className="space-y-3 text-gray-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💨</span>
                <div>
                  <p className="font-semibold">Blow to Extinguish</p>
                  <p className="text-sm text-gray-300">
                    Blow into your microphone to put out the candles
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">✋</span>
                <div>
                  <p className="font-semibold">Hand to Relight</p>
                  <p className="text-sm text-gray-300">
                    Move your hand to guide the match to the candles
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Cake Display */}
        <div className="flex flex-col items-center">
          <div ref={cakeRef} className="mb-6">
            <CakeDisplay
              candleState={candleState}
              matchPosition={matchPosition}
              onRelight={handleRelight}
            />
          </div>

          {/* Status Card */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700 w-full max-w-md">
            <div className="text-center">
              <p className="text-lg text-gray-400 mb-2">Candle Status</p>
              <div
                className={`inline-flex items-center gap-3 px-6 py-3 rounded-full ${
                  candleState === "lit"
                    ? "bg-linear-to-r from-green-600 to-emerald-600"
                    : "bg-linear-to-r from-gray-600 to-gray-700"
                }`}
              >
                <span className="text-3xl overflow-y-hidden">
                  {candleState === "lit" ? "🕯️" : "💨"}
                </span>
                <span className="text-2xl font-bold text-white">
                  {candleState === "lit" ? "LIT" : "OUT"}
                </span>
              </div>

              <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                <p className="text-gray-300 text-sm leading-relaxed">
                  {candleState === "lit"
                    ? "The candles are burning bright! Blow into your microphone to make your wish come true."
                    : "The candles are out! Move your hand in front of the camera to guide the match and relight them."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
