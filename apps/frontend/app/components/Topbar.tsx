import {
    Hand,
    MousePointer2,
    RectangleHorizontalIcon,
    Diamond,
    Circle,
    ArrowRightIcon,
    Minus,
    PenLine,
    TextCursorIcon,
    Image,
    EraserIcon,
    Trash2
  } from "lucide-react";
  
  import { IconButton } from "./IconButton";
  import { Tool } from "@/utils/toolbar";
  
  export default function Topbar({
    selectedTool,
    setSelectedTool
  }: {
    selectedTool: Tool;
    setSelectedTool: (s: Tool) => void;
  }) {
    return (
      <div className="fixed top-5 left-1/2 -translate-x-1/2">
        <div className="flex gap-2 border border-gray-400 backdrop-blur-md p-2 rounded-xl shadow-md">
  
          <IconButton
            onClick={() => setSelectedTool("hand")}
            activated={selectedTool === "hand"}
            icon={<Hand />}
          />
  
          <IconButton
            onClick={() => setSelectedTool("selection")}
            activated={selectedTool === "selection"}
            icon={<MousePointer2 />}
          />
  
          <IconButton
            onClick={() => setSelectedTool("rect")}
            activated={selectedTool === "rect"}
            icon={<RectangleHorizontalIcon />}
          />
  
          <IconButton
            onClick={() => setSelectedTool("diamond")}
            activated={selectedTool === "diamond"}
            icon={<Diamond />}
          />
  
          <IconButton
            onClick={() => setSelectedTool("circle")}
            activated={selectedTool === "circle"}
            icon={<Circle />}
          />
  
          <IconButton
            onClick={() => setSelectedTool("arrow")}
            activated={selectedTool === "arrow"}
            icon={<ArrowRightIcon />}
          />
  
          <IconButton
            onClick={() => setSelectedTool("line")}
            activated={selectedTool === "line"}
            icon={<Minus />}
          />
  
          <IconButton
            onClick={() => setSelectedTool("pencil")}
            activated={selectedTool === "pencil"}
            icon={<PenLine />}
          />
  
          <IconButton
            onClick={() => setSelectedTool("text")}
            activated={selectedTool === "text"}
            icon={<TextCursorIcon />}
          />
  
          <IconButton
            onClick={() => setSelectedTool("image")}
            activated={selectedTool === "image"}
            icon={<Image />}
          />
  
          <IconButton
            onClick={() => setSelectedTool("eraser")}
            activated={selectedTool === "eraser"}
            icon={<EraserIcon />}
          />
  
          {/* UPDATED CLEAR ALL BUTTON */}
          <IconButton
            onClick={() => {
              setSelectedTool("clearAll");
            }}
            activated={selectedTool === "clearAll"}
            icon={<Trash2 />}
          />
        </div>
      </div>
    );
  }
  