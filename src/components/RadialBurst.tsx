"use client";

import { useRef, useEffect, useCallback } from "react";

interface Line {
  angle: number;
  baseLength: number;
  width: number;
  opacity: number;
  particleT: number;
  particleSpeed: number;
  particleSize: number;
  particleOpacity: number;
  wobbleAmp: number;
  wobbleSpeed: number;
  wobbleOffset: number;
  currentAngle: number;
}

const LINE_COUNT = 140;
const BASE_HUE = 172;

function createLine(i: number, total: number): Line {
  const spread = Math.PI * 1.0;
  const startAngle = -Math.PI / 2 - spread / 2;
  const baseAngle = startAngle + (i / (total - 1)) * spread;
  const angle = baseAngle + (Math.random() - 0.5) * 0.08;
  const baseLength = 0.34 + Math.random() * 0.61;

  return {
    angle,
    baseLength,
    width: 0.5 + Math.random() * 1.0,
    opacity: 0.15 + Math.random() * 0.35,
    particleT: Math.random(),
    particleSpeed: 0.001 + Math.random() * 0.003,
    particleSize: 0.8 + Math.random() * 1.2,
    particleOpacity: 0.2 + Math.random() * 0.35,
    wobbleAmp: 0.005 + Math.random() * 0.015,
    wobbleSpeed: 0.0005 + Math.random() * 0.002,
    wobbleOffset: Math.random() * Math.PI * 2,
    currentAngle: angle,
  };
}

