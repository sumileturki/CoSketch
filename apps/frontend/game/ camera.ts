// ------------------------------------------------------
// camera.ts  (Figma-style camera system)
// ------------------------------------------------------

export class Camera {
    panX = 0;
    panY = 0;
    scale = 1.0;
  
    MIN_ZOOM = 0.2;
    MAX_ZOOM = 3.0;
  
    isPanning = false;
    panStartX = 0;
    panStartY = 0;
  
    velocityX = 0;
    velocityY = 0;
  
    spacePressed = false;
  
    canvas: HTMLCanvasElement;
    onChange: () => void;
  
    constructor(canvas: HTMLCanvasElement, onChange: () => void) {
      this.canvas = canvas;
      this.onChange = onChange;
      this.setupEvents();
      this.animate();
    }
  
    // --------------------------------------------------
    // COORDINATE CONVERSION
    // --------------------------------------------------
    screenToWorld(px: number, py: number) {
      return {
        x: (px - this.panX) / this.scale,
        y: (py - this.panY) / this.scale,
      };
    }
  
    worldToScreen(wx: number, wy: number) {
      return {
        x: wx * this.scale + this.panX,
        y: wy * this.scale + this.panY,
      };
    }
  
    // --------------------------------------------------
    // EVENT LISTENERS
    // --------------------------------------------------
    setupEvents() {
      // SPACE HELD → Hand tool temp
      window.addEventListener("keydown", (e) => {
        if (e.code === "Space") this.spacePressed = true;
      });
  
      window.addEventListener("keyup", (e) => {
        if (e.code === "Space") this.spacePressed = false;
      });
  
      // MOUSE DOWN (Pan start)
      this.canvas.addEventListener("mousedown", (e) => {
        // @ts-ignore
        const tool = window.selectedTool;
  
        if (tool === "hand" || this.spacePressed || e.button === 1) {
          this.isPanning = true;
          this.panStartX = e.clientX - this.panX;
          this.panStartY = e.clientY - this.panY;
        }
      });
  
      // MOUSE MOVE (Pan)
      this.canvas.addEventListener("mousemove", (e) => {
        if (!this.isPanning) return;
  
        const newPanX = e.clientX - this.panStartX;
        const newPanY = e.clientY - this.panStartY;
  
        this.velocityX = newPanX - this.panX;
        this.velocityY = newPanY - this.panY;
  
        this.panX = newPanX;
        this.panY = newPanY;
  
        this.onChange();
      });
  
      // STOP PAN
      this.canvas.addEventListener("mouseup", () => {
        this.isPanning = false;
      });
  
      // ZOOM + TRACKPAD SUPPORT
      this.canvas.addEventListener(
        "wheel",
        (e) => {
          const rect = this.canvas.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
  
          const isPinchZoom = e.ctrlKey || Math.abs(e.deltaY) < 50;
  
          if (isPinchZoom) {
            e.preventDefault();
  
            const zoomFactor = 1 - e.deltaY * 0.0008;
  
            let newScale = this.scale * zoomFactor;
            newScale = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, newScale));
  
            const worldBefore = this.screenToWorld(mouseX, mouseY);
  
            this.scale = newScale;
  
            const worldAfter = this.screenToWorld(mouseX, mouseY);
  
            this.panX += (worldAfter.x - worldBefore.x) * this.scale;
            this.panY += (worldAfter.y - worldBefore.y) * this.scale;
  
            this.onChange();
          } else {
            // Trackpad pan
            this.panX -= e.deltaX;
            this.panY -= e.deltaY;
            this.onChange();
          }
        },
        { passive: false }
      );
    }
  
    // --------------------------------------------------
    // INERTIA (smooth pan)
    // --------------------------------------------------
    animate() {
      requestAnimationFrame(() => this.animate());
  
      if (Math.abs(this.velocityX) > 0.1 || Math.abs(this.velocityY) > 0.1) {
        this.panX += this.velocityX;
        this.panY += this.velocityY;
  
        this.velocityX *= 0.90;
        this.velocityY *= 0.90;
  
        this.onChange();
      }
    }
  
    // --------------------------------------------------
    // APPLY CAMERA TRANSFORM TO CTX
    // --------------------------------------------------
    applyTransform(ctx: CanvasRenderingContext2D) {
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.scale, this.scale);
    }
  }
  