"use client";

import { useEffect, useRef, useCallback } from "react";
import { Gradient } from "@/lib/gradient";

/*
  Mesh-surface vertices: placed on a grid matching the WebGL plane's
  topology, then displaced each frame by the same simplex-noise-like
  drift so they track the surface. Each vertex fades in over ~2s,
  stays bright for ~3s, then fades out over ~2s before recycling.
*/

interface Vertex {
  // Grid position (0-1 normalised)
  gu: number;
  gv: number;
  // Lifecycle: 0 → fadeIn → hold → fadeOut → 0  (seconds)
  fadeIn: number;
  hold: number;
  fadeOut: number;
  age: number; // current age in seconds
  alive: boolean;
  // Visual
  size: number;
  isBluish: boolean;
  maxOpacity: number;
  // Noise-drift offset (per vertex so they don't all drift identically)
  noiseSeed: number;
}

const COLS = 12;
const ROWS = 8;
const MAX_ACTIVE = 54; // how many can glow at once

function createVertex(): Vertex {
  const col = Math.floor(Math.random() * COLS);
  const row = Math.floor(Math.random() * ROWS);
  return {
    gu: (col + 0.3 + Math.random() * 0.4) / COLS,
    gv: (row + 0.3 + Math.random() * 0.4) / ROWS,
    fadeIn: 1.5 + Math.random() * 1.5,
    hold: 2.0 + Math.random() * 3.0,
    fadeOut: 1.5 + Math.random() * 1.5,
    age: 0,
    alive: true,
    size: 2 + Math.random() * 3,
    isBluish: Math.random() > 0.5,
    maxOpacity: 0.15 + Math.random() * 0.2,
    noiseSeed: Math.random() * 1000,
  };
}

// Simple noise approximation for drift (no dependency needed — just smooth wobble)
function drift(t: number, seed: number): { dx: number; dy: number } {
  return {
    dx: Math.sin(t * 0.3 + seed) * 0.02 + Math.sin(t * 0.17 + seed * 1.3) * 0.01,
    dy: Math.cos(t * 0.25 + seed * 0.7) * 0.015 + Math.cos(t * 0.13 + seed * 1.1) * 0.01,
  };
}

export default function MeshGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowCanvasRef = useRef<HTMLCanvasElement>(null);
  const gradientRef = useRef<Gradient | null>(null);
  const verticesRef = useRef<Vertex[]>([]);
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const initedRef = useRef(false);

  const drawGlow = useCallback((time: number) => {
    const canvas = glowCanvasRef.current;
    if (!canvas) { frameRef.current = requestAnimationFrame(drawGlow); return; }
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

    // Seed initial batch
    if (!initedRef.current) {
      initedRef.current = true;
      for (let i = 0; i < MAX_ACTIVE; i++) {
        const v = createVertex();
        // Stagger start times so they don't all appear at once
        v.age = -(Math.random() * 6);
        verticesRef.current.push(v);
      }
    }

    // Delta time in seconds
    const dt = lastTimeRef.current === 0 ? 0.016 : Math.min((time - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = time;
    const tSec = time / 1000;

    ctx.clearRect(0, 0, w, h);

    const vertices = verticesRef.current;

    for (const v of vertices) {
      if (!v.alive) continue;
      v.age += dt;

      // Not born yet (staggered start)
      if (v.age < 0) continue;

      const totalLife = v.fadeIn + v.hold + v.fadeOut;

      // Lifecycle opacity
      let opacity = 0;
      if (v.age < v.fadeIn) {
        // Fade in
        opacity = v.maxOpacity * (v.age / v.fadeIn);
      } else if (v.age < v.fadeIn + v.hold) {
        // Hold — gentle breathing
        const holdProgress = (v.age - v.fadeIn) / v.hold;
        const breathe = 0.85 + 0.15 * Math.sin(holdProgress * Math.PI * 2);
        opacity = v.maxOpacity * breathe;
      } else if (v.age < totalLife) {
        // Fade out
        const fadeProgress = (v.age - v.fadeIn - v.hold) / v.fadeOut;
        opacity = v.maxOpacity * (1 - fadeProgress);
      } else {
        // Recycle
        Object.assign(v, createVertex());
        v.age = -(Math.random() * 3); // brief delay before next appearance
        continue;
      }

      if (opacity < 0.01) continue;

      // Position: grid UV + noise drift to track mesh surface
      const d = drift(tSec, v.noiseSeed);
      const px = (v.gu + d.dx) * w;
      const py = (v.gv + d.dy) * h;
      const r = v.size + opacity * 2;

      // Glow halo
      const hue = v.isBluish ? "217, 90%, 65%" : "172, 80%, 75%";
      const grad = ctx.createRadialGradient(px, py, 0, px, py, r * 5);
      grad.addColorStop(0, `hsla(${hue}, ${opacity * 0.9})`);
      grad.addColorStop(0.25, `hsla(${hue}, ${opacity * 0.4})`);
      grad.addColorStop(0.6, `hsla(${hue}, ${opacity * 0.1})`);
      grad.addColorStop(1, `hsla(${hue}, 0)`);

      ctx.beginPath();
      ctx.arc(px, py, r * 5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Bright core
      ctx.beginPath();
      ctx.arc(px, py, r * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, ${opacity * 0.7})`;
      ctx.fill();
    }

    frameRef.current = requestAnimationFrame(drawGlow);
  }, []);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(drawGlow);
    return () => cancelAnimationFrame(frameRef.current);
  }, [drawGlow]);

  // WebGL gradient
  useEffect(() => {
    if (!canvasRef.current) return;

    const id = `gradient-canvas-${Math.random().toString(36).slice(2, 8)}`;
    canvasRef.current.id = id;

    const g = new Gradient();
    gradientRef.current = g;
    g.initGradient(`#${id}`);

    return () => {
      g.disconnect();
      gradientRef.current = null;
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 right-0 2xl:left-[clamp(16px,4vw,72px)] 2xl:right-[clamp(16px,4vw,72px)] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{
          ["--gradient-color-1" as string]: "#0b0f14",
          ["--gradient-color-2" as string]: "#2a7a6e",
          ["--gradient-color-3" as string]: "#1a5c6e",
          ["--gradient-color-4" as string]: "#1e3a5f",
          opacity: 0.187,
        }}
      />
      <canvas
        ref={glowCanvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ opacity: 0.7 }}
      />
    </div>
  );
}
