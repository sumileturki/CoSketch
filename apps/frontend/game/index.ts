import { HTTP_BACKKEND } from "@/config";
import axios from "axios";
import { Camera } from "./ camera";

// ----------------------------
// TYPES
// ----------------------------
export type Point = {
  x: number;
  y: number;
};

export type ShapeBase = {
  id?: number;
};

export type Shape =
  | (ShapeBase & {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    })
  | (ShapeBase & {
      type: "circle";
      centerX: number;
      centerY: number;
      radiusX: number;
      radiusY: number;
    })
  | (ShapeBase & {
      type: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    })
  | (ShapeBase & {
      type: "diamond";
      centerX: number;
      centerY: number;
      width: number;
      height: number;
    })
  | (ShapeBase & {
      type: "arrow";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    })
  | (ShapeBase & {
      type: "pencil";
      points: Point[];
    })
  | (ShapeBase & {
      type: "text";
      x: number;
      y: number;
      text: string;
      fontSize: number;
    });

type BBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type HandleName = "tl" | "tr" | "bl" | "br";

// ----------------------------
// GEOMETRY HELPERS
// ----------------------------
function distance(aX: number, aY: number, bX: number, bY: number) {
  const dx = aX - bX;
  const dy = aY - bY;
  return Math.sqrt(dx * dx + dy * dy);
}

function isPointNearLine(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tolerance = 8
) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D || 1;
  let t = dot / lenSq;
  t = Math.max(0, Math.min(1, t));

  const cx = x1 + t * C;
  const cy = y1 + t * D;

  return distance(px, py, cx, cy) <= tolerance;
}

function isInsideDiamond(
  px: number,
  py: number,
  cx: number,
  cy: number,
  w: number,
  h: number
) {
  if (w === 0 || h === 0) return false;
  return (
    Math.abs(px - cx) / (w / 2) + Math.abs(py - cy) / (h / 2) <= 1
  );
}

function isInsideText(px: number, py: number, s: Extract<Shape, { type: "text" }>) {
  const approxWidth = s.text.length * (s.fontSize * 0.6);
  const approxHeight = s.fontSize * 1.2;
  return (
    px >= s.x &&
    px <= s.x + approxWidth &&
    py <= s.y &&
    py >= s.y - approxHeight
  );
}

function getBoundingBox(shape: Shape): BBox {
  switch (shape.type) {
    case "rect":
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      };

    case "circle":
      return {
        x: shape.centerX - shape.radiusX,
        y: shape.centerY - shape.radiusY,
        width: shape.radiusX * 2,
        height: shape.radiusY * 2,
      };

    case "diamond":
      return {
        x: shape.centerX - shape.width / 2,
        y: shape.centerY - shape.height / 2,
        width: shape.width,
        height: shape.height,
      };

    case "line":
    case "arrow": {
      const minX = Math.min(shape.x1, shape.x2);
      const minY = Math.min(shape.y1, shape.y2);
      const maxX = Math.max(shape.x1, shape.x2);
      const maxY = Math.max(shape.y1, shape.y2);
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    }

    case "pencil": {
      const pts = shape.points;
      if (pts.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

      let minX = pts[0].x;
      let minY = pts[0].y;
      let maxX = pts[0].x;
      let maxY = pts[0].y;

      for (const p of pts) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }

      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    }

    case "text": {
      const approxWidth = shape.text.length * (shape.fontSize * 0.6);
      const approxHeight = shape.fontSize * 1.2;
      return {
        x: shape.x,
        y: shape.y - approxHeight,
        width: approxWidth,
        height: approxHeight,
      };
    }
  }
}

function translateShape(shape: Shape, dx: number, dy: number) {
  switch (shape.type) {
    case "rect":
      shape.x += dx;
      shape.y += dy;
      break;
    case "circle":
      shape.centerX += dx;
      shape.centerY += dy;
      break;
    case "diamond":
      shape.centerX += dx;
      shape.centerY += dy;
      break;
    case "line":
    case "arrow":
      shape.x1 += dx;
      shape.y1 += dy;
      shape.x2 += dx;
      shape.y2 += dy;
      break;
    case "pencil":
      shape.points = shape.points.map((p) => ({
        x: p.x + dx,
        y: p.y + dy,
      }));
      break;
    case "text":
      shape.x += dx;
      shape.y += dy;
      break;
  }
}

