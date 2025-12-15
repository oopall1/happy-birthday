# 🎂 Happy-Birthday: Interactive Digital Cake

An engaging web application built with React, TypeScript, and Tailwind CSS that allows users to interact with a digital birthday cake using their camera and microphone.

## ✨ Features

* **Blow Out Candles:** Uses the user's **microphone** and the Web Audio API to detect a sharp increase in sound volume (a "blow") to extinguish the digital candles.
* **Relight Candles:** Uses the user's **camera** and TensorFlow.js for **real-time hand tracking** to allow the user to guide a virtual match and touch the cake to relight the candles.
* **Dynamic Visuals:** Switches seamlessly between "lit" and "unlit" cake artwork.
* **Modern Stack:** Built using React, TypeScript, and styled with Tailwind CSS for a modern, responsive interface.

## 🚀 Technologies Used

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Tailwind CSS | UI Component Logic, Type Safety, and Styling. |
| **Camera/Video** | `react-webcam` | Simple access and management of the video stream. |
| **Hand Tracking** | TensorFlow.js (MediaPipe Hands) | Real-time hand/finger detection from the video feed. |
| **Audio Processing** | Web Audio API (`AnalyserNode`) | Calculating the Root Mean Square (RMS) volume for blow detection. |

## ⚙️ Setup and Installation

Follow these steps to get your project running locally.

### Prerequisites

* Node.js (LTS recommended)
* pnpm

### Steps

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/oopall1/happy-birthday
    cd happy-birthday
    ```

2.  **Install Dependencies:**
    The project relies on React, Tailwind, and TensorFlow.js libraries.
    ```bash
    pnpm install
    ```

3.  **Run the Development Server:**
    ```bash
    cd client
    pnpm run dev
    ```
    The application should open in your browser in `http://localhost:5173`.

## 💡 How to Interact

1.  **Grant Permissions:** Upon loading, the browser will ask for access to your **Camera** and **Microphone**. You must allow both for the app to function.
2.  **To Extinguish:** The candles start lit. Lean toward your microphone and **blow sharply**. The application will detect the high volume transient sound and switch the cake image to the unlit state.
3.  **To Relight:** Once the candles are out, place your **hand in view of the camera** to see the virtual match appear. Guide your index finger (the match) until the flame **touches the top center area of the cake** to relight the candles.

## 💻 Code Structure

### `src/hooks/`

Contains the core logic integrating browser APIs and external libraries.

* `useCameraAndHandTracking.hook.ts`:
    * Initializes the TensorFlow/MediaPipe Hand Tracking model.
    * Calculates the real-time screen coordinates of the index finger tip (`MatchPosition`).
      
* `useBlowDetection.hook.ts`:
    * Sets up the Web Audio API (`AudioContext` and `AnalyserNode`).
    * Continuously calculates the **Root Mean Square (RMS) volume** of the microphone input.
    * Triggers `onBlowDetected` when the RMS value exceeds the `BLOW_THRESHOLD` (default is 0.6).

### `src/components/`

* `CakeDisplay.tsx`:
    * Renders the current cake image (`lit` or `unlit`).
    * Contains the **Collision Detection Logic** (a `useEffect` hook) that checks if the screen coordinates of the `MatchPosition` overlap with the specific target zone at the top of the cake image. 

### `src/App.tsx`

* Orchestrates the entire application.
* Holds the central `candleState`.
* Renders the `Webcam` component and passes its ref to the tracking hook.