export default function RadialBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const linesRef = useRef<Line[]>([]);
  const pointerRef = useRef({ x: 0.5, y: 0.5, active: false });
  const scrollRef = useRef(0);
  const scrollVelocityRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const lastScrollTimeRef = useRef(0);
  const frameRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    linesRef.current = Array.from({ length: LINE_COUNT }, (_, i) =>
      createLine(i, LINE_COUNT)
    );
  }, []);

  // Unified pointer (mouse + touch) handling
  useEffect(() => {
    const updatePointer = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      pointerRef.current = {
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height,
        active: true,
      };
    };

    const handleMouseMove = (e: MouseEvent) => updatePointer(e.clientX, e.clientY);
    const handleMouseLeave = () => { pointerRef.current.active = false; };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) updatePointer(touch.clientX, touch.clientY);
    };
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) updatePointer(touch.clientX, touch.clientY);
    };
    const handleTouchEnd = () => { pointerRef.current.active = false; };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  // Scroll tracking with velocity for inertia jiggle
  useEffect(() => {
    const handleScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      scrollRef.current = Math.max(0, Math.min(1, -rect.top / vh));

      // Compute scroll velocity
      const now = performance.now();
      const dt = now - lastScrollTimeRef.current;
      if (dt > 0) {
        const dy = window.scrollY - lastScrollYRef.current;
        // Velocity in px/ms, clamped
        scrollVelocityRef.current = Math.max(-3, Math.min(3, dy / Math.max(dt, 1)));
      }
      lastScrollYRef.current = window.scrollY;
      lastScrollTimeRef.current = now;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    ctx.clearRect(0, 0, w, h);

    // Origin: locked at bottom center
    const ox = w * 0.5;
    const oy = h * 1.02;

    const pointer = pointerRef.current;
    const scroll = scrollRef.current;
    const scrollExpand = 1 + scroll * 0.3;

    // Scroll inertia: decays smoothly each frame
    scrollVelocityRef.current *= 0.94; // friction
    const inertia = scrollVelocityRef.current;

    // Pointer position in canvas pixel coords
    const ptrPx = pointer.active ? pointer.x * w : -9999;
    const ptrPy = pointer.active ? pointer.y * h : -9999;

    // Angle from origin to pointer
    const ptrAngle = Math.atan2(ptrPy - oy, ptrPx - ox);
    const ptrDist = Math.sqrt((ptrPx - ox) ** 2 + (ptrPy - oy) ** 2);
    const influenceRadius = 0.6;
    const distFactor = pointer.active
      ? Math.max(0, 1 - ptrDist / (h * 1.2))
      : 0;

    for (const line of linesRef.current) {
      // Base wobble + scroll inertia jiggle
      const wobble =
        Math.sin(time * line.wobbleSpeed + line.wobbleOffset) * line.wobbleAmp;
      // Inertia adds a per-line jiggle scaled by line position in the fan
      const inertiaJiggle = inertia * 0.06 * Math.sin(line.angle * 5 + time * 0.002);
      const naturalAngle = line.angle + wobble + inertiaJiggle;

      // Calculate attraction toward pointer
      let targetAngle = naturalAngle;

      if (pointer.active && distFactor > 0) {
        let angleDiff = ptrAngle - naturalAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const absAngleDiff = Math.abs(angleDiff);
        if (absAngleDiff < influenceRadius) {
          const proximity = 1 - absAngleDiff / influenceRadius;
          const strength = proximity * proximity * distFactor * 0.85;
          targetAngle = naturalAngle + angleDiff * strength;
        }
      }

      // Smooth interpolation
      const isAttracted = pointer.active && distFactor > 0;
      const lerpSpeed = isAttracted ? 0.12 : 0.03;
      line.currentAngle += (targetAngle - line.currentAngle) * lerpSpeed;
      const finalAngle = line.currentAngle;

      // Inertia also affects line length — slight stretch/compress
      const inertiaLen = 1 + Math.abs(inertia) * 0.2;
      const len = line.baseLength * h * scrollExpand * inertiaLen;

      const endX = ox + Math.cos(finalAngle) * len;
      const endY = oy + Math.sin(finalAngle) * len;

      // Draw line with gradient fade
      const grad = ctx.createLinearGradient(ox, oy, endX, endY);
      grad.addColorStop(
        0,
        `hsla(${BASE_HUE}, 80%, 75%, ${line.opacity * 0.6})`
      );
      grad.addColorStop(
        0.5,
        `hsla(${BASE_HUE}, 70%, 65%, ${line.opacity * 0.4})`
      );
      grad.addColorStop(1, `hsla(${BASE_HUE}, 60%, 55%, 0)`);

      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = line.width;
      ctx.stroke();

      // Animate particle
      line.particleT += line.particleSpeed;
      if (line.particleT > 1) line.particleT = 0;

      const t = line.particleT;
      const px = ox + Math.cos(finalAngle) * len * t;
      const py = oy + Math.sin(finalAngle) * len * t;

      const edgeFade = Math.sin(t * Math.PI);
      const pAlpha = line.particleOpacity * edgeFade;

      if (pAlpha > 0.01) {
        const r = line.particleSize;
        const pGrad = ctx.createRadialGradient(px, py, 0, px, py, r * 3);
        pGrad.addColorStop(
          0,
          `hsla(217, 90%, 72%, ${pAlpha * 0.5})`
        );
        pGrad.addColorStop(
          0.3,
          `hsla(217, 85%, 65%, ${pAlpha * 0.25})`
        );
        pGrad.addColorStop(1, `hsla(217, 80%, 58%, 0)`);

        ctx.beginPath();
        ctx.arc(px, py, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = pGrad;
        ctx.fill();
      }
    }

    // Subtle center glow
    const centerGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, h * 0.35);
    centerGrad.addColorStop(0, `hsla(${BASE_HUE}, 80%, 70%, 0.08)`);
    centerGrad.addColorStop(0.5, `hsla(${BASE_HUE}, 70%, 60%, 0.03)`);
    centerGrad.addColorStop(1, "transparent");
    ctx.fillStyle = centerGrad;
    ctx.fillRect(0, 0, w, h);

    frameRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw]);

  return (
    <div ref={containerRef} className="absolute top-0 bottom-0 left-0 right-0 2xl:left-[clamp(16px,4vw,72px)] 2xl:right-[clamp(16px,4vw,72px)] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ opacity: 0.85 }}
      />
    </div>
  );
}