function resizeShapeFromOriginal(
  target: Shape,
  original: Shape,
  originalBBox: BBox,
  newBBox: BBox
) {
  const oldL = originalBBox.x;
  const oldT = originalBBox.y;
  const oldW = originalBBox.width || 1;
  const oldH = originalBBox.height || 1;

  const newL = newBBox.x;
  const newT = newBBox.y;
  const newW = newBBox.width;
  const newH = newBBox.height;

  const mapPoint = (x: number, y: number): Point => ({
    x: newL + ((x - oldL) / oldW) * newW,
    y: newT + ((y - oldT) / oldH) * newH,
  });

  switch (target.type) {
    case "rect":
      target.x = newL;
      target.y = newT;
      target.width = newW;
      target.height = newH;
      break;

    case "circle": {
      const cx = newL + newW / 2;
      const cy = newT + newH / 2;
      target.centerX = cx;
      target.centerY = cy;
      target.radiusX = newW / 2;
      target.radiusY = newH / 2;
      break;
    }

    case "diamond": {
      const cx = newL + newW / 2;
      const cy = newT + newH / 2;
      target.centerX = cx;
      target.centerY = cy;
      target.width = newW;
      target.height = newH;
      break;
    }

    case "line":
    case "arrow": {
      const o = original as Extract<Shape, { type: "line" | "arrow" }>;
      const p1 = mapPoint(o.x1, o.y1);
      const p2 = mapPoint(o.x2, o.y2);
      target.x1 = p1.x;
      target.y1 = p1.y;
      target.x2 = p2.x;
      target.y2 = p2.y;
      break;
    }

    case "pencil": {
      const o = original as Extract<Shape, { type: "pencil" }>;
      target.points = o.points.map((p) => mapPoint(p.x, p.y));
      break;
    }

    case "text": {
      const scaleY = newH / oldH;
      const o = original as Extract<Shape,{type:"text"}>;
      target.fontSize = Math.max(8, o.fontSize * scaleY);
      target.x = newL;
      target.y = newT + newH;
      break;
    }
  }
}

function getHandlesFromBBox(bbox: BBox) {
  return [
    { name: "tl", x: bbox.x, y: bbox.y },
    { name: "tr", x: bbox.x + bbox.width, y: bbox.y },
    { name: "bl", x: bbox.x, y: bbox.y + bbox.height },
    { name: "br", x: bbox.x + bbox.width, y: bbox.y + bbox.height },
  ] as { name: HandleName; x: number; y: number }[];
}

function resizedBBoxFromHandle(
  originalBBox: BBox,
  handle: HandleName,
  mouseX: number,
  mouseY: number
): BBox {
  let { x, y, width, height } = originalBBox;

  const minSize = 10;
  const right = x + width;
  const bottom = y + height;

  let newLeft = x;
  let newTop = y;
  let newRight = right;
  let newBottom = bottom;

  if (handle === "tl") {
    newLeft = mouseX;
    newTop = mouseY;
  } else if (handle === "tr") {
    newRight = mouseX;
    newTop = mouseY;
  } else if (handle === "bl") {
    newLeft = mouseX;
    newBottom = mouseY;
  } else if (handle === "br") {
    newRight = mouseX;
    newBottom = mouseY;
  }

  if (newRight - newLeft < minSize) {
    if (handle === "tl" || handle === "bl") newLeft = newRight - minSize;
    else newRight = newLeft + minSize;
  }

  if (newBottom - newTop < minSize) {
    if (handle === "tl" || handle === "tr") newTop = newBottom - minSize;
    else newBottom = newTop + minSize;
  }

  return {
    x: newLeft,
    y: newTop,
    width: newRight - newLeft,
    height: newBottom - newTop,
  };
}

