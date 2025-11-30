import { useEffect, useRef, useState } from "react";
import { Circle, Eraser, Pencil, RectangleHorizontalIcon } from "lucide-react";
import { initDraw } from "@/game";
import { IconButton } from "./IconButton";
import Topbar from "./Topbar";
import { Tool } from "@/utils/toolbar";
import Zoom from "./Zoom";


export function Canvas({
  roomId,
  socket
}: {
  socket: WebSocket;
  roomId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>("selection");

  useEffect(() => {
    // @ts-ignore
    window.selectedTool = selectedTool;
  }, [selectedTool]);

  // important: init only once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    initDraw(ctx, roomId, socket);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        width={window.innerWidth}
        height={window.innerHeight}
      />
  
      <Topbar selectedTool={selectedTool} setSelectedTool={setSelectedTool}  />
      <Zoom/>
    </div>
  );
  
}


