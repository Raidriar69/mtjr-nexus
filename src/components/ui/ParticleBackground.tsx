'use client';
import { useEffect, useRef } from 'react';

const COUNT        = 90;   // was 150 — fewer particles = far less draw work
const MOUSE_RADIUS = 130;
const MOUSE_FORCE  = 7;
const FPS_CAP      = 30;   // cap at 30 fps — visually same as 60, half the GPU load
const FRAME_MS     = 1000 / FPS_CAP;

interface P {
  x: number; y: number;
  vx: number; vy: number;
  baseVy: number;
  r: number;
  alpha: number;
}

function make(w: number, h: number, scatter = false): P {
  return {
    x:      Math.random() * w,
    y:      scatter ? Math.random() * h : -Math.random() * 300,
    vx:     (Math.random() - 0.5) * 0.5,
    vy:     0,
    baseVy: 0.6 + Math.random() * 1.6,
    r:      1.2 + Math.random() * 2.6,
    alpha:  0.4 + Math.random() * 0.55,
  };
}

export function ParticleBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mx  = useRef(-9999);
  const my  = useRef(-9999);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const pts = Array.from({ length: COUNT }, () =>
      make(canvas.width, canvas.height, true)
    );

    let id    = 0;
    let lastT = 0;
    const TAU = Math.PI * 2;

    const draw = (ts: number) => {
      id = requestAnimationFrame(draw);

      // ── Hard 30fps cap — skip frame if budget not expired ────
      if (ts - lastT < FRAME_MS) return;
      lastT = ts;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of pts) {
        // Mouse repulsion — avoid sqrt unless inside radius² (cheap early-exit)
        const dx = p.x - mx.current;
        const dy = p.y - my.current;
        const d2 = dx * dx + dy * dy;
        if (d2 < MOUSE_RADIUS * MOUSE_RADIUS && d2 > 0) {
          const d = Math.sqrt(d2);
          const s = ((MOUSE_RADIUS - d) / MOUSE_RADIUS) ** 2 * MOUSE_FORCE;
          p.vx += (dx / d) * s * 0.15;
          p.vy += (dy / d) * s * 0.10;
        }

        // Gravity back to base fall speed, damp horizontal drift
        p.vy += (p.baseVy - p.vy) * 0.02;
        p.vx *= 0.97;
        p.x  += p.vx;
        p.y  += p.vy;

        // Wrap edges
        if (p.x < -20)                 p.x = canvas.width + 10;
        if (p.x > canvas.width + 20)   p.x = -10;
        if (p.y > canvas.height + 20)  Object.assign(p, make(canvas.width, canvas.height));

        // ── Draw: 3 cheap layered solid arcs — NO createRadialGradient ──
        // createRadialGradient allocates a new object every call — that was
        // the main perf killer (150 × 60fps = 9,000 allocs/sec).
        // Layered semi-transparent arcs achieve the same glow look for free.

        // Outer soft halo
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.5, 0, TAU);
        ctx.fillStyle = `rgba(150,190,255,${(p.alpha * 0.12).toFixed(3)})`;
        ctx.fill();

        // Mid glow ring
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2, 0, TAU);
        ctx.fillStyle = `rgba(170,205,255,${(p.alpha * 0.28).toFixed(3)})`;
        ctx.fill();

        // Bright solid core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.75, 0, TAU);
        ctx.fillStyle = `rgba(220,235,255,${Math.min(p.alpha * 1.2, 1).toFixed(3)})`;
        ctx.fill();
      }
    };

    id = requestAnimationFrame(draw);

    const onMove  = (e: MouseEvent) => { mx.current = e.clientX; my.current = e.clientY; };
    const onLeave = ()               => { mx.current = -9999;    my.current = -9999; };
    window.addEventListener('mousemove',  onMove);
    window.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize',     resize);
      window.removeEventListener('mousemove',  onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position:      'fixed',
        inset:         0,
        width:         '100vw',
        height:        '100vh',
        zIndex:        1,
        pointerEvents: 'none',
      }}
      aria-hidden
    />
  );
}