// ----------------------------
// FIND SHAPE AT POINT
// ----------------------------
function findShapeAt(x: number, y: number, shapes: Shape[]) {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];

    if (s.type === "rect") {
      if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height)
        return i;
    }

    if (s.type === "circle") {
      const dx = x - s.centerX;
      const dy = y - s.centerY;
      if (
        (dx * dx) / (s.radiusX * s.radiusX || 1) +
          (dy * dy) / (s.radiusY * s.radiusY || 1) <=
        1
      )
        return i;
    }

    if (s.type === "diamond") {
      if (isInsideDiamond(x, y, s.centerX, s.centerY, s.width, s.height))
        return i;
    }

    if (s.type === "line" || s.type === "arrow") {
      if (isPointNearLine(x, y, s.x1, s.y1, s.x2, s.y2)) return i;
    }

    if (s.type === "pencil") {
      const pts = s.points;
      for (let j = 0; j < pts.length - 1; j++) {
        if (
          isPointNearLine(x, y, pts[j].x, pts[j].y, pts[j + 1].x, pts[j + 1].y, 6)
        )
          return i;
      }
    }

    if (s.type === "text") {
      if (isInsideText(x, y, s)) return i;
    }
  }
  return null;
}

// ----------------------------
// CREATE TEXT INPUT OVER CANVAS
// ----------------------------
function createTextInput(
  canvasRect: DOMRect,
  screenX: number,
  screenY: number,
  onSubmit: (text: string) => void
) {
  const input = document.createElement("input");
  input.type = "text";
  input.style.position = "absolute";
  input.style.left = `${canvasRect.left + screenX}px`;
  input.style.top = `${canvasRect.top + screenY}px`;
  input.style.fontSize = "18px";
  input.style.color = "white";
  input.style.background = "transparent";
  input.style.border = "1px solid white";
  input.style.outline = "none";
  input.style.zIndex = "9999";
  input.style.padding = "2px 4px";
  input.style.width = "200px";

  document.body.appendChild(input);
  input.focus();

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const text = input.value.trim();
      document.body.removeChild(input);
      onSubmit(text);
    }
    if (e.key === "Escape") {
      document.body.removeChild(input);
      onSubmit("");
    }
  });
}

