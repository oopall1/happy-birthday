import React, { useRef, useEffect } from "react";
import type { MatchPosition } from "../common/hooks/useCameraAndHandTracking.hook";

type CandleState = "lit" | "unlit";

interface CakeDisplayProps {
  candleState: CandleState;
  matchPosition: MatchPosition;
  onRelight: () => void;
}

const CakeDisplay: React.FC<CakeDisplayProps> = ({
  candleState,
  matchPosition,
  onRelight,
}) => {
  const cakeRef = useRef<HTMLDivElement>(null);

  const currentImage =
    candleState === "lit" ? "/images/cake-lit.png" : "/images/cake.png";

  useEffect(() => {
    if (
      candleState !== "unlit" ||
      !matchPosition.isVisible ||
      !cakeRef.current
    ) {
      return;
    }

    const bounds = cakeRef.current.getBoundingClientRect();

    // 🔥 Top-center ignition zone (SCREEN COORDINATES)
    const touchZone = {
      top: bounds.top,
      bottom: bounds.top + bounds.height * 0.2,
      left: bounds.left + bounds.width * 0.3,
      right: bounds.right - bounds.width * 0.3,
    };

    const hit =
      matchPosition.x > touchZone.left &&
      matchPosition.x < touchZone.right &&
      matchPosition.y > touchZone.top &&
      matchPosition.y < touchZone.bottom;

    if (hit) {
      onRelight();
    }
  }, [matchPosition, candleState, onRelight]);

  return (
    <div
      ref={cakeRef}
      className="relative w-full max-w-xl aspect-4/3 bg-white rounded-xl shadow-2xl p-4"
    >
      <img
        src={currentImage}
        alt="Birthday Cake"
        className="w-full h-full object-contain"
      />

      {/* 🔥 Visual ignition zone (matches math exactly) */}
      {candleState === "unlit" && (
        <div
          className="pointer-events-none absolute border-2 border-dashed border-red-500 opacity-50 flex items-center justify-center text-red-500 text-sm"
          style={{
            top: 0,
            height: "20%",
            left: "30%",
            width: "40%",
          }}
        >
          Touch Here to Relight
        </div>
      )}

      {/* Match Image */}
      {matchPosition.isVisible && (
        <img
          src="/images/match.png"
          alt="Match Flame"
          style={{
            position: "fixed",
            left: `${matchPosition.x}px`,
            top: `${matchPosition.y}px`,
            transform: "translate(-50%, -50%)",
            width: "100px",
            height: "100px",
            zIndex: 9999,
            pointerEvents: "none",
            filter: "drop-shadow(0 0 10px rgba(255, 200, 0, 0.8))",
          }}
        />
      )}
    </div>
  );
};

export default CakeDisplay;
