let highestZ = 1;

class Paper {
  holdingPaper = false;
  currentPaperX = 0;
  currentPaperY = 0;
  rotation = Math.random() * 30 - 15;

  // Track active pointers for touch (and mouse) so we can support two-finger rotation.
  pointers = new Map(); // pointerId -> { x, y }
  rotating = false;
  rotationStartAngle = 0;
  rotationStart = 0;

  init(paper) {
    // Prevent the browser context menu on right-click (desktop) to keep rotation consistent.
    paper.addEventListener("contextmenu", (e) => e.preventDefault());

    paper.addEventListener("pointerdown", (e) => {
      // Only start if we don't already have something active, or if this is a second touch.
      if (!this.holdingPaper) {
        this.holdingPaper = true;
        paper.style.zIndex = highestZ;
        highestZ += 1;
      }

      // Track this pointer for touch/pen/mouse.
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // If this is a right-click on mouse, start rotation mode.
      if (e.pointerType === "mouse" && e.button === 2) {
        this.rotating = true;
        this.rotationStart = this.rotation;
      }

      // On touch, start rotating when two fingers are down.
      if (e.pointerType === "touch" && this.pointers.size === 2) {
        this.rotating = true;
        this.rotationStartAngle = this._currentTouchAngle();
        this.rotationStart = this.rotation;
      }

      // Capture pointer so we keep getting move/up events even if the pointer leaves the element.
      paper.setPointerCapture(e.pointerId);
    });

    paper.addEventListener("pointermove", (e) => {
      if (!this.holdingPaper) return;
      if (!this.pointers.has(e.pointerId)) return;

      const prev = this.pointers.get(e.pointerId);
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;

      // Update stored pointer position
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // If we're in rotating mode, update rotation based on either right-click drag or two-finger pinch/rotate.
      if (this.rotating) {
        if (e.pointerType === "mouse") {
          // For mouse, just adjust rotation based on horizontal movement.
          this.rotation = this.rotationStart + dx;
        } else {
          // For touch, compute angle between the two active touch points.
          if (this.pointers.size === 2) {
            const currentAngle = this._currentTouchAngle();
            const delta = currentAngle - this.rotationStartAngle;
            this.rotation = this.rotationStart + delta;
          }
        }
      } else {
        // Move the paper based on pointer movement.
        this.currentPaperX += dx;
        this.currentPaperY += dy;
      }

      paper.style.transform = `translateX(${this.currentPaperX}px) translateY(${this.currentPaperY}px) rotateZ(${this.rotation}deg)`;
    });

    const endPointer = (e) => {
      if (this.pointers.has(e.pointerId)) {
        this.pointers.delete(e.pointerId);
      }

      // If we lost fingers (touch) or released right mouse button, stop rotating.
      if (this.pointers.size < 2) {
        this.rotating = false;
      }

      // If no pointers are active, stop holding.
      if (this.pointers.size === 0) {
        this.holdingPaper = false;
        this.rotating = false;
      }
    };

    paper.addEventListener("pointerup", endPointer);
    paper.addEventListener("pointercancel", endPointer);

    // Apply initial transform so things don't jump.
    paper.style.transform = `translateX(${this.currentPaperX}px) translateY(${this.currentPaperY}px) rotateZ(${this.rotation}deg)`;
  }

  _currentTouchAngle() {
    const points = Array.from(this.pointers.values());
    if (points.length < 2) return 0;
    const [p1, p2] = points;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }
}

const papers = Array.from(document.querySelectorAll(".paper"));

papers.forEach((paper) => {
  const p = new Paper();
  p.init(paper);
});