// ----------------------------
// MAIN INIT DRAW
// ----------------------------
export async function initDraw(
  ctx: CanvasRenderingContext2D,
  roomId: string,
  socket: WebSocket
) {
  // ----------------------------
  // CAMERA
  // ----------------------------
  const camera = new Camera(ctx.canvas, () => clearCanvasLocal());

  let clicked = false;
  let startX = 0;
  let startY = 0;

  let currentPencilPoints: Point[] | null = null;

  let selectedIndex: number | null = null;
  let isDraggingSelection = false;
  let isResizingSelection = false;
  let activeHandle: HandleName | null = null;
  let selectionOriginalShape: Shape | null = null;
  let selectionOriginalBBox: BBox | null = null;
  let lastMouseX = 0;
  let lastMouseY = 0;

  const existingShape: Shape[] = await getExistingShapes(roomId);

  function clearCanvasLocal() {
    clearCanvas(existingShape, ctx, selectedIndex, camera);
  }

  // ----------------------------
  // SOCKET HANDLERS
  // ----------------------------
  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "chat") {
      const parsed = JSON.parse(msg.message);
      const shape = parsed.shape;
      shape.id = msg.id;
      existingShape.push(shape);
      clearCanvasLocal();
    }

    if (msg.type === "delete") {
      const idx = existingShape.findIndex((s) => s.id === msg.id);
      if (idx !== -1) {
        existingShape.splice(idx, 1);
        if (selectedIndex === idx) selectedIndex = null;
        clearCanvasLocal();
      }
    }

    if (msg.type === "update") {
      const idx = existingShape.findIndex((s) => s.id === msg.id);
      if (idx !== -1) {
        existingShape[idx] = { ...msg.shape, id: msg.id };
        clearCanvasLocal();
      }
    }

    if (msg.type === "clear_all") {
        existingShape.length = 0;
        selectedIndex = null;
        clearCanvasLocal();
      }
      
      
      
      
  };

  clearCanvasLocal();

  // ----------------------------
  // MOUSE DOWN
  // ----------------------------
  ctx.canvas.addEventListener("mousedown", (e) => {
    const rect = ctx.canvas.getBoundingClientRect();

    const { x: mouseX, y: mouseY } = camera.screenToWorld(
      e.clientX - rect.left,
      e.clientY - rect.top
    );

    clicked = true;
    startX = mouseX;
    startY = mouseY;

    // @ts-ignore
    const tool: string = window.selectedTool;

    if (tool === "hand") return; // pan handled by camera

    if (tool === "eraser") {
      const idx = findShapeAt(mouseX, mouseY, existingShape);
      if (idx !== null) {
        const id = existingShape[idx].id;
        existingShape.splice(idx, 1);
        socket.send(
          JSON.stringify({ type: "delete", id, roomId })
        );
        if (selectedIndex === idx) selectedIndex = null;
        clearCanvasLocal();
      }
      clicked = false;
      return;
    }

    if (tool === "selection") {
      const idx = findShapeAt(mouseX, mouseY, existingShape);
      if (idx === null) {
        selectedIndex = null;
        clearCanvasLocal();
        clicked = false;
        return;
      }

      selectedIndex = idx;
      const shape = existingShape[idx];
      const bbox = getBoundingBox(shape);
      const handles = getHandlesFromBBox(bbox);

      for (const h of handles) {
        if (distance(mouseX, mouseY, h.x, h.y) <= 8 / camera.scale) {
          isResizingSelection = true;
          isDraggingSelection = false;
          activeHandle = h.name;
          selectionOriginalShape = JSON.parse(JSON.stringify(shape));
          selectionOriginalBBox = bbox;
          clearCanvasLocal();
          return;
        }
      }

      isDraggingSelection = true;
      isResizingSelection = false;
      activeHandle = null;
      lastMouseX = mouseX;
      lastMouseY = mouseY;
      clearCanvasLocal();
      return;
    }

    if (tool === "pencil") {
      currentPencilPoints = [{ x: mouseX, y: mouseY }];
      return;
    }

    if (tool === "clearAll") {
        // const yes = confirm("Are you sure you want to clear the board?");
        // if (!yes) return;
      
        existingShape.length = 0;
      
        socket.send(
          JSON.stringify({
            type: "clear_all",
            roomId,
          })
        );
      
        clearCanvasLocal();
        return;
      }
      
  });

  // ----------------------------
  // MOUSE UP
  // ----------------------------
  ctx.canvas.addEventListener("mouseup", (e) => {
    const rect = ctx.canvas.getBoundingClientRect();
    const { x: endX, y: endY } = camera.screenToWorld(
      e.clientX - rect.left,
      e.clientY - rect.top
    );

    // @ts-ignore
    const tool: string = window.selectedTool;

    if (tool === "selection") {
      if (selectedIndex !== null && (isDraggingSelection || isResizingSelection)) {
        const shape = existingShape[selectedIndex];
        socket.send(
          JSON.stringify({
            type: "update",
            id: shape.id,
            shape,
            roomId,
          })
        );
      }

      isDraggingSelection = false;
      isResizingSelection = false;
      activeHandle = null;
      selectionOriginalShape = null;
      selectionOriginalBBox = null;
      clicked = false;
      clearCanvasLocal();
      return;
    }

    if (!clicked) return;
    clicked = false;

    const width = endX - startX;
    const height = endY - startY;

    let shape: Shape | null = null;

    if (tool === "rect") {
      shape = { type: "rect", x: startX, y: startY, width, height };
    }

    if (tool === "circle") {
      shape = {
        type: "circle",
        centerX: startX + width / 2,
        centerY: startY + height / 2,
        radiusX: Math.abs(width) / 2,
        radiusY: Math.abs(height) / 2,
      };
    }

    if (tool === "diamond") {
      shape = {
        type: "diamond",
        centerX: startX + width / 2,
        centerY: startY + height / 2,
        width: Math.abs(width),
        height: Math.abs(height),
      };
    }

    if (tool === "line") {
      shape = { type: "line", x1: startX, y1: startY, x2: endX, y2: endY };
    }

    if (tool === "arrow") {
      shape = { type: "arrow", x1: startX, y1: startY, x2: endX, y2: endY };
    }

    if (tool === "pencil") {
      if (currentPencilPoints && currentPencilPoints.length > 1) {
        shape = { type: "pencil", points: currentPencilPoints };
      }
      currentPencilPoints = null;
    }

    if (tool === "text") {
      const rect = ctx.canvas.getBoundingClientRect();
      const screen = camera.worldToScreen(startX, startY);

      createTextInput(rect, screen.x, screen.y, (text) => {
        if (!text) {
          clearCanvasLocal();
          return;
        }

        const tShape: Shape = {
          type: "text",
          x: startX,
          y: startY,
          text,
          fontSize: 18,
        };

        socket.send(
          JSON.stringify({
            type: "chat",
            message: JSON.stringify({ shape: tShape }),
            roomId,
          })
        );
      });

      return;
    }

    if (!shape) return;

    socket.send(
      JSON.stringify({
        type: "chat",
        message: JSON.stringify({ shape }),
        roomId,
      })
    );

    clearCanvasLocal();
  });

  // ----------------------------
  // MOUSE MOVE
  // ----------------------------
  ctx.canvas.addEventListener("mousemove", (e) => {
    const rect = ctx.canvas.getBoundingClientRect();
    const { x: mouseX, y: mouseY } = camera.screenToWorld(
      e.clientX - rect.left,
      e.clientY - rect.top
    );

    // @ts-ignore
    const tool: string = window.selectedTool;

    if (tool === "selection" && selectedIndex !== null && clicked) {
      const shape = existingShape[selectedIndex];
      if (!shape) return;

      if (isDraggingSelection) {
        const dx = mouseX - lastMouseX;
        const dy = mouseY - lastMouseY;
        lastMouseX = mouseX;
        lastMouseY = mouseY;

        translateShape(shape, dx, dy);
        clearCanvasLocal();
        return;
      }

      if (
        isResizingSelection &&
        activeHandle &&
        selectionOriginalShape &&
        selectionOriginalBBox
      ) {
        const newBBox = resizedBBoxFromHandle(
          selectionOriginalBBox,
          activeHandle,
          mouseX,
          mouseY
        );

        resizeShapeFromOriginal(
          shape,
          selectionOriginalShape,
          selectionOriginalBBox,
          newBBox
        );

        clearCanvasLocal();
        return;
      }
    }

    if (!clicked) return;

    if (
      tool === "eraser" ||
      tool === "text" ||
      tool === "hand"
    )
      return;

    const width = mouseX - startX;
    const height = mouseY - startY;

    clearCanvasLocal();
    ctx.save();
    camera.applyTransform(ctx);
    ctx.strokeStyle = "white";

    if (tool === "rect") ctx.strokeRect(startX, startY, width, height);

    if (tool === "circle") {
      ctx.beginPath();
      ctx.ellipse(
        startX + width / 2,
        startY + height / 2,
        Math.abs(width) / 2,
        Math.abs(height) / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    if (tool === "line") {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(mouseX, mouseY);
      ctx.stroke();
    }

    if (tool === "diamond") {
      const cx = startX + width / 2;
      const cy = startY + height / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - Math.abs(height) / 2);
      ctx.lineTo(cx + Math.abs(width) / 2, cy);
      ctx.lineTo(cx, cy + Math.abs(height) / 2);
      ctx.lineTo(cx - Math.abs(width) / 2, cy);
      ctx.closePath();
      ctx.stroke();
    }

    if (tool === "arrow") {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(mouseX, mouseY);
      ctx.stroke();

      const angle = Math.atan2(mouseY - startY, mouseX - startX);
      const head = 12;
      const hx1 = mouseX - head * Math.cos(angle - Math.PI / 6);
      const hy1 = mouseY - head * Math.sin(angle - Math.PI / 6);
      const hx2 = mouseX - head * Math.cos(angle + Math.PI / 6);
      const hy2 = mouseY - head * Math.sin(angle + Math.PI / 6);

      ctx.beginPath();
      ctx.moveTo(mouseX, mouseY);
      ctx.lineTo(hx1, hy1);
      ctx.moveTo(mouseX, mouseY);
      ctx.lineTo(hx2, hy2);
      ctx.stroke();
    }

    if (tool === "pencil") {
      if (!currentPencilPoints) currentPencilPoints = [];
      currentPencilPoints.push({ x: mouseX, y: mouseY });

      ctx.beginPath();
      const pts = currentPencilPoints;
      if (pts.length > 0) {
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
      }
    }

    ctx.restore();
  });
}

