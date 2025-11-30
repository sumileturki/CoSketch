import { useState, useEffect } from "react";

export default function Zoom() {
  const [zoom, setZoom] = useState(1.1); // 110%

  // store globally so initDraw can read it
  useEffect(() => {
    // @ts-ignore
    window.currentZoom = zoom;
  }, [zoom]);

  function zoomIn() {
    setZoom((z) => Math.min(z + 0.1, 4)); // max 400%
  }

  function zoomOut() {
    setZoom((z) => Math.max(z - 0.1, 0.1)); // min 10%
  }

  return (
    <div className="fixed bottom-6 left-6">
      <div className="flex items-center gap-6 bg-[#f6f6fb] text-black shadow-md
                      rounded-2xl px-6 py-3 select-none">
        
        <button onClick={zoomOut} className="text-xl font-light">−</button>

        <div className="text-lg font-medium min-w-[60px] text-center">
          {(zoom * 100).toFixed(0)}%
        </div>

        <button onClick={zoomIn} className="text-xl font-light">+</button>
      </div>
    </div>
  );
}