// ----------------------------
// CLEAR CANVAS + RENDER
// ----------------------------
function clearCanvas(
  shapes: Shape[],
  ctx: CanvasRenderingContext2D,
  selectedIndex: number | null,
  camera: Camera
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.save();
  camera.applyTransform(ctx);

  shapes.forEach((s) => {
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";

    if (s.type === "rect") {
      ctx.strokeRect(s.x, s.y, s.width, s.height);
    }

    if (s.type === "circle") {
      ctx.beginPath();
      ctx.ellipse(
        s.centerX,
        s.centerY,
        s.radiusX,
        s.radiusY,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    if (s.type === "diamond") {
      const cx = s.centerX;
      const cy = s.centerY;
      const w = s.width;
      const h = s.height;
      ctx.beginPath();
      ctx.moveTo(cx, cy - h / 2);
      ctx.lineTo(cx + w / 2, cy);
      ctx.lineTo(cx, cy + h / 2);
      ctx.lineTo(cx - w / 2, cy);
      ctx.closePath();
      ctx.stroke();
    }

    if (s.type === "line") {
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
    }

    if (s.type === "arrow") {
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();

      const angle = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
      const head = 12;
      const hx1 = s.x2 - head * Math.cos(angle - Math.PI / 6);
      const hy1 = s.y2 - head * Math.sin(angle - Math.PI / 6);
      const hx2 = s.x2 - head * Math.cos(angle + Math.PI / 6);
      const hy2 = s.y2 - head * Math.sin(angle + Math.PI / 6);

      ctx.beginPath();
      ctx.moveTo(s.x2, s.y2);
      ctx.lineTo(hx1, hy1);
      ctx.moveTo(s.x2, s.y2);
      ctx.lineTo(hx2, hy2);
      ctx.stroke();
    }

    if (s.type === "pencil") {
      const pts = s.points;
      if (pts.length > 0) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      }
    }

    if (s.type === "text") {
      ctx.font = `${s.fontSize}px sans-serif`;
      ctx.fillText(s.text, s.x, s.y);
    }
  });

  // SELECTION OVERLAY
  if (
    selectedIndex !== null &&
    selectedIndex >= 0 &&
    selectedIndex < shapes.length
  ) {
    const s = shapes[selectedIndex];
    const bbox = getBoundingBox(s);
    const handles = getHandlesFromBBox(bbox);

    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.setLineDash([4, 2]);
    ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
    ctx.setLineDash([]);

    ctx.fillStyle = "white";
    const size = 6 / camera.scale;

    handles.forEach((h) => {
      ctx.fillRect(h.x - size / 2, h.y - size / 2, size, size);
    });
  }

  ctx.restore();
}

// ----------------------------
// FETCH SHAPES FROM BACKEND
// ----------------------------
async function getExistingShapes(roomId: string): Promise<Shape[]> {
  const res = await axios.get(`${HTTP_BACKKEND}/chats/${roomId}`);
  const messages = res.data.messages;

  return messages.map((x: { id: number; message: string }) => {
    const data = JSON.parse(x.message);
    const shape = data.shape as Shape;
    shape.id = x.id;
    return shape;
  });
}
